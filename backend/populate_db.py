import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import ProviderProfile

User = get_user_model()

User.objects.filter(email__in=['client@test.com', 'garagiste@test.com', 'depanneur@test.com', 'admin@test.com']).delete()

print("Creating admin...")
admin = User.objects.create_superuser(
    email='admin@test.com',
    password='adminpass123',
    first_name='Admin',
    last_name='AutoFix'
)

print("Creating client...")
client = User.objects.create_user(
    email='client@test.com',
    password='clientpass123',
    first_name='Rakoto',
    last_name='Jean',
    role='CLIENT',
    phone='+261 34 11 222 33',
    city='Antananarivo'
)

print("Creating mechanic provider...")
mechanic = User.objects.create_user(
    email='garagiste@test.com',
    password='providerpass123',
    first_name='Rabe',
    last_name='Andry',
    role='PROVIDER',
    phone='+261 32 44 555 66',
    city='Antananarivo'
)
profile1, _ = ProviderProfile.objects.get_or_create(user=mechanic)
profile1.business_name = "Garage du Centre"
profile1.address = "Logement 123, 67ha, Antananarivo"
profile1.specialty = "GARAGE"
profile1.experience_years = 8
profile1.price_rate = 25.0
profile1.bio = "Spécialiste de la réparation moteur, freinage, parallélisme et révision complète pour toutes marques de véhicules."
profile1.rating = 4.8
profile1.is_verified = True
profile1.save()

print("Creating towing provider...")
towing = User.objects.create_user(
    email='depanneur@test.com',
    password='providerpass123',
    first_name='Solo',
    last_name='Pierre',
    role='PROVIDER',
    phone='+261 33 77 888 99',
    city='Tamatave'
)
profile2, _ = ProviderProfile.objects.get_or_create(user=towing)
profile2.business_name = "Madagascar Towing Services"
profile2.address = "Boulevard de la Liberté, Tamatave"
profile2.specialty = "DEPANNAGE"
profile2.experience_years = 5
profile2.price_rate = 40.0
profile2.bio = "Service de remorquage rapide 24h/24 et 7j/7 dans toute la région de Tamatave. Dépannage sur place."
profile2.rating = 4.5
profile2.is_verified = True
profile2.save()

print("Database successfully populated with test accounts!")
