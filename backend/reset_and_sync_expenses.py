# reset_and_sync_expenses.py - FIXED VERSION

import os
import sys
import django
from datetime import date
from decimal import Decimal
from collections import defaultdict

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from financials.models import FinancialRecord, Expense
from payments.models import Payout
from django.db.models import Sum

print("=== Step 1: Resetting FinancialRecord expenses to 0 ===\n")

# Reset all financial record expenses to 0 first
updated_count = FinancialRecord.objects.all().update(expenses=0)
print(f"Reset {updated_count} financial records to 0 expenses")

print("\n=== Step 2: Calculating correct expenses by property and month ===\n")

# Group expenses by property and month
expenses_by_property_month = defaultdict(Decimal)

all_expenses = Expense.objects.all()
print(f"Total expenses found: {all_expenses.count()}")

for expense in all_expenses:
    key = (expense.property_id, expense.date.year, expense.date.month)
    expenses_by_property_month[key] += expense.amount
    print(f"  Expense: {expense.property.name} - {expense.date.year}/{expense.date.month} - {expense.amount} MAD")

print(f"\nFound {len(expenses_by_property_month)} unique property-month combinations with expenses")

print("\n=== Step 3: Updating FinancialRecord with correct expenses ===\n")

# Update each financial record with the correct total for its property/month
records = FinancialRecord.objects.all()
updated_records = 0

for record in records:
    key = (record.property_id, record.year, record.month)
    total_expenses = expenses_by_property_month.get(key, Decimal('0.00'))
    
    print(f"Record {record.id}: {record.property.name} - {record.month}/{record.year}")
    print(f"  Setting expenses to: {total_expenses} MAD (was {record.expenses} MAD)")
    
    if record.expenses != total_expenses:
        record.expenses = total_expenses
        record.save()
        updated_records += 1
        print(f"  ✓ Updated")
    else:
        print(f"  ✓ Already correct")
    print()

print(f"\n=== Updated {updated_records} financial records ===")

print("\n=== Step 4: Updating Payouts ===\n")

# Update payouts with correct expenses
payouts = Payout.objects.all().select_related('financial_record')
payout_updated = 0

for payout in payouts:
    if payout.financial_record:
        fr = payout.financial_record
        # Convert all to Decimal for proper arithmetic
        total_expenses = Decimal(str(fr.expenses))
        total_revenue = Decimal(str(payout.total_revenue))
        commission = Decimal(str(payout.commission))
        amount_paid = Decimal(str(payout.amount_paid))
        
        # Calculate new values
        net_owner_earnings = total_revenue - commission - total_expenses
        remaining_balance = net_owner_earnings - amount_paid
        
        # Update payout
        old_net = payout.net_owner_earnings
        payout.expenses = total_expenses
        payout.net_owner_earnings = net_owner_earnings
        payout.remaining_balance = remaining_balance
        payout.save()
        
        payout_updated += 1
        print(f"✓ Updated {payout.property.name} ({fr.month}/{fr.year})")
        print(f"  Expenses: {total_expenses} MAD")
        print(f"  Old Net: {old_net} MAD")
        print(f"  New Net: {net_owner_earnings} MAD")
        print()

print(f"\n=== Updated {payout_updated} payouts ===")

print("\n✅ Done! Restart your Django server and refresh the frontend")