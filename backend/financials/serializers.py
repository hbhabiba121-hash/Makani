# backend/financials/serializers.py - UPDATE with all fields:

from rest_framework import serializers
from .models import FinancialRecord
from properties.models import Property


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = ["id", "name", "location"]


class FinancialRecordSerializer(serializers.ModelSerializer):
    property = PropertySerializer(read_only=True)
    month_display = serializers.CharField(source='get_month_display', read_only=True)
    commission = serializers.SerializerMethodField()
    net_profit = serializers.SerializerMethodField()

    class Meta:
        model = FinancialRecord
        fields = [
            "id",
            "property",
            "month",
            "month_display",
            "year",
            "guest_name",
            "booking_source",
            "nights",
            "price_per_night",
            "revenue",
            "expenses",
            "commission_rate",
            "commission",
            "net_profit",
            "check_in",
            "check_out",
            "notes",
            "created_at",
            "updated_at",
        ]

    def get_commission(self, obj):
        return float(obj.get_commission())

    def get_net_profit(self, obj):
        return float(obj.get_net_profit())
    
    # backend/financials/serializers.py - Add this at the end

from .models import Expense
# backend/financials/serializers.py - Update ExpenseSerializer

class ExpenseSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    
    class Meta:
        model = Expense
        fields = ['id', 'property', 'property_name', 'category', 'description', 'date', 'amount', 'receipt', 'has_receipt', 'created_at', 'updated_at']
        extra_kwargs = {
            'property': {'required': False, 'read_only': True},
            'description': {'required': False, 'allow_blank': True},
            'receipt': {'required': False},
            'amount': {'required': True},
            'category': {'required': True},
            'date': {'required': True},
        }