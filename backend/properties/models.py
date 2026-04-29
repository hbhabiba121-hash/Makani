from django.db import models
from agencies.models import Agency
from owners.models import Owner

class Property(models.Model):
    
    class PropertyType(models.TextChoices):
        APARTMENT = 'apartment', 'Apartment'
        VILLA = 'villa', 'Villa'
        STUDIO = 'studio', 'Studio'
        HOUSE = 'house', 'House'
        COMMERCIAL = 'commercial', 'Commercial'
        OTHER = 'other', 'Other'
    
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Available'
        RENTED = 'rented', 'Rented'
        MAINTENANCE = 'maintenance', 'Under Maintenance'
        PENDING = 'pending', 'Pending'
    
    # Relationships
    agency = models.ForeignKey(
        Agency, 
        on_delete=models.CASCADE, 
        related_name='properties',
        null=True,
        blank=True
    )
    owner = models.ForeignKey(
        Owner, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='properties'
    )
    
    # Basic information
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=300)
    property_type = models.CharField(
        max_length=20, 
        choices=PropertyType.choices, 
        default=PropertyType.APARTMENT
    )
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.AVAILABLE
    )
    
    # Details
    description = models.TextField(blank=True)
    bedrooms = models.IntegerField(default=0)
    bathrooms = models.IntegerField(default=0)
    area_sqm = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Additional fields
    living_rooms = models.IntegerField(default=0, null=True, blank=True)
    kitchen_status = models.IntegerField(choices=[(1, 'Full Kitchen'), (2, 'Semi Kitchen'), (3, 'No Kitchen')], null=True, blank=True)
    dining_room = models.IntegerField(default=0, null=True, blank=True)
    has_balcony = models.BooleanField(default=False)
    has_garden = models.BooleanField(default=False)
    parking_status = models.CharField(max_length=20, choices=[('no', 'No Parking'), ('private', 'Private Garage'), ('street', 'On Street')], default='no')
    
    # Status
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} — {self.agency.name if self.agency else 'No Agency'}"
    
    class Meta:
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
        ordering = ['-created_at']


class PropertyImage(models.Model):
    """Model to store property images"""
    property = models.ForeignKey(
        Property, 
        on_delete=models.CASCADE, 
        related_name='images'
    )
    image = models.ImageField(upload_to='property_images/')
    is_main = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Image for {self.property.name}"
    
    class Meta:
        ordering = ['-is_main', 'uploaded_at']