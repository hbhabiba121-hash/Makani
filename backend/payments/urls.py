# backend/payments/urls.py
from django.urls import path
from .views import (
    DashboardKPIsView, PayoutListView, PayoutDetailView, PayoutSummaryView,
    PaymentCreateView, PaymentHistoryView, PendingAlertsView,
    mark_alert_read, mark_all_alerts_read, generate_statement, payment_analytics,
    generate_payouts_from_financials, test_payouts
)

urlpatterns = [
    path('kpis/', DashboardKPIsView.as_view(), name='payment-kpis'),
    path('payouts/', PayoutListView.as_view(), name='payout-list'),
    path('payouts/summary/', PayoutSummaryView.as_view(), name='payout-summary'),
    path('payouts/<int:pk>/', PayoutDetailView.as_view(), name='payout-detail'),
    path('payments/create/', PaymentCreateView.as_view(), name='payment-create'),
    path('payments/history/', PaymentHistoryView.as_view(), name='payment-history'),
    path('alerts/', PendingAlertsView.as_view(), name='payment-alerts'),
    path('alerts/<int:alert_id>/read/', mark_alert_read, name='mark-alert-read'),
    path('alerts/mark-all-read/', mark_all_alerts_read, name='mark-all-alerts-read'),
    path('statements/<int:payout_id>/', generate_statement, name='generate-statement'),
    path('analytics/', payment_analytics, name='payment-analytics'),
    path('generate-from-financials/', generate_payouts_from_financials, name='generate-from-financials'),
    path('test/', test_payouts, name='test-payouts'),
]