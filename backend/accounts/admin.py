from django.contrib import admin
from .models import User, ProviderProfile


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'city')
    list_filter = ('role', 'is_active')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    actions = ['activate_users']

    def activate_users(self, request, queryset):
        queryset.update(is_active=True)
    activate_users.short_description = 'Activer les comptes sélectionnés'


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('business_name', 'specialty', 'user', 'is_verified', 'rating', 'city_display')
    list_filter = ('specialty', 'is_verified')
    search_fields = ('business_name', 'user__email')
    actions = ['validate_providers']

    def city_display(self, obj):
        return obj.user.city or '—'
    city_display.short_description = 'Ville'

    def validate_providers(self, request, queryset):
        queryset.update(is_verified=True)
    validate_providers.short_description = 'Valider les prestataires sélectionnés'
