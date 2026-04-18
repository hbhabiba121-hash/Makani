from rest_framework import viewsets, permissions
from .models import Owner
from .serializers import OwnerSerializer, CreateOwnerSerializer
from .permissions import CanManageOwners, CanViewOwnerDetails

class OwnerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for owners.
    
    **GET /api/owners/** - List all owners
    **POST /api/owners/** - Create a new owner
    **GET /api/owners/{id}/** - Get owner details
    **PUT /api/owners/{id}/** - Update owner
    **DELETE /api/owners/{id}/** - Delete owner
    """
    
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
    
    def perform_create(self, serializer):
        owner = serializer.save()
        if self.request.user.role != 'admin':
            owner.user.agency = self.request.user.agency
            owner.user.save()