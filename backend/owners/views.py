# owners/views.py - COMPLETE WORKING VERSION (CREATE, UPDATE, DELETE)
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.db import transaction
from .models import Owner
from .serializers import OwnerSerializer, CreateOwnerSerializer
from users.models import User
from agencies.models import Agency

class OwnerViewSet(viewsets.ModelViewSet):
    queryset = Owner.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOwnerSerializer
        return OwnerSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Owner.objects.all()
        elif user.role == 'staff':
            return Owner.objects.filter(user__agency=user.agency)
        elif user.role == 'owner' and hasattr(user, 'owner_profile'):
            return Owner.objects.filter(user=user)
        return Owner.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Get data from request
        data = request.data
        current_user = request.user
        
        # Check if user has agency
        if not current_user.agency:
            return Response({
                "error": "You must belong to an agency to create owners"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Extract data
        email = data.get('email')
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        phone = data.get('phone', '')
        address = data.get('address', '')
        
        # Validate
        if not all([email, first_name, last_name]):
            return Response({
                "error": "Email, first name, and last name are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        if User.objects.filter(email=email).exists():
            return Response({
                "error": "User with this email already exists"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate temp password
        import random
        import string
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        # Create user with agency
        user = User.objects.create_user(
            email=email,
            password=temp_password,
            first_name=first_name,
            last_name=last_name,
            role='owner',
            agency=current_user.agency
        )
        
        # Create owner
        owner = Owner.objects.create(
            user=user,
            phone=phone,
            address=address
        )
        
        return Response({
            'id': owner.id,
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'phone': phone,
            'address': address,
            'temp_password': temp_password,
            'agency_id': user.agency.id if user.agency else None,
            'message': 'Owner created successfully'
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """
        Update owner - updates BOTH owners_owner AND users_user tables
        """
        partial = kwargs.pop('partial', False)
        
        # Get the owner instance
        owner = self.get_object()
        user = owner.user
        
        # Get data from request
        data = request.data
        
        # Update user fields (from users_user table)
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            # Check if new email is already taken by another user
            new_email = data['email']
            if User.objects.exclude(id=user.id).filter(email=new_email).exists():
                return Response({
                    "error": "A user with this email already exists"
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = new_email
        
        # Save user updates
        user.save()
        
        # Update owner fields (from owners_owner table)
        if 'phone' in data:
            owner.phone = data['phone']
        if 'address' in data:
            owner.address = data['address']
        
        # Save owner updates
        owner.save()
        
        # Return the updated owner with full details
        serializer = OwnerSerializer(owner)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def partial_update(self, request, *args, **kwargs):
        """
        Partial update - same as full update but with partial=True
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """
        Delete owner - deletes from BOTH owners_owner AND users_user tables
        """
        try:
            # Get the owner instance
            owner = self.get_object()
            
            # Get the associated user
            user = owner.user
            
            # Delete the user (this will automatically delete the owner due to CASCADE)
            user.delete()
            
            return Response(
                {"message": "Owner and associated user account deleted successfully"},
                status=status.HTTP_200_OK
            )
            
        except Owner.DoesNotExist:
            return Response(
                {"error": "Owner not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to delete owner: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )