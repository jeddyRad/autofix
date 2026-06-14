import stripe
from django.conf import settings
from rest_framework import viewsets, status, generics, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Appointment, Review
from .serializers import AppointmentSerializer, ReviewSerializer
from accounts.models import ProviderProfile
from django.db.models import Avg

stripe.api_key = settings.STRIPE_SECRET_KEY

class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Appointment.objects.all().order_by('-date')
        elif user.role == 'PROVIDER':
            return Appointment.objects.filter(provider=user).order_by('-date')
        else:
            return Appointment.objects.filter(client=user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(client=self.request.user, status='PENDING')

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        appointment = self.get_object()
        if appointment.provider != request.user and request.user.role != 'ADMIN':
            return Response({'detail': 'Non autorisÃ©'}, status=status.HTTP_403_FORBIDDEN)
        
        price = request.data.get('price')
        if price is not None:
            appointment.price = price
            
        appointment.status = 'ACCEPTED'
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        if appointment.client != request.user and appointment.provider != request.user and request.user.role != 'ADMIN':
            return Response({'detail': 'Non autorisÃ©'}, status=status.HTTP_403_FORBIDDEN)
        
        appointment.status = 'CANCELLED'
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        appointment = self.get_object()
        if appointment.provider != request.user and request.user.role != 'ADMIN':
            return Response({'detail': 'Non autorisÃ©'}, status=status.HTTP_403_FORBIDDEN)
        
        appointment.status = 'COMPLETED'
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Review.objects.all()

    def perform_create(self, serializer):
        appointment = serializer.validated_data['appointment']
        if appointment.client != self.request.user:
            raise serializers.ValidationError("Vous n'Ãªtes pas autorisÃ© Ã  Ã©valuer ce rendez-vous.")
        if appointment.status != 'COMPLETED':
            raise serializers.ValidationError("Le rendez-vous doit Ãªtre terminÃ© pour laisser un avis.")
            
        serializer.save(client=self.request.user, provider=appointment.provider)

        # Recalculate average rating for the provider
        provider = appointment.provider
        avg_rating = Review.objects.filter(provider=provider).aggregate(Avg('rating'))['rating__avg']
        if avg_rating is not None:
            profile, created = ProviderProfile.objects.get_or_create(user=provider)
            profile.rating = round(avg_rating, 1)
            profile.save()


class CreateStripeSessionView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        appointment_id = request.data.get('appointment_id')
        if not appointment_id:
            return Response({'error': 'appointment_id est requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(id=appointment_id)
        except Appointment.DoesNotExist:
            return Response({'error': 'Rendez-vous introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if appointment.client != request.user:
            return Response({'error': 'Non autorisÃ©'}, status=status.HTTP_403_FORBIDDEN)

        if appointment.status != 'ACCEPTED':
            return Response({'error': 'Le rendez-vous doit Ãªtre acceptÃ© pour procÃ©der au paiement'}, status=status.HTTP_400_BAD_REQUEST)

        if appointment.price <= 0:
            return Response({'error': 'Le prix du rendez-vous doit Ãªtre supÃ©rieur Ã  0'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f"Service AutoFixMG - {appointment.provider.first_name} {appointment.provider.last_name}",
                            'description': f"Panne : {appointment.problem_description[:100]} | VÃ©hicule : {appointment.vehicle_info}",
                        },
                        'unit_amount': int(appointment.price * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}&appointment_id={appointment.id}",
                cancel_url=f"{settings.FRONTEND_URL}/payment/cancel",
            )

            appointment.stripe_session_id = session.id
            appointment.save()

            return Response({'checkout_url': session.url})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyPaymentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        session_id = request.query_params.get('session_id')
        appointment_id = request.query_params.get('appointment_id')

        if not session_id or not appointment_id:
            return Response({'error': 'session_id et appointment_id sont requis'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            appointment = Appointment.objects.get(id=appointment_id, stripe_session_id=session_id)
            if appointment.client != request.user:
                return Response({'error': 'Non autorisÃ©'}, status=status.HTTP_403_FORBIDDEN)

            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status == 'paid':
                appointment.payment_status = 'PAID'
                appointment.save()
                return Response({'status': 'PAID', 'message': 'Paiement validÃ© avec succÃ¨s.'})
            else:
                return Response({'status': 'UNPAID', 'message': 'Le paiement n\'a pas encore Ã©tÃ© effectuÃ©.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

