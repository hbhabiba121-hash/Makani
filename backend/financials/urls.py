# backend/financials/urls.py

from django.urls import path
from . import views

app_name = 'financials'

urlpatterns = [
    path('api/financials/import-csv/', views.import_financial_csv, name='import-csv'),
    path('api/financials/summary/<int:property_id>/', views.monthly_summary, name='monthly-summary'),
]