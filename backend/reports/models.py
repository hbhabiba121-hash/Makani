# backend/reports/models.py

from django.db import models
from properties.models import Property

class Report(models.Model):
    REPORT_TYPES = [
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    # Report identification
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, default='monthly')
    
    # Period
    month = models.IntegerField(null=True, blank=True)
    year = models.IntegerField()
    
    # Property filter (null = all properties)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    
    # Summary data
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    property_count = models.IntegerField(default=0)
    
    # Detailed data (stored as JSON)
    details = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        if self.property:
            return f"{self.name} - {self.property.name}"
        return f"{self.name} - All Properties"
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['property', 'report_type', 'month', 'year']