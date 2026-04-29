# backend/reports/models.py

from django.db import models
from properties.models import Property

class Report(models.Model):
    REPORT_TYPES = [
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    REPORT_SCOPE_TYPES = [
        ('agency', 'Agency Report'),
        ('owner', 'Owner Report'),
    ]
    
    # Report identification
    name = models.CharField(max_length=200)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, default='monthly')
    report_scope = models.CharField(max_length=20, choices=REPORT_SCOPE_TYPES, default='agency')
    
    # Period
    month = models.IntegerField(null=True, blank=True)
    year = models.IntegerField()
    
    # Property filter (null = all properties)
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reports', null=True, blank=True)
    
    # Summary data - Agency perspective
    agency_total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    agency_total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    agency_net_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Summary data - Owner perspective
    owner_total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    owner_total_commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    owner_total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    owner_net_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # General
    property_count = models.IntegerField(default=0)
    
    # Detailed data (stored as JSON)
    details = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        scope_label = "Agency" if self.report_scope == 'agency' else "Owner"
        if self.property:
            return f"{scope_label} Report - {self.property.name} - {self.name}"
        return f"{scope_label} Report - All Properties - {self.name}"
    
    class Meta:
        ordering = ['-created_at']