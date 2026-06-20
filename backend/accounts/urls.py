
# This file defines the API endpoints for user authentication and profile management.
# HOW IT WORKS: These paths map directly to the requests sent from the Angular frontend

from django.urls import path
from .views import (
    RegisterView, CustomTokenObtainPairView, UserProfileView,
    ProviderListView, ProviderDetailView,
    VerifyOTPView, ResendOTPView,
    ForgotPasswordView, ResetPasswordView,
    DeleteAccountView,
    AdminProviderVerifyView,
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # ── Registration & OTP ──────────────────────────────────────────────────────
    # POST: AuthService.register() → creates inactive user + sends OTP email
    path('register/', RegisterView.as_view(), name='register'),
    # POST: { email, otp } → activates account
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    # POST: { email } → generates and resends a fresh OTP
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'),

    # ── Login & Token ────────────────────────────────────────────────────────────
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # ── Password Reset ───────────────────────────────────────────────────────────
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),

    # ── Authenticated User ───────────────────────────────────────────────────────
    # GET/PUT: profile (JWT protected)
    path('me/', UserProfileView.as_view(), name='me'),
    # DELETE: { password } → permanently deletes the account (JWT protected)
    path('me/delete/', DeleteAccountView.as_view(), name='delete_account'),

    # ── Provider Search ──────────────────────────────────────────────────────────
    path('providers/', ProviderListView.as_view(), name='providers'),
    path('providers/<uuid:id>/', ProviderDetailView.as_view(), name='provider_detail'),

    # ── Admin Actions ────────────────────────────────────────────────────────────
    # POST: ADMIN only → validates a provider's account
    path('admin/providers/<uuid:provider_id>/verify/', AdminProviderVerifyView.as_view(), name='admin_verify_provider'),
]
