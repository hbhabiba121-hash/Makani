# backend/payments/management/commands/generate_payouts.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from payments.models import Payout
from financials.models import FinancialRecord
from properties.models import Property
from users.models import User

class Command(BaseCommand):
    help = 'Generate payouts from financial records'

    def handle(self, *args, **options):
        # Get all financial records that don't have payouts yet
        records_without_payout = FinancialRecord.objects.filter(payouts__isnull=True)
        
        created_count = 0
        for record in records_without_payout:
            # Get the owner from the property
            owner = record.property.owner.user if record.property.owner else None
            
            if not owner:
                self.stdout.write(self.style.WARNING(f'Skipping {record.property.name}: No owner assigned'))
                continue
            
            # Calculate amounts
            revenue = record.revenue
            commission = record.get_commission()
            expenses = record.expenses
            net_owner_earnings = record.get_owner_payout()
            
            # Create payout
            payout, created = Payout.objects.get_or_create(
                financial_record=record,
                defaults={
                    'agency': record.property.agency,
                    'owner': owner,
                    'property': record.property,
                    'total_revenue': revenue,
                    'commission': commission,
                    'expenses': expenses,
                    'net_owner_earnings': net_owner_earnings,
                    'due_date': timezone.now().date() + timezone.timedelta(days=30),  # Due in 30 days
                    'status': 'pending'
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created payout for {record.property.name}: {net_owner_earnings} MAD'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} payouts'))