import os 
import django 
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') 
django.setup() 
from financials.models import FinancialRecord 
from properties.models import Property 
from payments.models import Payout 
from users.models import User 
print("Total financial records:", FinancialRecord.objects.count()) 
for r in FinancialRecord.objects.all()[:5]: 
    print(f"Record {r.id}: {r.property.name} - Revenue: {r.revenue}") 
    if hasattr(r.property, 'owner'): 
        print(f"  Owner: {r.property.owner}") 
print("Total payouts:", Payout.objects.count()) 
