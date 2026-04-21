from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import Owner
from .serializers import OwnerSerializer, CreateOwnerSerializer, UpdateOwnerSerializer

class OwnerViewSet(viewsets.ModelViewSet):
    queryset = Owner.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOwnerSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdateOwnerSerializer
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
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = serializer.save()
        
        return Response({
            'id': result['id'],
            'email': result['email'],
            'first_name': result['first_name'],
            'last_name': result['last_name'],
            'phone': result['phone'],
            'address': result['address'],
            'temp_password': result['temp_password'],
            'message': 'Owner created successfully'
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return the updated owner with full details
        owner_serializer = OwnerSerializer(instance)
        return Response(owner_serializer.data)
    def perform_create(self, serializer):
       owner = serializer.save()
       if self.request.user.role != 'admin' or not owner.user.agency:
        owner.user.agency = self.request.user.agency
        owner.user.save()
    