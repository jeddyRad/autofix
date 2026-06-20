from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Appointment(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'En attente'),
        ('ACCEPTED', 'Accepté'),
        ('IN_PROGRESS', 'En cours'),
        ('COMPLETED', 'Terminé'),
        ('CANCELLED', 'Annulé'),
    )

    PAYMENT_CHOICES = (
        ('UNPAID', 'Non payé'),
        ('PAID', 'Payé'),
    )

    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='client_appointments')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='provider_appointments')
    date = models.DateField()
    time_slot = models.CharField(max_length=50)
    vehicle_info = models.CharField(max_length=255)
    problem_description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='UNPAID')
    stripe_session_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"RDV {self.id} - {self.client.email} chez {self.provider.email} le {self.date}"

class Review(models.Model):
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name='review')
    client = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_written')
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews_received')
    rating = models.IntegerField(default=5)  # 1 to 5
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Avis {self.id} - Note: {self.rating}/5 pour {self.provider.email}"


class Availability(models.Model):
    """Weekly availability slots defined by providers."""
    WEEKDAY_CHOICES = (
        (0, 'Lundi'),
        (1, 'Mardi'),
        (2, 'Mercredi'),
        (3, 'Jeudi'),
        (4, 'Vendredi'),
        (5, 'Samedi'),
        (6, 'Dimanche'),
    )

    provider = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='availabilities',
        limit_choices_to={'role': 'PROVIDER'}
    )
    weekday = models.IntegerField(choices=WEEKDAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ['weekday', 'start_time']
        unique_together = ['provider', 'weekday', 'start_time']

    def __str__(self):
        return f"{self.provider.email} – {self.get_weekday_display()} {self.start_time}-{self.end_time}"
