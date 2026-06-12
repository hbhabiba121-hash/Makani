# backend/reports/urls.py

from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    path('reports/', views.get_reports, name='get-reports'),
    path('reports/generate/', views.generate_report, name='generate-report'),
    path('reports/<int:report_id>/', views.get_report_detail, name='get-report-detail'),
    path('reports/<int:report_id>/delete/', views.delete_report, name='delete-report'),
    path('reports/<int:report_id>/download/', views.download_report, name='download-report'),
]