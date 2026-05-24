from django.core.management.base import BaseCommand
from financials.models import FinancialRecord
from properties.models import Property

class Command(BaseCommand):
    help = 'Check financial records and properties'

    def handle(self, *args, **options):
        self.stdout.write("=== Checking Financial Records ===\n")
        
        records = FinancialRecord.objects.all()
        self.stdout.write(f"Total Financial Records: {records.count()}\n")
        
        if records.count() == 0:
            self.stdout.write(self.style.WARNING("No financial records found!"))
            self.stdout.write("\nYou need to add financial records first. Options:")
            self.stdout.write("1. Use admin panel at /admin/financials/financialrecord/")
            self.stdout.write("2. Use API POST /api/financials/financial-records/")
            self.stdout.write("3. Import CSV via POST /api/financials/import-csv/")
        else:
            for record in records:
                self.stdout.write(f"\n--- Record {record.id} ---")
                self.stdout.write(f"Property: {record.property.name}")
                self.stdout.write(f"Month: {record.month}, Year: {record.year}")
                self.stdout.write(f"Revenue: {record.revenue}")
                self.stdout.write(f"Expenses: {record.expenses}")
                
                # Check property owner
                if hasattr(record.property, 'owner'):
                    owner = record.property.owner
                    if owner:
                        if hasattr(owner, 'user'):
                            self.stdout.write(f"Owner: {owner.user.email if owner.user else 'None'}")
                        else:
                            self.stdout.write(f"Owner: {owner}")
                    else:
                        self.stdout.write(self.style.WARNING("Owner: None"))
                else:
                    self.stdout.write(self.style.ERROR("Property has no owner attribute!"))

        self.stdout.write("\n=== Properties ===")
        for prop in Property.objects.all():
            self.stdout.write(f"\nProperty: {prop.name}")
            self.stdout.write(f"Has owner attribute: {hasattr(prop, 'owner')}")
            if hasattr(prop, 'owner'):
                self.stdout.write(f"Owner value: {prop.owner}")