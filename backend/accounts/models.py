from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import uuid

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('CLIENT', 'Client'),
        ('PROVIDER', 'Prestataire'),
        ('ADMIN', 'Administrateur'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='CLIENT')
    phone = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_created_at = models.DateTimeField(blank=True, null=True)
    
    username = None
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    objects = UserManager()

    def __str__(self):
        return f"{self.email} ({self.role})"

class ProviderProfile(models.Model):
    SPECIALTY_CHOICES = (
        ('MECANICIEN', 'Mécanicien'),
        ('DEPANNAGE', 'Dépannage / Remorquage'),
        ('GARAGE', 'Garage complet'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    business_name = models.CharField(max_length=100)
    address = models.CharField(max_length=255)
    specialty = models.CharField(max_length=20, choices=SPECIALTY_CHOICES, default='MECANICIEN')
    experience_years = models.IntegerField(default=0)
    price_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    bio = models.TextField(blank=True, null=True)
    rating = models.FloatField(default=0.0)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.business_name} - {self.specialty}"

