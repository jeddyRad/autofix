from rest_framework import serializers
from .models import Appointment, Review
from django.contrib.auth import get_user_model
from accounts.serializers import UserSerializer

User = get_user_model()

class ReviewSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ('id', 'appointment', 'client', 'provider', 'rating', 'comment', 'created_at', 'client_name')
        read_only_fields = ('client', 'provider', 'client_name')

    def get_client_name(self, obj):
        return f"{obj.client.first_name} {obj.client.last_name}"

class AppointmentSerializer(serializers.ModelSerializer):
    client_detail = UserSerializer(source='client', read_only=True)
    provider_detail = UserSerializer(source='provider', read_only=True)
    review_detail = ReviewSerializer(source='review', read_only=True)

    class Meta:
        model = Appointment
        fields = (
            'id', 'client', 'provider', 'date', 'time_slot', 
            'vehicle_info', 'problem_description', 'status', 
            'price', 'payment_status', 'stripe_session_id', 
            'created_at', 'updated_at', 'client_detail', 'provider_detail', 'review_detail'
        )
        read_only_fields = ('client', 'payment_status', 'stripe_session_id', 'client_detail', 'provider_detail', 'review_detail')
