from django.contrib import admin
from .models import Appointment, Review


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'client', 'provider', 'date', 'time_slot',
        'status', 'payment_status', 'price', 'created_at',
    )
    list_filter = ('status', 'payment_status', 'date')
    search_fields = (
        'client__email', 'provider__email',
        'vehicle_info', 'problem_description',
    )
    ordering = ('-created_at',)
    readonly_fields = ('stripe_session_id', 'created_at', 'updated_at')
    actions = ['mark_completed', 'mark_cancelled']

    def mark_completed(self, request, queryset):
        queryset.update(status='COMPLETED')
    mark_completed.short_description = 'Marquer sélectionnés comme Terminés'

    def mark_cancelled(self, request, queryset):
        queryset.update(status='CANCELLED')
    mark_cancelled.short_description = 'Annuler les rendez-vous sélectionnés'


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'provider', 'client', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('provider__email', 'client__email', 'comment')
    ordering = ('-created_at',)
    actions = ['delete_selected']
