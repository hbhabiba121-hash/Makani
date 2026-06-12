# backend/payments/management/commands/generate_payouts_from_financials.py

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from payments.models import Payout
from financials.models import FinancialRecord
from properties.models import Property
from users.models import User

class Command(BaseCommand):
    help = 'Generate payouts from financial records'

    def handle(self, *args, **options):
        self.stdout.write("=== Generating Payouts from Financial Records ===\n")
        
        # Get all financial records that don't have payouts yet
        records_without_payout = FinancialRecord.objects.filter(payouts__isnull=True)
        self.stdout.write(f"Found {records_without_payout.count()} financial records without payouts\n")
        
        created_count = 0
        skipped_count = 0
        
        for record in records_without_payout:
            self.stdout.write(f"\n--- Processing record {record.id} ---")
            self.stdout.write(f"Property: {record.property.name}")
            self.stdout.write(f"Month: {record.month}, Year: {record.year}")
            self.stdout.write(f"Revenue: {record.revenue}")
            
            # Get owner from property
            owner = None
            if hasattr(record.property, 'owner') and record.property.owner:
                # Check if owner is a User object or OwnerProfile
                if hasattr(record.property.owner, 'user'):
                    owner = record.property.owner.user
                else:
                    # Try to find user by email if owner is a string
                    if isinstance(record.property.owner, str):
                        try:
                            owner = User.objects.get(email=record.property.owner)
                        except User.DoesNotExist:
                            self.stdout.write(self.style.WARNING(f"  User not found for email: {record.property.owner}"))
                    else:
                        owner = record.property.owner
            
            if not owner:
                self.stdout.write(self.style.WARNING(f"  SKIPPED: No owner found for property {record.property.name}"))
                skipped_count += 1
                continue
            
            self.stdout.write(f"  Owner found: {owner.email}")
            
            # Calculate amounts
            revenue = float(record.revenue) if record.revenue else 0
            commission = float(record.get_commission()) if hasattr(record, 'get_commission') else revenue * 0.20  # Default 20%
            expenses = float(record.expenses) if record.expenses else 0
            net_owner_earnings = revenue - commission - expenses
            
            self.stdout.write(f"  Revenue: {revenue}")
            self.stdout.write(f"  Commission (20%): {commission}")
            self.stdout.write(f"  Expenses: {expenses}")
            self.stdout.write(f"  Net Owner Earnings: {net_owner_earnings}")
            
            # Get agency
            agency = record.property.agency if hasattr(record.property, 'agency') else None
            
            # Create payout
            try:
                payout = Payout.objects.create(
                    agency=agency,
                    owner=owner,
                    property=record.property,
                    financial_record=record,
                    total_revenue=revenue,
                    commission=commission,
                    expenses=expenses,
                    net_owner_earnings=net_owner_earnings,
                    due_date=timezone.now().date() + timedelta(days=30),
                    status='pending'
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  ✓ Created payout {payout.id}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  ✗ Error creating payout: {str(e)}"))
                skipped_count += 1
        
        self.stdout.write(f"\n=== Summary ===")
        self.stdout.write(self.style.SUCCESS(f"Successfully created {created_count} payouts"))
        self.stdout.write(self.style.WARNING(f"Skipped {skipped_count} records"))
        self.stdout.write(f"Total payouts now: {Payout.objects.count()}")