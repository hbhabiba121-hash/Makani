from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """Allows access only to admin users"""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsStaffOrAdmin(permissions.BasePermission):
    """Allows access to staff and admin users"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'staff', 'finance_staff', 'property_staff', 'agency_manager']


class IsFinanceStaff(permissions.BasePermission):
    """Allows access to finance staff only"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'finance_staff']


class IsPropertyStaff(permissions.BasePermission):
    """Allows access to property staff only"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'property_staff']


class IsAgencyManager(permissions.BasePermission):
    """Allows access to agency manager only"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'agency_manager']


class IsAgencyOwnerOrAdmin(permissions.BasePermission):
    """Allows access to agency owner or admin"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'agency_owner', 'super_admin']


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allows access to owner of the object or admin"""
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role in ['admin', 'super_admin']:
            return True
        # Check if the user is the owner of the object
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner.user == request.user
        return False


class IsOwnerUser(permissions.BasePermission):
    """Allows users to access only their own profile"""
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        # Admin can access any profile
        if request.user.role in ['admin', 'super_admin']:
            return True
        # Users can only access their own profile
        return obj == request.user