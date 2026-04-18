from django.contrib import admin
from .models import FinancialRecord

@admin.register(FinancialRecord)
class FinancialRecordAdmin(admin.ModelAdmin):
    list_display = ['property', 'month', 'year', 'revenue', 'expenses', 'commission_rate']
    list_filter = ['property', 'year']
    readonly_fields = ['created_at', 'updated_at']