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
    revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expenses = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
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
    
    def __str__(self):
        return f'{self.property.name} — {self.get_month_display()} {self.year}'
    
    class Meta:
        unique_together = ('property', 'month', 'year')
        ordering = ['-year', '-month']