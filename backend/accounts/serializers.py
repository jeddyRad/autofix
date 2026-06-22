from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

from .models import ProviderProfile

class ProviderProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderProfile
        fields = (
            'business_name', 'address', 'specialty', 'experience_years',
            'price_rate', 'bio', 'rating', 'is_verified',
            'latitude', 'longitude',
        )
        read_only_fields = ('rating', 'is_verified')

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    provider_profile = ProviderProfileSerializer(required=False, allow_null=True)
    # Populated by ProviderListView when a geolocation query is made
    distance_km = serializers.SerializerMethodField(read_only=True)

    def get_distance_km(self, obj):
        # Annotation injected by ProviderListView.get_queryset()
        return getattr(obj, 'distance_km', None)

    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'first_name', 'last_name',
                  'role', 'phone', 'city', 'provider_profile', 'distance_km')
        read_only_fields = ('id',)

    def validate(self, data):
        # We only require provider_profile during creation
        if self.instance is None and data.get('role') == 'PROVIDER' and not data.get('provider_profile'):
            raise serializers.ValidationError("Un profil prestataire est obligatoire pour les PROVIDER.")
        return data

    def create(self, validated_data):
        profile_data = validated_data.pop('provider_profile', None)
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'CLIENT'),
            phone=validated_data.get('phone', ''),
            city=validated_data.get('city', ''),
            is_active=False
        )
        if user.role == 'PROVIDER' and profile_data:
            ProviderProfile.objects.create(user=user, **profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('provider_profile', None)
        password = validated_data.pop('password', None)
        validated_data.pop('email', None) # DO NOT allow email updates
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
        instance.save()
        
        if instance.role == 'PROVIDER' and profile_data is not None:
            profile, created = ProviderProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance
