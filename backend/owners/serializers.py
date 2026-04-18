
from rest_framework import serializers
from .models import Owner
from users.serializers import UserSerializer

class OwnerSerializer(serializers.ModelSerializer):

    
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Owner
        fields = [
            'id', 'user', 'user_details', 'email', 'full_name',
            'phone', 'address', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        """Returns owner's full name - explicit verb naming"""
        return f"{obj.user.first_name} {obj.user.last_name}".strip()
    
    def get_email(self, obj):
        """Returns owner's email from linked user"""
        return obj.user.email


class CreateOwnerSerializer(serializers.ModelSerializer):

    
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    
    class Meta:
        model = Owner
        fields = [
            'email', 'first_name', 'last_name', 'phone', 'address'
        ]
    
    def validate_email(self, value):

        from users.models import User
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value
    
    def create(self, validated_data):

        from users.models import User
        
        # Extract user data
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        
        # Generate temporary password
        import random
        import string
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        # Create User
        user = User.objects.create_user(
            email=email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
            role='owner'
        )
        
        # Create Owner linked to User
        owner = Owner.objects.create(user=user, **validated_data)
        
        # Attach temp password for response
        owner.temp_password = temp_password
        
        return owner