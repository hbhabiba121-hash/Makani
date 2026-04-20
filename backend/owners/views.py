from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Owner
from .serializers import OwnerSerializer, CreateOwnerSerializer

class OwnerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for owners.
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