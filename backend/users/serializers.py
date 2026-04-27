from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - follows CypHX naming conventions"""
    
    full_name = serializers.SerializerMethodField()
    agency_name = serializers.SerializerMethodField()
    agency_id = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'created_at', 'agency', 'agency_id', 'agency_name'
        ]
        read_only_fields = ['id', 'created_at', 'is_active']
    
    def get_full_name(self, obj):
        """Returns user's full name - explicit verb naming"""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_agency_name(self, obj):
        """Returns agency name if user has an agency"""
        return obj.agency.name if obj.agency else None
    
    def get_agency_id(self, obj):
        """Returns agency ID if user has an agency"""
        return obj.agency.id if obj.agency else None

class UserRegistrationSerializer(serializers.ModelSerializer):
    """Handles user registration with validation"""
    
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'password', 
            'password_confirm', 'role'
        ]
    
    def validate(self, attrs):
        """Validates that passwords match - one responsibility per function"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': "Passwords do not match."
            })
        return attrs
    
    def create(self, validated_data):
        """Creates user with hashed password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change functionality"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True, 
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, attrs):
        """Ensures new password matches confirmation"""
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': "New passwords do not match."
            })
        return attrs