# views.py - FULLY CORRECTED VERSION

# Add these imports at the top
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User
from .serializers import UserSerializer
from agencies.models import Agency
from .invite_utils import send_invite_email
import random
import string
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from .models import User
from .serializers import (
    UserSerializer, UserRegistrationSerializer, 
    ChangePasswordSerializer
)
from .permissions import IsAdmin, IsStaffOrAdmin, IsOwnerUser
from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserSerializer

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for users (read-only).
    
    **GET /api/users/** - List users (based on role)
    **GET /api/users/{id}/** - Get user details
    """
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all()
        elif user.role == 'staff':
            return User.objects.filter(agency=user.agency)
        elif user.role == 'owner':
            return User.objects.filter(id=user.id)
        return User.objects.none()
    
    
class LoginView(TokenObtainPairView):
    """Handles user login and returns JWT tokens"""
    
    def post(self, request, *args, **kwargs):
        """Authenticates user and returns tokens with user data"""
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(email=email, password=password)
        
        if not user:
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            return Response({
                'error': 'User account is disabled'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class LogoutView(APIView):
    """Handles user logout by blacklisting refresh token"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Blacklists the refresh token"""
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({
                    'error': 'Refresh token is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response({
                'message': 'Successfully logged out'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'Invalid token'
            }, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(generics.RetrieveUpdateAPIView):
    """Handles user profile retrieval and updates with role-based access"""
    
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Returns the current authenticated user"""
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        """Update user profile with role-based restrictions"""
        user = self.get_object()
        
        # Restrict role changes
        if 'role' in request.data and request.data['role'] != user.role:
            if request.user.role != 'admin':
                return Response({
                    'error': 'Only admins can change user roles'
                }, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)

class ChangePasswordView(APIView):
    """Handles password change for authenticated users"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Changes user password after validation"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        # Verify old password
        if not user.check_password(old_password):
            return Response({
                'old_password': 'Wrong password'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password changed successfully'
        }, status=status.HTTP_200_OK)

class ForgotPasswordView(APIView):
    """Handles forgot password - sends reset email"""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            # Import here to avoid circular import
            from .utils import send_password_reset_email
            send_password_reset_email(user, request)
        except User.DoesNotExist:
            # Don't reveal if user exists for security
            pass
        
        return Response({
            'message': 'If an account exists with this email, you will receive a password reset link.'
        }, status=status.HTTP_200_OK)

class ResetPasswordView(APIView):
    """Handles password reset with token validation"""
    
    permission_classes = [permissions.AllowAny]
    
    def post(self, request, uidb64, token):
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not new_password or not confirm_password:
            return Response({
                'error': 'Both password fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'error': 'Passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Import here to avoid circular import
        from .utils import validate_reset_token
        user = validate_reset_token(uidb64, token)
        
        if not user:
            return Response({
                'error': 'Invalid or expired reset link'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password reset successfully'
        }, status=status.HTTP_200_OK)

class AdminOnlyView(APIView):
    """Example view that only admins can access"""
    
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def get(self, request):
        return Response({
            'message': 'Welcome Admin! You have access to this view.'
        })

class StaffOnlyView(APIView):
    """Example view that staff and admins can access"""
    
    permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
    
    def get(self, request):
        return Response({
            'message': f'Welcome {request.user.role}! You have staff access.'
        })

class UserListView(generics.ListAPIView):
    """List all users - Admin only"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update or delete a specific user"""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerUser]
    
    def delete(self, request, *args, **kwargs):
        """Delete user - only admin or the user themselves"""
        user = self.get_object()
        if request.user.role == 'admin' or request.user == user:
            user.delete()
            return Response({
                'message': 'User deleted successfully'
            }, status=status.HTTP_200_OK)
        return Response({
            'error': 'You do not have permission to delete this user'
        }, status=status.HTTP_403_FORBIDDEN)

class PromoteUserView(APIView):
    """Promote a user to a different role - Admin only"""
    
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
            new_role = request.data.get('role')
            
            if new_role not in ['admin', 'staff', 'owner']:
                return Response({
                    'error': 'Invalid role. Must be admin, staff, or owner'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.role = new_role
            user.save()
            
            return Response({
                'message': f'User {user.email} promoted to {new_role}',
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)

class CreateUserByAgencyAdminView(APIView):
    """
    Agency Admin creates staff or property owner users
    Only Agency Admins can create users within their agency
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Check if user is admin or agency admin
        if user.role not in ['admin', 'staff']:
            return Response({
                'error': 'Only agency administrators can create users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get agency from requesting user
        agency = None
        if user.role == 'admin':
            # For platform admin, they can specify agency_id or use their own
            agency_id = request.data.get('agency_id')
            if agency_id:
                try:
                    from agencies.models import Agency
                    agency = Agency.objects.get(id=agency_id)
                except:
                    return Response({
                        'error': 'Invalid agency_id'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                agency = user.agency
        else:
            # Staff users must have an agency
            agency = user.agency
            if not agency:
                return Response({
                    'error': 'User not associated with any agency'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate required fields
        email = request.data.get('email')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        role = request.data.get('role', 'staff')
        
        if not all([email, first_name, last_name]):
            return Response({
                'error': 'Email, first name, and last name are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'User with this email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate role
        if role not in ['staff', 'owner']:
            return Response({
                'error': 'Role must be staff or owner'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate random password
        import random
        import string
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        
        # Create user
        try:
            new_user = User.objects.create_user(
                email=email,
                password=temp_password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                agency=agency
            )
            
            # Send invitation email
            from .invite_utils import send_invite_email
            send_invite_email(new_user, user, temp_password)
            
            return Response({
                'message': f'User {email} created successfully. Invitation sent.',
                'user': UserSerializer(new_user).data,
                'temp_password': temp_password  # Remove this in production
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class AgencyUsersListView(APIView):
    """List all users in the same agency - for Agency Admins"""
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Platform admin can see all users
        if user.role == 'admin':
            users = User.objects.all()
        else:
            # Agency users can only see users in their agency
            if not user.agency:
                return Response({
                    'error': 'User not associated with any agency'
                }, status=status.HTTP_400_BAD_REQUEST)
            users = User.objects.filter(agency=user.agency)
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


# ===================== STAFF CRUD VIEWS =====================

class CreateStaffView(APIView):
    """Create a new staff member under the same agency"""
    
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user

        # Check if user has an agency
        if not user.agency:
            return Response(
                {"error": "No agency linked to your account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission (admin or staff can create staff)
        if user.role not in ["admin", "staff"]:
            return Response(
                {"error": "You don't have permission to create staff members"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Get data from request
        email = request.data.get("email")
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")

        # Validate required fields
        if not all([email, first_name, last_name]):
            return Response(
                {"error": "Email, first name, and last name are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if email already exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "A user with this email already exists"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate random temporary password
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

        # Create the staff user
        try:
            staff = User.objects.create_user(
                email=email,
                password=temp_password,
                first_name=first_name,
                last_name=last_name,
                role="staff",
                agency=user.agency
            )

            return Response({
                "message": "Staff member created successfully",
                "user": UserSerializer(staff).data,
                "temp_password": temp_password  # Send temp password to frontend
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": f"Failed to create staff member: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class StaffListView(APIView):
    """List all staff members in the same agency"""
    
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Check if user has an agency
        if not user.agency:
            return Response(
                [],  # Return empty list instead of error
                status=status.HTTP_200_OK
            )

        # Get all staff members in the same agency
        staff_members = User.objects.filter(
            agency=user.agency,
            role="staff"
        ).order_by('first_name', 'last_name')

        serializer = UserSerializer(staff_members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffDetailView(APIView):
    """Update a specific staff member's details"""
    
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        user = request.user

        # Check if user has an agency
        if not user.agency:
            return Response(
                {"error": "No agency linked to your account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find the staff member (must be in same agency and role='staff')
        try:
            staff = User.objects.get(pk=pk, role="staff", agency=user.agency)
        except User.DoesNotExist:
            return Response(
                {"error": "Staff member not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Update fields (only if provided in request)
        if 'first_name' in request.data:
            staff.first_name = request.data['first_name']
        
        if 'last_name' in request.data:
            staff.last_name = request.data['last_name']
        
        if 'email' in request.data:
            # Check if new email is already taken by another user
            new_email = request.data['email']
            if User.objects.exclude(pk=pk).filter(email=new_email).exists():
                return Response(
                    {"error": "A user with this email already exists"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            staff.email = new_email

        # Save the updated staff member
        staff.save()

        return Response(
            UserSerializer(staff).data, 
            status=status.HTTP_200_OK
        )


class StaffDeleteView(APIView):
    """Delete a specific staff member"""
    
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        user = request.user

        # Check if user has an agency
        if not user.agency:
            return Response(
                {"error": "No agency linked to your account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find the staff member (must be in same agency and role='staff')
        try:
            staff = User.objects.get(pk=pk, role="staff", agency=user.agency)
        except User.DoesNotExist:
            return Response(
                {"error": "Staff member not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Don't allow deleting yourself
        if staff.id == user.id:
            return Response(
                {"error": "You cannot delete your own account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete the staff member
        staff.delete()

        return Response(
            {"message": "Staff member deleted successfully"}, 
            status=status.HTTP_200_OK
        )