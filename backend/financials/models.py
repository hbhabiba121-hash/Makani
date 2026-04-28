# backend/financials/models.py - ADD BACK THE MISSING FIELDS

from django.db import models
from properties.models import Property

class FinancialRecord(models.Model):
    class Month(models.IntegerChoices):
        JANUARY = 1, 'January'
        FEBRUARY = 2, 'February'
        MARCH = 3, 'March'
        APRIL = 4, 'April'
        MAY = 5, 'May'
        JUNE = 6, 'June'
        JULY = 7, 'July'
        AUGUST = 8, 'August'
        SEPTEMBER = 9, 'September'
        OCTOBER = 10, 'October'
        NOVEMBER = 11, 'November'
        DECEMBER = 12, 'December'
    
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='financial_records')
    month = models.IntegerField(choices=Month.choices)
    year = models.IntegerField()
    
    # Booking details
    guest_name = models.CharField(max_length=200, blank=True, default='')
    booking_source = models.CharField(max_length=100, blank=True, default='')  # Airbnb, Booking.com, etc.
    nights = models.IntegerField(default=1)
    price_per_night = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Financial details
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    
    # Dates
    check_in = models.DateField(null=True, blank=True)
    check_out = models.DateField(null=True, blank=True)
    
    # Additional
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def get_commission(self):
        """Calculate commission amount"""
        return self.revenue * (self.commission_rate / 100)
    
    def get_net_profit(self):
        """Calculate net profit"""
        return self.revenue - self.expenses - self.get_commission()
    
    def get_owner_payout(self):
        """Calculate owner payout"""
        return self.get_net_profit()
    
    def get_month_display(self):
        """Get month name"""
        return self.Month(self.month).label
    
    def __str__(self):
        return f'{self.property.name} — {self.get_month_display()} {self.year} - {self.guest_name}'
    
    class Meta:
        ordering = ['-year', '-month']
        # Remove unique_together to allow multiple bookings per month
        # unique_together = ('property', 'month', 'year')  # COMMENT THIS OUT

    # backend/financials/models.py - Add this at the end of the file (after FinancialRecord class)

class Expense(models.Model):
    class Category(models.TextChoices):
        CLEANING = 'Cleaning', 'Cleaning'
        WIFI = 'WiFi', 'WiFi'
        ELECTRICITY = 'Electricity', 'Electricity'
        MAINTENANCE = 'Maintenance', 'Maintenance'
        SUPPLIES = 'Supplies', 'Supplies'
        OTHER = 'Other', 'Other'
    
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=50, choices=Category.choices)
    description = models.TextField(blank=True, default='')
    date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    receipt = models.FileField(upload_to='receipts/', null=True, blank=True)
    has_receipt = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        self.has_receipt = bool(self.receipt)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.property.name} - {self.category} - {self.amount} DH"
    
    class Meta:
        ordering = ['-date']