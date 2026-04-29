from django.urls import path
from . import views

app_name = 'financials'

urlpatterns = [
    path('import-csv/', views.import_financial_csv, name='import-csv'),
    path('summary/<int:property_id>/', views.monthly_summary, name='monthly-summary'),
    path('revenue-stats/', views.revenue_stats, name='revenue-stats'),
    path('revenue-records/', views.revenue_records, name='revenue-records'),
    path('revenue-summary/', views.revenue_summary, name='revenue-summary'),
    path('properties/', views.get_properties, name='get-properties'),
    path('financial-records/<int:record_id>/', views.financial_record_detail, name='financial-record-detail'),
    path('financial-records/', views.create_financial_record, name='create-financial-record'),
    path('expenses/', views.expense_list, name='expense-list'),
    path('expenses/<int:pk>/', views.expense_detail, name='expense-detail'),
    path('get-reports/', views.get_reports, name='get-reports'),
    path('property-occupancy/<int:property_id>/', views.property_occupancy, name='property-occupancy'),
]