from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.db import models
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

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        user = serializer.save(is_active=False)
        otp = str(random.randint(100000, 999999))
        user.otp_code = otp
        user.otp_created_at = timezone.now()
        user.save()
        
        send_mail(
            'Validation de votre compte AutoFixMG',
            f'Votre code de validation est: {otp}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class ProviderListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = User.objects.filter(role='PROVIDER').select_related('provider_profile')
        city = self.request.query_params.get('city')
        specialty = self.request.query_params.get('specialty')
        search = self.request.query_params.get('search')

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
            return Response({'error': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        if user.is_active:
            return Response({'message': 'User already verified'}, status=status.HTTP_200_OK)
        if user.otp_code != otp:
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        if (timezone.now() - user.otp_created_at).total_seconds() > 600:
            return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = True
        user.otp_code = None
        user.save()
        return Response({'message': 'Email verified successfully'}, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Un email a été envoyé sur votre compte'}, status=status.HTTP_200_OK)
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = user.pk.hex
        reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
        send_mail(
            'Réinitialisation de votre mot de passe',
            f'Cliquez sur ce lien pour réinitialiser votre mot de passe:\n\n{reset_link}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        return Response({'message': 'Un email a été envoyé sur votre compte'}, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        if not uidb64 or not token or not new_password:
            return Response({'error': 'Missing data'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = None
        try:
            clean_uid = uidb64
            # Fix quoted-printable artifact: =3D in email encodes '=', so uid=VALUE
            # appears as uid=3DVALUE. Strip a leading '3D' if uid is 34 chars.
            if len(clean_uid) == 34 and clean_uid[:2].upper() == '3D':
                clean_uid = clean_uid[2:]
            print(f"[DEBUG ResetPassword] raw={repr(uidb64)} clean={repr(clean_uid)}")
            user = User.objects.get(pk=uuid.UUID(hex=clean_uid))
        except Exception as e:
            print(f"[DEBUG ResetPassword] UID lookup error: {e}")
            return Response({'error': 'Invalid link'}, status=status.HTTP_400_BAD_REQUEST)
        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
