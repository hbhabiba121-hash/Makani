

from rest_framework import permissions

class CanManageProperties(permissions.BasePermission):

    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'staff']
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Platform admin can do anything
        if request.user.role == 'admin':
            return True
        
        # Agency staff/admin can only manage their agency's properties
        if request.user.role in ['admin', 'staff']:
            return obj.agency == request.user.agency
        
        return False


class CanViewProperties(permissions.BasePermission):

    
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Platform admin sees everything
        if request.user.role == 'admin':
            return True
        
        # Agency staff/admin see all properties in their agency
        if request.user.role in ['admin', 'staff']:
            return obj.agency == request.user.agency
        
        # Owners see only their own properties
        if request.user.role == 'owner':
            return obj.owner and obj.owner.user == request.user
        
        return False