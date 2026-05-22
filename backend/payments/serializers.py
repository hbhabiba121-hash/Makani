# backend/payments/serializers.py

from rest_framework import serializers
from .models import Payout, Payment, PaymentAlert


class PaymentSerializer(serializers.ModelSerializer):
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    owner_name = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = [
            'id', 'payout', 'agency', 'owner', 'owner_name', 'property', 'property_name',
            'amount', 'payment_method', 'payment_method_display', 'transaction_id',
            'payment_date', 'notes', 'bank_reference', 'created_at', 'created_by'
        ]
        read_only_fields = ['id', 'payment_date', 'created_at', 'agency', 'owner', 'property', 'created_by']
    
    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}" if obj.owner else "N/A"
    
    def get_property_name(self, obj):
        return obj.property.name if obj.property else "N/A"


class PayoutSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    owner_name = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()
    payments = PaymentSerializer(many=True, read_only=True)
    completion_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Payout
        fields = [
            'id', 'agency', 'owner', 'owner_name', 'property', 'property_name',
            'financial_record', 'total_revenue', 'commission', 'expenses', 
            'net_owner_earnings', 'amount_paid', 'remaining_balance', 
            'status', 'status_display', 'due_date', 'paid_date', 'created_at', 
            'updated_at', 'notes', 'payments', 'completion_percentage'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_owner_name(self, obj):
        return f"{obj.owner.first_name} {obj.owner.last_name}" if obj.owner else "N/A"
    
    def get_property_name(self, obj):
        return obj.property.name if obj.property else "N/A"
    
    def get_completion_percentage(self, obj):
        if obj.net_owner_earnings > 0:
            return round((obj.amount_paid / obj.net_owner_earnings) * 100, 1)
        return 0


class PaymentAlertSerializer(serializers.ModelSerializer):
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    
    class Meta:
        model = PaymentAlert
        fields = '__all__'
        read_only_fields = ['id', 'created_at']