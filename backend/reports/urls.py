# backend/reports/urls.py
from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    path('api/reports/monthly/<int:property_id>/', views.export_monthly_report, name='monthly-report'),
    path('api/reports/yearly/<int:property_id>/', views.export_yearly_report, name='yearly-report'),
]