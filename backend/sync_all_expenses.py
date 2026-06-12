# sync_all_expenses.py - FIXED VERSION

import os
import sys
import django
from datetime import date
from decimal import Decimal

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from financials.models import FinancialRecord, Expense
from django.db.models import Sum

print("=== Syncing Expenses from Expense model to Financial Records ===\n")

records = FinancialRecord.objects.all()
updated_count = 0

for record in records:
    # Calculate date range for this record's month
    start_date = date(record.year, record.month, 1)
    
    if record.month == 12:
        end_date = date(record.year + 1, 1, 1)
    else:
        end_date = date(record.year, record.month + 1, 1)
    
    # Get all expenses for this property in this month
    expenses = Expense.objects.filter(
        property=record.property,
        date__gte=start_date,
        date__lt=end_date
    )
    
    total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    
    print(f"Record {record.id}: {record.property.name} - {record.month}/{record.year}")
    print(f"  Current expenses in FinancialRecord: {record.expenses}")
    print(f"  Total expenses from Expense model: {total_expenses}")
    
    if expenses.count() > 0:
        print(f"  Found {expenses.count()} expense(s):")
        for exp in expenses:
            print(f"    - {exp.date}: {exp.category} - {exp.amount} MAD")
    
    # Update the financial record with the total expenses
    if record.expenses != total_expenses:
        record.expenses = total_expenses
        record.save()
        updated_count += 1
        print(f"  ✓ Updated to {total_expenses} MAD")
    else:
        print(f"  ✓ Already correct")
    print()

print(f"\n=== Updated {updated_count} financial records ===")

# Now update payouts
print("\n=== Updating Payouts ===\n")

from payments.models import Payout

payouts = Payout.objects.all().select_related('financial_record')
payout_updated_count = 0

for payout in payouts:
    if payout.financial_record:
        fr = payout.financial_record
        # Convert to Decimal for proper arithmetic
        total_expenses = Decimal(str(fr.expenses)) + Decimal(str(fr.get_total_expenses_from_expense_model()))
        
        # Update payout with expenses from financial record
        payout.expenses = total_expenses
        payout.net_owner_earnings = Decimal(str(payout.total_revenue)) - Decimal(str(payout.commission)) - total_expenses
        payout.remaining_balance = payout.net_owner_earnings - Decimal(str(payout.amount_paid))
        payout.save()
        
        payout_updated_count += 1
        print(f"✓ Updated {payout.property.name} ({fr.month}/{fr.year})")
        print(f"  Total Expenses: {total_expenses} MAD")
        print(f"  New Net: {payout.net_owner_earnings} MAD")
        print()

print(f"\n=== Updated {payout_updated_count} payouts ===")