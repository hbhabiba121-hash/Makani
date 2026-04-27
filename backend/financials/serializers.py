# backend/financials/serializers.py

from rest_framework import serializers
from .models import FinancialRecord
from properties.models import Property

class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ['id', 'name', 'location']

class FinancialRecordSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)
    month_display = serializers.CharField(source='get_month_display', read_only=True)
    commission = serializers.DecimalField(source='get_commission', read_only=True, max_digits=10, decimal_places=2)
    net_profit = serializers.DecimalField(source='get_net_profit', read_only=True, max_digits=10, decimal_places=2)
    owner_payout = serializers.DecimalField(source='get_owner_payout', read_only=True, max_digits=10, decimal_places=2)
    
    class Meta:
        model = FinancialRecord
        fields = [
            'id', 'property', 'month', 'month_display', 'year', 
            'revenue', 'expenses', 'commission_rate', 'commission',
            'net_profit', 'owner_payout', 'notes', 'created_at', 'updated_at'
        ]