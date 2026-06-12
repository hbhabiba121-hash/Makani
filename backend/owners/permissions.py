

from rest_framework import permissions

class CanManageOwners(permissions.BasePermission):

    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Platform admin or agency staff/admin can manage
        return request.user.role in ['admin', 'staff']


class CanViewOwnerDetails(permissions.BasePermission):

    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Platform admin can see everything
        if request.user.role == 'admin':
            return True
        
        # Agency staff/admin can see owners in their agency
        if request.user.role in ['admin', 'staff']:
            return obj.user.agency == request.user.agency
        
        # Owners can only see themselves
        if request.user.role == 'owner':
            return obj.user == request.user
        
        return False