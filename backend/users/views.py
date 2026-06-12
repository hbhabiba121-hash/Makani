# users/views.py - COMPLETELY FIXED VERSION

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import random
import string

from .models import User
from .serializers import (
    UserSerializer, UserRegistrationSerializer, 
    ChangePasswordSerializer
)
from .permissions import IsAdmin, IsStaffOrAdmin, IsOwnerUser
from agencies.models import Agency


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
        if user.role == 'admin' or user.role == 'super_admin':
            return User.objects.all()
        elif user.role == 'staff':
            return User.objects.filter(agency=user.agency)
        elif user.role == 'owner':
            return User.objects.filter(id=user.id)
        return User.objects.none()
    
 # users/views.py - Replace your LoginView with this debug version

class LoginView(TokenObtainPairView):
    """Handles user login and returns JWT tokens"""
    
    def post(self, request, *args, **kwargs):
        """Authenticates user and returns tokens with user data"""
        email = request.data.get('email')
        password = request.data.get('password')
        
        print(f"DEBUG LOGIN - Email: {email}")
        print(f"DEBUG LOGIN - Password provided: {'Yes' if password else 'No'}")
        
        if not email or not password:
            print("DEBUG LOGIN - Missing email or password")
            return Response({
                'error': 'Email and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user exists
        try:
            user_exists = User.objects.filter(email=email).exists()
            print(f"DEBUG LOGIN - User exists in database: {user_exists}")
        except Exception as e:
            print(f"DEBUG LOGIN - Error checking user: {e}")
        
        user = authenticate(email=email, password=password)
        
        if not user:
            print(f"DEBUG LOGIN - Authentication failed for email: {email}")
            # Try to get user to see if it exists but password is wrong
            try:
                user_obj = User.objects.get(email=email)
                print(f"DEBUG LOGIN - User found but password incorrect. User is_active: {user_obj.is_active}")
            except User.DoesNotExist:
                print(f"DEBUG LOGIN - User does not exist at all")
            
            return Response({
                'error': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            print(f"DEBUG LOGIN - User is inactive: {email}")
            return Response({
                'error': 'User account is disabled'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        print(f"DEBUG LOGIN - Authentication successful for: {email}")
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
            if request.user.role not in ['admin', 'super_admin']:
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
        if request.user.role in ['admin', 'super_admin'] or request.user == user:
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
            
            valid_roles = ['super_admin', 'admin', 'agency_manager', 'finance_staff', 'property_staff', 'owner', 'staff']
            if new_role not in valid_roles:
                return Response({
                    'error': f'Invalid role. Must be one of: {valid_roles}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.role = new_role
            user.save()
            
            return Response({
                'message': f'User {user.email} role changed to {new_role}',
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
        if user.role not in ['admin', 'super_admin', 'staff']:
            return Response({
                'error': 'Only agency administrators can create users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Get agency from requesting user
        agency = None
        if user.role in ['admin', 'super_admin']:
            # For platform admin, they can specify agency_id or use their own
            agency_id = request.data.get('agency_id')
            if agency_id:
                try:
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
        valid_roles = ['staff', 'owner', 'property_staff', 'finance_staff', 'agency_manager']
        if role not in valid_roles:
            return Response({
                'error': f'Role must be one of: {valid_roles}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate random password
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
                'temp_password': temp_password
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
        if user.role in ['admin', 'super_admin']:
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
        print(f"DEBUG: CreateStaffView - User {user.email} (role: {user.role}) creating staff")
        print(f"DEBUG: Request data: {request.data}")

        # Check if user has an agency
        if not user.agency:
            return Response(
                {"error": "No agency linked to your account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if user has permission
        if user.role not in ["admin", "super_admin", "staff"]:
            return Response(
                {"error": "You don't have permission to create staff members"}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Get data from request
        email = request.data.get("email")
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        phone = request.data.get("phone", "")
        role = request.data.get("role", "property_staff")

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

        # Validate role
        valid_roles = ['super_admin', 'admin', 'agency_manager', 'finance_staff', 'property_staff', 'owner']
        if role not in valid_roles:
            role = 'property_staff'  # Default role

        # Generate random temporary password
        temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))

        # Create the staff user
        try:
            staff = User.objects.create_user(
                email=email,
                password=temp_password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                agency=user.agency,
                phone=phone,
                is_active=True
            )
            
            print(f"DEBUG: Created staff {staff.email} with role {staff.role}")

            return Response({
                "message": "Staff member created successfully",
                "user": UserSerializer(staff).data,
                "temp_password": temp_password
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"DEBUG: Error creating staff: {str(e)}")
            return Response(
                {"error": f"Failed to create staff member: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class StaffListView(APIView):
    """List all staff members in the same agency (including all staff roles)"""
    
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        print(f"DEBUG: StaffListView - User {user.email} (role: {user.role}) fetching staff")

        # Check if user has an agency
        if not user.agency:
            print("DEBUG: No agency linked to user")
            return Response([], status=status.HTTP_200_OK)

        # Define which roles are considered "staff" for management
        staff_roles = [
            'super_admin', 
            'admin', 
            'agency_manager', 
            'finance_staff', 
            'property_staff', 
            'staff'
        ]
        
        # Get all users with staff roles in the same agency
        staff_members = User.objects.filter(
            agency=user.agency,
            role__in=staff_roles
        ).exclude(
            role='owner'  # Exclude owners
        ).order_by('first_name', 'last_name')

        print(f"DEBUG: Found {staff_members.count()} staff members")
        for member in staff_members:
            print(f"DEBUG: - {member.email} (role: {member.role})")

        serializer = UserSerializer(staff_members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffDetailView(APIView):
    """Update a specific staff member's details"""
    
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        user = request.user
        print(f"DEBUG: StaffDetailView - User {user.email} (role: {user.role}) updating staff {pk}")
        print(f"DEBUG: Request data: {request.data}")

        if not user.agency:
            return Response(
                {"error": "No agency linked to your account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find the staff member (must be in same agency)
        try:
            staff = User.objects.get(pk=pk, agency=user.agency)
            print(f"DEBUG: Found staff: {staff.email}, current role: {staff.role}")
        except User.DoesNotExist:
            return Response(
                {"error": "Staff member not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

        # Handle password reset
        if 'password' in request.data:
            new_password = request.data['password']
            staff.set_password(new_password)
            staff.save()
            return Response(
                {"message": "Password reset successfully"},
                status=status.HTTP_200_OK
            )

        # Update basic fields
        if 'first_name' in request.data:
            staff.first_name = request.data['first_name']
            print(f"DEBUG: Updated first_name to {staff.first_name}")
        
        if 'last_name' in request.data:
            staff.last_name = request.data['last_name']
            print(f"DEBUG: Updated last_name to {staff.last_name}")
        
        if 'phone' in request.data:
            staff.phone = request.data['phone']
            print(f"DEBUG: Updated phone to {staff.phone}")
        
        # Handle role update - THIS IS THE KEY PART
        if 'role' in request.data:
            new_role = request.data['role']
            valid_roles = ['super_admin', 'admin', 'agency_manager', 'finance_staff', 'property_staff', 'owner', 'staff']
            
            if new_role not in valid_roles:
                return Response(
                    {"error": f"Invalid role. Must be one of: {valid_roles}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check permission - only super_admin or admin can change roles
            if user.role not in ['super_admin', 'admin']:
                return Response(
                    {"error": "You don't have permission to change roles"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Update the role
            old_role = staff.role
            staff.role = new_role
            print(f"DEBUG: Updated role for {staff.email} from {old_role} to {new_role}")
        
        # Handle email update
        if 'email' in request.data:
            new_email = request.data['email']
            if User.objects.exclude(pk=pk).filter(email=new_email).exists():
                return Response(
                    {"error": "A user with this email already exists"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            staff.email = new_email
            print(f"DEBUG: Updated email to {new_email}")
        
        # Handle status update
        if 'is_active' in request.data:
            staff.is_active = request.data['is_active']
            print(f"DEBUG: Updated is_active to {staff.is_active}")

        # Save the staff member
        staff.save()
        print(f"DEBUG: Staff saved. Final role: {staff.role}")
        
        # Return updated data
        serializer = UserSerializer(staff)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StaffDeleteView(APIView):
    """Delete a specific staff member"""
    
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        user = request.user
        print(f"DEBUG: StaffDeleteView - User {user.email} deleting staff {pk}")

        # Check if user has an agency
        if not user.agency:
            return Response(
                {"error": "No agency linked to your account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find the staff member (must be in same agency)
        try:
            staff = User.objects.get(pk=pk, agency=user.agency)
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
        print(f"DEBUG: Deleted staff {staff.email}")

        return Response(
            {"message": "Staff member deleted successfully"}, 
            status=status.HTTP_200_OK
        )


# ===================== PROFILE PICTURE VIEWS =====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """Get current authenticated user's data"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile - works for all user types"""
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_picture(request):
    """Upload profile picture - works for all user types"""
    if 'picture' not in request.FILES:
        return Response({'error': 'No picture provided'}, status=400)
    
    user = request.user
    user.picture = request.FILES['picture']
    user.save()
    
    serializer = UserSerializer(user)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_staff_picture(request, staff_id):
    """Upload profile picture for a staff member"""
    try:
        staff = User.objects.get(id=staff_id, agency=request.user.agency)
    except User.DoesNotExist:
        return Response({'error': 'Staff member not found'}, status=404)
    
    if 'picture' not in request.FILES:
        return Response({'error': 'No picture provided'}, status=400)
    
    staff.picture = request.FILES['picture']
    staff.save()
    
    serializer = UserSerializer(staff)
    return Response(serializer.data)