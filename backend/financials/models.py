# backend/financials/models.py - FIXED VERSION

from django.db import models
from properties.models import Property
from decimal import Decimal

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
    booking_source = models.CharField(max_length=100, blank=True, default='')
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
    
    def get_total_expenses_from_expense_model(self):
        """Calculate total expenses from Expense model for this property and period - returns Decimal"""
        from datetime import date
        from django.db.models import Sum
        from .models import Expense
        
        # Get the start and end date for this month/year
        start_date = date(self.year, self.month, 1)
        
        # Get last day of month
        if self.month == 12:
            end_date = date(self.year + 1, 1, 1)
        else:
            end_date = date(self.year, self.month + 1, 1)
        
        # Sum all expenses for this property within this month
        total = Expense.objects.filter(
            property=self.property,
            date__gte=start_date,
            date__lt=end_date
        ).aggregate(total=Sum('amount'))['total']
        
        if total is None:
            return Decimal('0.00')
        return Decimal(str(total))
    
    def get_commission(self):
        """Calculate commission amount - returns Decimal"""
        return self.revenue * (self.commission_rate / Decimal('100'))
    
    def get_net_profit(self):
        """Calculate net profit including expenses from Expense model - returns Decimal"""
        total_expenses = self.expenses + self.get_total_expenses_from_expense_model()
        return self.revenue - total_expenses - self.get_commission()
    
    def get_owner_payout(self):
        """Calculate owner payout - returns Decimal"""
        return self.get_net_profit()
    
    def get_month_display(self):
        """Get month name"""
        return self.Month(self.month).label
    
    def __str__(self):
        return f'{self.property.name} — {self.get_month_display()} {self.year} - {self.guest_name}'
    
    class Meta:
        ordering = ['-year', '-month']


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