from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import Avg, Sum, Count
from decimal import Decimal
from .serializers import UserSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework.views import APIView
import random
import uuid
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


def _send_otp_email(user, otp):
    """Helper that sends an OTP email, logging failure without crashing the request."""
    try:
        subject = f"[AutoFix MG] Vérification de votre compte - Code : {otp}"
        message = (
            f"Bonjour {user.first_name},\n\n"
            f"Bienvenue sur AutoFix MG, votre plateforme de confiance pour l'entretien automobile à Madagascar.\n\n"
            f"Pour finaliser la création de votre compte, veuillez utiliser le code de sécurité ci-dessous :\n\n"
            f"CODE DE VALIDATION : {otp}\n\n"
            f"Ce code est strictement personnel et expirera dans 10 minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.\n\n"
            f"À très bientôt sur notre plateforme,\n"
            f"L'équipe AutoFix MG"
        )
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.error('[OTP] Envoi email échoué pour %s : %s', user.email, exc)


class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save(is_active=False)
        otp = str(random.randint(100000, 999999))
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save()
        _send_otp_email(user, otp)


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class DeleteAccountView(APIView):
    """
    DELETE /api/auth/me/delete/
    Body: { "password": "..." }
    Requires authentication. Verifies password then permanently deletes the account.
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        password = request.data.get('password')
        if not password:
            return Response({'error': 'Le mot de passe est requis pour confirmer la suppression.'},
                            status=status.HTTP_400_BAD_REQUEST)
        user = request.user
        if not user.check_password(password):
            return Response({'error': 'Mot de passe incorrect.'},
                            status=status.HTTP_400_BAD_REQUEST)
        user.delete()
        return Response({'message': 'Compte supprimé avec succès.'}, status=status.HTTP_200_OK)


class ProviderListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from django.db.models.expressions import RawSQL
        queryset = User.objects.filter(role='PROVIDER').select_related('provider_profile')
        city = self.request.query_params.get('city')
        specialty = self.request.query_params.get('specialty')
        search = self.request.query_params.get('search')
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radius = self.request.query_params.get('radius', 50)  # km, default 50

        if city:
            queryset = queryset.filter(city__icontains=city)
        if specialty:
            queryset = queryset.filter(provider_profile__specialty=specialty)
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(provider_profile__business_name__icontains=search) |
                models.Q(provider_profile__bio__icontains=search)
            )

        # ── Geolocation filter (Haversine, SQL) ───────────────────────────────────
        if lat and lng:
            try:
                lat_f = float(lat)
                lng_f = float(lng)
                radius_f = float(radius)
            except (ValueError, TypeError):
                return queryset

            # Haversine formula in raw SQL (PostgreSQL math functions)
            # We use RawSQL but avoid hardcoding the table name prefix if possible, 
            # though Django's table names are predictable.
            haversine_sql = """
                6371.0 * 2.0 * ASIN(SQRT(
                    POWER(SIN(RADIANS((accounts_providerprofile.latitude - %s) / 2.0)), 2)
                    + COS(RADIANS(%s))
                    * COS(RADIANS(accounts_providerprofile.latitude))
                    * POWER(SIN(RADIANS((accounts_providerprofile.longitude - %s) / 2.0)), 2)
                ))
            """
            
            # Use filter on the profile fields before annotating to ensure join is present
            queryset = queryset.filter(
                provider_profile__latitude__isnull=False,
                provider_profile__longitude__isnull=False
            ).annotate(
                distance_km=RawSQL(
                    haversine_sql, 
                    (lat_f, lat_f, lng_f),
                    output_field=models.FloatField()
                )
            ).filter(
                distance_km__lte=radius_f
            ).order_by('distance_km')

        return queryset



class ProviderDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    queryset = User.objects.filter(role='PROVIDER').select_related('provider_profile')
    lookup_field = 'id'


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['id'] = str(self.user.id)
        data['email'] = self.user.email
        data['role'] = self.user.role
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        if not email or not otp:
            return Response({'error': 'Email et OTP sont requis.'},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Utilisateur introuvable.'},
                            status=status.HTTP_404_NOT_FOUND)

        if user.is_active:
            return Response({'message': 'Compte déjà vérifié.'}, status=status.HTTP_200_OK)

        # Guard: otp_created_at may be None if registration had a partial failure
        if not user.otp_code or user.otp_created_at is None:
            return Response({'error': 'Aucun OTP actif. Veuillez relancer l\'inscription.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if (timezone.now() - user.otp_created_at).total_seconds() > 600:
            return Response({'error': 'OTP expiré. Veuillez en demander un nouveau.'},
                            status=status.HTTP_400_BAD_REQUEST)

        if user.otp_code != otp:
            return Response({'error': 'Code OTP invalide.'},
                            status=status.HTTP_400_BAD_REQUEST)

        user.is_active = True
        user.otp_code = None
        user.otp_created_at = None
        user.save()
        return Response({'message': 'Email vérifié avec succès.'}, status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    """
    POST /api/auth/resend-otp/
    Body: { "email": "..." }
    Generates a fresh OTP and re-sends the verification email.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal existence — return same response
            return Response({'message': 'Si ce compte existe, un nouvel OTP a été envoyé.'},
                            status=status.HTTP_200_OK)

        if user.is_active:
            return Response({'message': 'Compte déjà vérifié.'}, status=status.HTTP_200_OK)

        otp = str(random.randint(100000, 999999))
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save()
        _send_otp_email(user, otp)
        return Response({'message': 'Si ce compte existe, un nouvel OTP a été envoyé.'},
                        status=status.HTTP_200_OK)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email requis.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Si ce compte existe, un email a été envoyé.'},
                            status=status.HTTP_200_OK)

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = user.pk.hex
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        try:
            subject = "[AutoFix MG] Réinitialisation de votre mot de passe"
            message = (
                f"Bonjour {user.first_name},\n\n"
                f"Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte AutoFix MG.\n"
                f"Vous pouvez modifier votre mot de passe en cliquant sur le lien ci-dessous :\n\n"
                f"{reset_link}\n\n"
                f"Ce lien est valable pendant 24 heures. Si vous n'avez pas demandé ce changement, aucune action n'est requise de votre part et votre mot de passe actuel restera inchangé.\n\n"
                f"Cordialement,\n"
                f"L'équipe AutoFix MG"
            )
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.error('[PasswordReset] Envoi email échoué pour %s : %s', user.email, exc)

        return Response({'message': 'Si ce compte existe, un email a été envoyé.'},
                        status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not uidb64 or not token or not new_password:
            return Response({'error': 'Données manquantes.'}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        try:
            clean_uid = uidb64
            # Fix quoted-printable artifact: =3D in email encodes '='
            if len(clean_uid) == 34 and clean_uid[:2].upper() == '3D':
                clean_uid = clean_uid[2:]
            logger.debug('[ResetPassword] raw=%r clean=%r', uidb64, clean_uid)
            user = User.objects.get(pk=uuid.UUID(hex=clean_uid))
        except Exception as exc:
            logger.debug('[ResetPassword] UID lookup error: %s', exc)
            return Response({'error': 'Lien invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'error': 'Token invalide ou expiré.'},
                            status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Mot de passe réinitialisé avec succès.'},
                        status=status.HTTP_200_OK)


# ─── Admin-only endpoints ──────────────────────────────────────────────────────

class IsAdminUser(IsAuthenticated):
    """Permission that requires the user to have role ADMIN."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'ADMIN'


class AdminProviderVerifyView(APIView):
    """
    POST /api/auth/admin/providers/<provider_id>/verify/
    Sets is_verified=True on the ProviderProfile (ADMIN only).
    """
    permission_classes = [IsAdminUser]

    def post(self, request, provider_id):
        try:
            provider = User.objects.get(pk=provider_id, role='PROVIDER')
        except User.DoesNotExist:
            return Response({'error': 'Prestataire introuvable.'},
                            status=status.HTTP_404_NOT_FOUND)
        profile, _ = provider.provider_profile.__class__.objects.get_or_create(user=provider)
        profile.is_verified = True
        profile.save()
        return Response({'message': f'Prestataire {provider.email} validé.'}, status=status.HTTP_200_OK)


class IsProviderUser(IsAuthenticated):
    """Permission that requires the user to have role PROVIDER."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.role == 'PROVIDER'


class ProviderStatsView(APIView):
    """
    GET /api/auth/provider/stats/
    Returns statistics for the authenticated provider:
    - nb_appointments_total
    - nb_completed
    - revenue_total
    - average_rating
    - nb_reviews
    """
    permission_classes = [IsProviderUser]

    def get(self, request):
        from booking.models import Appointment, Review
        user = request.user

        apts = Appointment.objects.filter(provider=user)
        completed = apts.filter(status='COMPLETED')
        paid_completed = completed.filter(payment_status='PAID')

        revenue = paid_completed.aggregate(total=Sum('price'))['total'] or Decimal('0')
        avg = Review.objects.filter(provider=user).aggregate(avg=Avg('rating'))['avg']
        nb_reviews = Review.objects.filter(provider=user).count()

        return Response({
            'nb_appointments_total': apts.count(),
            'nb_completed': completed.count(),
            'revenue_total': float(revenue),
            'average_rating': round(avg, 2) if avg else 0.0,
            'nb_reviews': nb_reviews,
            'completion_rate': round((completed.count() / apts.count()) * 100, 1) if apts.count() > 0 else 0.0,
        })
