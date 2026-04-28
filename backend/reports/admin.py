# backend/reports/admin.py

from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'report_type', 'month', 'year', 'created_at', 'total_revenue']
    list_filter = ['report_type', 'year', 'created_at']
    search_fields = ['name']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Report Information', {
            'fields': ('name', 'report_type', 'property', 'month', 'year')
        }),
        ('Financial Data', {
            'fields': ('total_revenue', 'total_expenses', 'net_profit', 'property_count')
        }),
        ('File Information', {
            'fields': ('file', 'created_at')
        }),
    )