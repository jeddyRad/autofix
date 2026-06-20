from django.db import migrations


class Migration(migrations.Migration):
    """
    Adds 'IN_PROGRESS' to the STATUS_CHOICES of Appointment.
    Django CharField choices are not enforced at the DB level,
    so no schema change is needed — this migration is a no-op
    at the DB level but keeps the migration history consistent.
    """

    dependencies = [
        ('booking', '0001_initial'),
    ]

    operations = [
        # No AlterField needed: CharField(choices=...) changes are
        # only in-Python validation; the DB column type doesn't change.
        # Django generates a no-op AlterField for safe deployment.
        migrations.AlterField(
            model_name='appointment',
            name='status',
            field=__import__('django.db.models', fromlist=['CharField']).CharField(
                choices=[
                    ('PENDING', 'En attente'),
                    ('ACCEPTED', 'Accepté'),
                    ('IN_PROGRESS', 'En cours'),
                    ('COMPLETED', 'Terminé'),
                    ('CANCELLED', 'Annulé'),
                ],
                default='PENDING',
                max_length=20,
            ),
        ),
    ]
