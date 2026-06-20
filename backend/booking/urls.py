from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, ReviewViewSet, AvailabilityViewSet, CreateStripeSessionView, VerifyPaymentView

router = DefaultRouter()
router.register('appointments', AppointmentViewSet, basename='appointment')
router.register('reviews', ReviewViewSet, basename='review')
router.register('availability', AvailabilityViewSet, basename='availability')

urlpatterns = [
    path('', include(router.urls)),
    path('payments/create-session/', CreateStripeSessionView.as_view(), name='create_stripe_session'),
    path('payments/verify/', VerifyPaymentView.as_view(), name='verify_payment'),
]
