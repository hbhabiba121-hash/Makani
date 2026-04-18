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
        return request.user.role in ['admin', 'staff']

class IsOwnerOrAdmin(permissions.BasePermission):
    """Allows access to owner of the object or admin"""
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
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
        if request.user.role == 'admin':
            return True
        # Users can only access their own profile
        return obj == request.user