# backend/reports/admin.py

from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'report_type', 'report_scope', 'year', 'created_at']
    list_filter = ['report_type', 'report_scope', 'year', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Report Information', {
            'fields': ('name', 'report_type', 'report_scope', 'property', 'month', 'year')
        }),
        ('Agency Financial Data', {
            'fields': ('agency_total_commission', 'agency_total_expenses', 'agency_net_profit'),
            'classes': ('collapse',)
        }),
        ('Owner Financial Data', {
            'fields': ('owner_total_revenue', 'owner_total_commission', 'owner_total_expenses', 'owner_net_profit'),
            'classes': ('collapse',)
        }),
        ('Additional', {
            'fields': ('property_count', 'details', 'created_at')
        }),
    )