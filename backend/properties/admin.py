from django.contrib import admin
from .models import Property, PropertyImage

class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 1
    fields = ['image', 'is_main']
    
@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['name', 'property_type', 'agency', 'owner', 'status', 'is_active']
    list_filter = ['property_type', 'status', 'is_active', 'agency']
    search_fields = ['name', 'location']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [PropertyImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'location', 'property_type', 'status', 'description')
        }),
        ('Details', {
            'fields': ('bedrooms', 'bathrooms', 'living_rooms', 'dining_room', 
                      'area_sqm', 'monthly_rent', 'kitchen_status')
        }),
        ('Amenities', {
            'fields': ('has_balcony', 'has_garden', 'parking_status')
        }),
        ('Relationships', {
            'fields': ('agency', 'owner')
        }),
        ('Status', {
            'fields': ('is_active', 'created_at', 'updated_at')
        }),
    )

@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'property', 'is_main', 'uploaded_at']
    list_filter = ['is_main', 'property']
    list_display_links = ['id', 'property']