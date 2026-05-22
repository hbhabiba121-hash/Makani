# backend/payments/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from decimal import Decimal

class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PARTIAL = 'partial', 'Partial'
    PAID = 'paid', 'Paid'
    OVERDUE = 'overdue', 'Overdue'

class PaymentMethod(models.TextChoices):
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    CASH = 'cash', 'Cash'
    PAYPAL = 'paypal', 'PayPal'
    STRIPE = 'stripe', 'Stripe'
    CHECK = 'check', 'Check'
    WISE = 'wise', 'Wise Transfer'

class Payout(models.Model):
    """Main payout tracking model - connects to FinancialRecord"""
    
    # Relationships
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE, related_name='payouts')
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payouts')
    property = models.ForeignKey('properties.Property', on_delete=models.CASCADE, related_name='payouts', null=True, blank=True)
    financial_record = models.ForeignKey('financials.FinancialRecord', on_delete=models.SET_NULL, null=True, blank=True, related_name='payouts')
    
    # Financial details (from FinancialRecord or manual entry)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    commission = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_owner_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Payment tracking
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    
    # Dates
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional info
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-due_date']
        indexes = [
            models.Index(fields=['status', 'due_date']),
            models.Index(fields=['agency', 'owner']),
        ]
    
    def save(self, *args, **kwargs):
        # Calculate net earnings from financial record if available
        if self.financial_record and not self.total_revenue:
            self.total_revenue = self.financial_record.revenue
            self.expenses = self.financial_record.expenses
            self.commission = self.financial_record.get_commission()
        
        self.net_owner_earnings = self.total_revenue - self.commission - self.expenses
        self.remaining_balance = self.net_owner_earnings - self.amount_paid
        
        # Update status
        if self.amount_paid >= self.net_owner_earnings:
            self.status = PaymentStatus.PAID
            if not self.paid_date:
                self.paid_date = timezone.now().date()
        elif self.amount_paid > 0:
            self.status = PaymentStatus.PARTIAL
        elif self.due_date < timezone.now().date() and self.amount_paid == 0:
            self.status = PaymentStatus.OVERDUE
        else:
            self.status = PaymentStatus.PENDING
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.owner.email} - {self.net_owner_earnings} - {self.status}"


class Payment(models.Model):
    """Individual payment transactions"""
    
    payout = models.ForeignKey(Payout, on_delete=models.CASCADE, related_name='payments')
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    property = models.ForeignKey('properties.Property', on_delete=models.SET_NULL, null=True, blank=True)
    financial_record = models.ForeignKey('financials.FinancialRecord', on_delete=models.SET_NULL, null=True, blank=True)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    transaction_id = models.CharField(max_length=100, blank=True, unique=True, null=True)
    
    payment_date = models.DateField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    # For bank transfers
    bank_reference = models.CharField(max_length=100, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_payments')
    
    class Meta:
        ordering = ['-payment_date']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update the payout's amount_paid
        self.payout.amount_paid = self.payout.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        self.payout.save()
    
    def __str__(self):
        return f"{self.owner.email} - {self.amount} - {self.payment_method}"


class PaymentAlert(models.Model):
    """For pending alerts and notifications"""
    
    class AlertType(models.TextChoices):
        PENDING_PAYOUT = 'pending_payout', 'Pending Payout'
        OVERDUE_PAYOUT = 'overdue_payout', 'Overdue Payout'
        PARTIAL_PAYMENT = 'partial_payment', 'Partial Payment'
        UPCOMING_PAYMENT = 'upcoming_payment', 'Upcoming Payment'
    
    agency = models.ForeignKey('agencies.Agency', on_delete=models.CASCADE, related_name='payment_alerts')
    payout = models.ForeignKey(Payout, on_delete=models.CASCADE, related_name='alerts', null=True, blank=True)
    
    alert_type = models.CharField(max_length=20, choices=AlertType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']