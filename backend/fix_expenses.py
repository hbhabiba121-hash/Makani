# fix_expenses.py

import os
import sys
import django

# Add the backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from payments.models import Payout
from financials.models import FinancialRecord

print("=== Checking Financial Records for Expenses ===\n")

# First, check what expenses exist in financial records
records = FinancialRecord.objects.all()
for record in records:
    print(f"Record {record.id}: {record.property.name} - {record.month}/{record.year}")
    print(f"  Revenue: {record.revenue}")
    print(f"  Expenses: {record.expenses}")
    print(f"  Commission: {record.get_commission()}")
    print(f"  Net: {record.get_net_profit()}")
    print()

print("\n=== Updating Payouts with Expenses ===\n")

payouts = Payout.objects.all().select_related('financial_record')
updated_count = 0

for payout in payouts:
    if payout.financial_record:
        fr = payout.financial_record
        old_expenses = payout.expenses
        new_expenses = fr.expenses if fr.expenses else 0
        
        if float(old_expenses) != float(new_expenses):
            payout.expenses = new_expenses
            # Recalculate net owner earnings
            payout.net_owner_earnings = payout.total_revenue - payout.commission - new_expenses
            payout.remaining_balance = payout.net_owner_earnings - payout.amount_paid
            payout.save()
            updated_count += 1
            print(f"✓ Updated {payout.property.name} ({fr.month}/{fr.year})")
            print(f"  Expenses: {old_expenses} → {new_expenses}")
            print(f"  Net: {payout.net_owner_earnings}")
        else:
            print(f"  {payout.property.name}: expenses already correct ({new_expenses})")
    else:
        print(f"⚠ {payout.property.name}: No financial record linked")

print(f"\n=== Updated {updated_count} payouts ===")