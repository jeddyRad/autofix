import os
import django
import random
try:
    from faker import Faker
    fake = Faker('fr_FR')
except ImportError:
    fake = None
import string

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import ProviderProfile

User = get_user_model()

# Coordonnées réelles des villes de l'application
cities = [
    ('Antananarivo', -18.8792, 47.5079),
    ('Tamatave', -18.1492, 49.4023),
    ('Majunga', -15.7167, 46.3167),
    ('Antsirabe', -19.8659, 47.0333),
    ('Fianarantsoa', -21.4527, 47.0857),
    ('Tulear', -23.35, 43.6667),
    ('Diego Suarez', -12.2787, 49.2905),
]

specialties = ['MECANICIEN', 'DEPANNAGE', 'GARAGE']
names = ["Garage Soasoa", "Meca Rapide", "Auto Fixer", "Dépannage Express", "Super Meca", "Moteur Pro", "Elite Garage", "Pneu 2000"]

def get_random_string(length=8):
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(length))

def generate():
    for i in range(50):
        # Choisir une ville de base
        city_name, base_lat, base_lng = random.choice(cities)
        
        # Disperser les points aléatoirement autour de la ville (jusqu'à ~20km, soit environ 0.18 degré)
        lat = base_lat + random.uniform(-0.15, 0.15)
        lng = base_lng + random.uniform(-0.15, 0.15)
        
        uid = get_random_string(5)
        email = f"prestataire_gps_{i}_{uid}@example.com"
        
        fname = fake.first_name() if fake else "Prenom"
        lname = fake.last_name() if fake else "Nom"
        p_phone = fake.phone_number()[:15] if fake else f"034{get_random_string(6)}"
        desc = fake.text(max_nb_chars=150) if fake else "Description du garage..."
        addr = fake.street_address() if fake else "Avenue Principale"
        b_name = f"{random.choice(names)} {lname}" if fake else f"{random.choice(names)} {uid}"
        
        user = User.objects.create_user(
            email=email,
            password='Password123!',
            first_name=fname,
            last_name=lname,
            phone=p_phone,
            city=city_name,
            role='PROVIDER',
            is_active=True
        )
        
        ProviderProfile.objects.create(
            user=user,
            business_name=b_name,
            bio=desc,
            address=addr,
            latitude=lat,
            longitude=lng,
            specialty=random.choice(specialties),
            experience_years=random.randint(1, 15),
            price_rate=random.randint(15000, 80000),
            rating=round(random.uniform(3.0, 5.0), 2)
        )
        
    print("Succès : 50 prestataires avec coordonnées GPS géolocalisées ont été créés !")

if __name__ == "__main__":
    generate()
