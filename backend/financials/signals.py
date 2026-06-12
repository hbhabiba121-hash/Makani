# backend/financials/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import models
from .models import Expense, FinancialRecord
from datetime import date

@receiver([post_save, post_delete], sender=Expense)
def update_financial_record_expenses(sender, instance, **kwargs):
    """Update FinancialRecord expenses when Expense is added/updated/deleted"""
    # Find the financial record for this property and period
    financial_record = FinancialRecord.objects.filter(
        property=instance.property,
        year=instance.date.year,
        month=instance.date.month
    ).first()
    
    if financial_record:
        # Calculate total expenses for the period
        start_date = date(instance.date.year, instance.date.month, 1)
        if instance.date.month == 12:
            end_date = date(instance.date.year + 1, 1, 1)
        else:
            end_date = date(instance.date.year, instance.date.month + 1, 1)
        
        total_expenses = Expense.objects.filter(
            property=instance.property,
            date__gte=start_date,
            date__lt=end_date
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        financial_record.expenses = total_expenses
        financial_record.save()