
from rest_framework import serializers
from .models import Property

class PropertySerializer(serializers.ModelSerializer):

    
    agency_name = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    property_type_display = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Property
        fields = [
            'id', 'name', 'location', 'property_type', 'property_type_display',
            'status', 'status_display', 'description', 'bedrooms', 'bathrooms',
            'area_sqm', 'monthly_rent', 'is_active', 'agency', 'agency_name',
            'owner', 'owner_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_agency_name(self, obj):
        """Returns agency name - explicit and readable"""
        return obj.agency.name if obj.agency else None
    
    def get_owner_name(self, obj):
        """Returns owner full name"""
        if obj.owner:
            return f"{obj.owner.user.first_name} {obj.owner.user.last_name}".strip()
        return None
    
    def get_property_type_display(self, obj):
        """Returns human-readable property type"""
        return obj.get_property_type_display()
    
    def get_status_display(self, obj):
        """Returns human-readable status"""
        return obj.get_status_display()


class CreatePropertySerializer(serializers.ModelSerializer):

    
    class Meta:
        model = Property
        fields = [
            'name', 'location', 'property_type', 'description',
            'bedrooms', 'bathrooms', 'area_sqm', 'monthly_rent',
            'owner'
        ]


class AssignOwnerSerializer(serializers.Serializer):

    
    owner_id = serializers.IntegerField(required=True)
    
    def validate_owner_id(self, value):
        """Validates that owner exists"""
        from owners.models import Owner
        try:
            owner = Owner.objects.get(id=value)
            return owner
        except Owner.DoesNotExist:
            raise serializers.ValidationError("Owner not found")