from django.contrib import admin
from .models import Property

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['name', 'property_type', 'agency', 'owner', 'is_active']
    list_filter = ['property_type', 'is_active', 'agency']
    search_fields = ['name', 'location']
    readonly_fields = ['created_at']