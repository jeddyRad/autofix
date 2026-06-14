
# This file define the API endpoints for user authentication and profile management.
# HOW IT WORKS: These paths map directly to the requests sent from the Angular frontend

from django.urls import path
from .views import RegisterView, CustomTokenObtainPairView, UserProfileView, ProviderListView, ProviderDetailView, VerifyOTPView, ForgotPasswordView, ResetPasswordView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Receives POST requests from AuthService.register() in Angular
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    
    # Receives POST requests from AuthService.login() in Angular. Returns JWT tokens.
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    
    # Endpoint to refresh the JWT access token when it expires.
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Receives GET/PUT requests from AuthService.getProfile() / updateProfile(). 
    # Protected by JWT authentication (handled by frontend auth.interceptor.ts).
    path('me/', UserProfileView.as_view(), name='me'),
    
    # Receives GET requests from frontend ProviderService to list or get service providers.
    path('providers/', ProviderListView.as_view(), name='providers'),
    path('providers/<uuid:id>/', ProviderDetailView.as_view(), name='provider_detail'),
]
