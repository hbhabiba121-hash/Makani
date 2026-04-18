from django.contrib import admin
from .models import Report

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['property', 'month', 'year', 'generated_at']
    list_filter = ['property', 'year']
    readonly_fields = ['generated_at']