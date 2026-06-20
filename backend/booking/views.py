import csv
import stripe
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from rest_framework import viewsets, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Appointment, Review, Availability
from .serializers import AppointmentSerializer, ReviewSerializer, AvailabilitySerializer
from accounts.models import ProviderProfile
from django.db.models import Avg

stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)


# ─── Email Helpers ────────────────────────────────────────────────────────────

def _notify_appointment(subject: str, body: str, *recipients):
    """Send notification email to one or more recipients, failing silently."""
    emails = [e for e in recipients if e]
    if not emails:
        return
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, emails, fail_silently=False)
    except Exception as exc:
        logger.error('[Notification] Envoi email échoué : %s', exc)


# ─── Permission helpers ────────────────────────────────────────────────────────

def _is_admin(user):
    return user.role == 'ADMIN'


# ─── Appointment ViewSet ──────────────────────────────────────────────────────

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if _is_admin(user):
            qs = Appointment.objects.all()
        elif user.role == 'PROVIDER':
            qs = Appointment.objects.filter(provider=user)
        else:
            qs = Appointment.objects.filter(client=user)

        # Optional filters
        status_filter = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if date_from:
            qs = qs.filter(date__gte=date_from)
        if date_to:
            qs = qs.filter(date__lte=date_to)

        return qs.order_by('-date')

    def perform_create(self, serializer):
        serializer.save(client=self.request.user, status='PENDING')

    def partial_update(self, request, *args, **kwargs):
        """
        PATCH /api/appointments/<id>/
        Client can modify date/time_slot/vehicle_info/problem_description
        only while the appointment is still PENDING.
        """
        appointment = self.get_object()
        if appointment.client != request.user and not _is_admin(request.user):
            return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        if appointment.status != 'PENDING':
            return Response(
                {'detail': 'Seuls les rendez-vous en attente peuvent être modifiés.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        allowed_fields = {'date', 'time_slot', 'vehicle_info', 'problem_description'}
        data = {k: v for k, v in request.data.items() if k in allowed_fields}
        serializer = self.get_serializer(appointment, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    # ── CSV Export ───────────────────────────────────────────────────────────

    @action(detail=False, methods=['get'], url_path='export')
    def export_csv(self, request):
        """GET /api/appointments/export/ — Download appointments as CSV."""
        qs = self.get_queryset()
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="historique-interventions.csv"'
        response.write('\ufeff')  # UTF-8 BOM for Excel compatibility

        writer = csv.writer(response, delimiter=';')
        writer.writerow([
            'ID', 'Date', 'Créneau', 'Statut', 'Paiement',
            'Client', 'Prestataire', 'Véhicule', 'Problème', 'Prix (€)'
        ])

        for apt in qs:
            writer.writerow([
                str(apt.id),
                str(apt.date),
                apt.time_slot,
                apt.get_status_display(),
                apt.get_payment_status_display(),
                f"{apt.client.first_name} {apt.client.last_name}",
                f"{apt.provider.first_name} {apt.provider.last_name}",
                apt.vehicle_info,
                apt.problem_description,
                str(apt.price),
            ])

        return response

    # ── Status transition actions ────────────────────────────────────────────

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Provider or Admin accepts a PENDING appointment."""
        appointment = self.get_object()
        if appointment.provider != request.user and not _is_admin(request.user):
            return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        if appointment.status != 'PENDING':
            return Response({'detail': 'Seul un rendez-vous en attente peut être accepté.'},
                            status=status.HTTP_400_BAD_REQUEST)

        price = request.data.get('price')
        if price is not None:
            try:
                appointment.price = float(price)
            except (TypeError, ValueError):
                return Response({'detail': 'Prix invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        appointment.status = 'ACCEPTED'
        appointment.save()

        # ── Email notification ──
        provider_name = f"{appointment.provider.first_name} {appointment.provider.last_name}"
        client_name = f"{appointment.client.first_name} {appointment.client.last_name}"
        _notify_appointment(
            f"✅ Votre rendez-vous du {appointment.date} a été accepté – AutoFix MG",
            (
                f"Bonjour {client_name},\n\n"
                f"Votre rendez-vous du {appointment.date} ({appointment.time_slot}) "
                f"avec {provider_name} a été accepté.\n"
                f"Prix convenu : {appointment.price} €\n\n"
                "Connectez-vous pour procéder au paiement.\n\nAutoFix MG"
            ),
            appointment.client.email,
        )
        _notify_appointment(
            f"📋 Nouveau rendez-vous confirmé le {appointment.date} – AutoFix MG",
            (
                f"Bonjour {provider_name},\n\n"
                f"Vous avez accepté le rendez-vous de {client_name} "
                f"pour le {appointment.date} ({appointment.time_slot}).\n"
                f"Véhicule : {appointment.vehicle_info}\n"
                f"Problème : {appointment.problem_description}\n\nAutoFix MG"
            ),
            appointment.provider.email,
        )

        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Provider marks an ACCEPTED appointment as IN_PROGRESS."""
        appointment = self.get_object()
        if appointment.provider != request.user and not _is_admin(request.user):
            return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        if appointment.status != 'ACCEPTED':
            return Response({'detail': 'Seul un rendez-vous accepté peut être démarré.'},
                            status=status.HTTP_400_BAD_REQUEST)
        appointment.status = 'IN_PROGRESS'
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Provider closes an IN_PROGRESS appointment as COMPLETED."""
        appointment = self.get_object()
        if appointment.provider != request.user and not _is_admin(request.user):
            return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        if appointment.status not in ('ACCEPTED', 'IN_PROGRESS'):
            return Response({'detail': 'Seul un rendez-vous accepté ou en cours peut être clôturé.'},
                            status=status.HTTP_400_BAD_REQUEST)
        appointment.status = 'COMPLETED'
        appointment.save()

        # ── Email notification ──
        client_name = f"{appointment.client.first_name} {appointment.client.last_name}"
        provider_name = f"{appointment.provider.first_name} {appointment.provider.last_name}"
        _notify_appointment(
            f"🏁 Votre intervention du {appointment.date} est terminée – AutoFix MG",
            (
                f"Bonjour {client_name},\n\n"
                f"L'intervention de {provider_name} du {appointment.date} est maintenant clôturée.\n"
                f"Montant payé : {appointment.price} €\n\n"
                "N'hésitez pas à laisser un avis sur la prestation.\n\nAutoFix MG"
            ),
            appointment.client.email,
        )

        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Client, provider, or Admin can cancel a non-terminal appointment."""
        appointment = self.get_object()
        user = request.user
        if (appointment.client != user and appointment.provider != user
                and not _is_admin(user)):
            return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        if appointment.status in ('COMPLETED', 'CANCELLED'):
            return Response(
                {'detail': 'Ce rendez-vous ne peut plus être annulé.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        appointment.status = 'CANCELLED'
        appointment.save()

        # ── Email notification ──
        cancelled_by = f"{user.first_name} {user.last_name}"
        _notify_appointment(
            f"❌ Rendez-vous du {appointment.date} annulé – AutoFix MG",
            (
                f"Bonjour,\n\n"
                f"Le rendez-vous du {appointment.date} ({appointment.time_slot}) "
                f"a été annulé par {cancelled_by}.\n\nAutoFix MG"
            ),
            appointment.client.email,
            appointment.provider.email,
        )

        return Response(AppointmentSerializer(appointment).data)


# ─── Review ViewSet ────────────────────────────────────────────────────────────

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.all().select_related('client', 'provider', 'appointment')

    def perform_create(self, serializer):
        appointment = serializer.validated_data['appointment']

        if appointment.client != self.request.user:
            raise serializers.ValidationError(
                "Vous n'êtes pas autorisé à évaluer ce rendez-vous."
            )
        if appointment.status != 'COMPLETED':
            raise serializers.ValidationError(
                "Le rendez-vous doit être terminé pour laisser un avis."
            )
        # Guard: prevent duplicate reviews
        if hasattr(appointment, 'review'):
            raise serializers.ValidationError(
                "Un avis a déjà été déposé pour ce rendez-vous."
            )

        serializer.save(client=self.request.user, provider=appointment.provider)

        # Recalculate average rating for the provider
        provider = appointment.provider
        avg_rating = (
            Review.objects.filter(provider=provider)
            .aggregate(Avg('rating'))['rating__avg']
        )
        if avg_rating is not None:
            profile, _ = ProviderProfile.objects.get_or_create(user=provider)
            profile.rating = round(avg_rating, 1)
            profile.save()


# ─── Availability ViewSet ─────────────────────────────────────────────────────

class AvailabilityViewSet(viewsets.ModelViewSet):
    """
    CRUD for provider weekly availability slots.
    GET /api/availability/?provider=<id>  — list all slots (public)
    POST /api/availability/               — create a slot (PROVIDER only)
    DELETE /api/availability/<id>/        — delete a slot (PROVIDER only)
    """
    serializer_class = AvailabilitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        provider_id = self.request.query_params.get('provider')
        if provider_id:
            return Availability.objects.filter(provider_id=provider_id)
        user = self.request.user
        if user.role == 'PROVIDER':
            return Availability.objects.filter(provider=user)
        if user.role == 'ADMIN':
            return Availability.objects.all()
        # Clients: must specify a provider_id
        return Availability.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'PROVIDER':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les prestataires peuvent gérer leurs disponibilités.")
        serializer.save(provider=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.provider != request.user and not _is_admin(request.user):
            return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Stripe Payment Views ──────────────────────────────────────────────────────

class CreateStripeSessionView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        appointment_id = request.data.get('appointment_id')
        if not appointment_id:
            return Response({'error': 'appointment_id est requis.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response({'error': 'Rendez-vous introuvable.'},
                            status=status.HTTP_404_NOT_FOUND)

        if appointment.client != request.user:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        if appointment.status != 'ACCEPTED':
            return Response(
                {'error': 'Le rendez-vous doit être accepté pour procéder au paiement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if appointment.payment_status == 'PAID':
            return Response({'error': 'Ce rendez-vous a déjà été payé.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if appointment.price <= 0:
            return Response(
                {'error': 'Le prix du rendez-vous doit être supérieur à 0.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': (
                                f"Service AutoFixMG – "
                                f"{appointment.provider.first_name} {appointment.provider.last_name}"
                            ),
                            'description': (
                                f"Panne : {appointment.problem_description[:100]} | "
                                f"Véhicule : {appointment.vehicle_info}"
                            ),
                        },
                        'unit_amount': int(appointment.price * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=(
                    f"{settings.FRONTEND_URL}/payment/success"
                    f"?session_id={{CHECKOUT_SESSION_ID}}&appointment_id={appointment.id}"
                ),
                cancel_url=f"{settings.FRONTEND_URL}/payment/cancel",
                metadata={
                    'appointment_id': str(appointment.id),
                    'client_id': str(appointment.client.id),
                },
            )

            appointment.stripe_session_id = session.id
            appointment.save()

            return Response({'checkout_url': session.url})
        except stripe.error.StripeError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPaymentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        session_id = request.query_params.get('session_id')
        appointment_id = request.query_params.get('appointment_id')

        if not session_id or not appointment_id:
            return Response({'error': 'session_id et appointment_id sont requis.'},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(id=appointment_id, stripe_session_id=session_id)
        except Appointment.DoesNotExist:
            return Response({'error': 'Session introuvable ou incohérente.'},
                            status=status.HTTP_404_NOT_FOUND)

        if appointment.client != request.user:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == 'paid':
                appointment.payment_status = 'PAID'
                appointment.save()
                return Response({'status': 'PAID', 'message': 'Paiement validé avec succès.'})
            else:
                return Response({'status': 'UNPAID', 'message': "Le paiement n'a pas encore été effectué."})
        except stripe.error.StripeError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            return Response({'error': str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
