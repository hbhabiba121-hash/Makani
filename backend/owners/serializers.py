# owners/serializers.py
from rest_framework import serializers
from .models import Owner
from users.serializers import UserSerializer

class OwnerSerializer(serializers.ModelSerializer):
    """Serializer for Owner model with flattened user data."""

    full_name = serializers.SerializerMethodField(method_name='getFullName')
    email = serializers.SerializerMethodField(method_name='getEmail')
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Owner
        fields = [
            'id', 'full_name', 'email', 'phone', 'address',
            'user_details', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def getFullName(self, obj):
        """Return owner full name from linked user."""
        return f"{obj.user.first_name} {obj.user.last_name}".strip()

    def getEmail(self, obj):
        """Return owner email from linked user."""
        return obj.user.email
    

class CreateOwnerSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True)
    last_name = serializers.CharField(write_only=True)
    temp_password = serializers.CharField(read_only=True)

    class Meta:
        model = Owner
        fields = ['email', 'first_name', 'last_name', 'phone', 'address', 'temp_password']
    
    def create(self, validated_data):
        from users.models import User
        import random
        import string
        
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        # Create user WITHOUT agency first (agency will be set in the view)
        user = User.objects.create_user(
            email=email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
            role='owner',
            agency=None
        )
        
        # Create owner
        owner = Owner.objects.create(user=user, **validated_data)
        
        return {
            'id': owner.id,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'phone': validated_data.get('phone', ''),
            'address': validated_data.get('address', ''),
            'temp_password': temp_password
        }