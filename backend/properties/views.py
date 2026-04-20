from rest_framework import viewsets, permissions 
from rest_framework.decorators import action 
from rest_framework.response import Response 
from .models import Property 
from .serializers import PropertySerializer, CreatePropertySerializer 
 
class PropertyViewSet(viewsets.ModelViewSet): 
    queryset = Property.objects.all() 
    permission_classes = [permissions.IsAuthenticated] 
 
    def get_serializer_class(self): 
        if self.action == 'create': 
            return CreatePropertySerializer 
        return PropertySerializer 
 
    def get_queryset(self): 
        user = self.request.user 
        if user.role == 'admin': 
            return Property.objects.all() 
        elif user.role == 'staff': 
            return Property.objects.filter(agency=user.agency) 
        elif user.role == 'owner' and hasattr(user, 'owner_profile'): 
            return Property.objects.filter(owner=user.owner_profile) 
        return Property.objects.none() 
 
    def perform_create(self, serializer): 
        agency = self.request.user.agency 
        serializer.save(agency=agency) 
 
    @action(detail=True, methods=['post']) 
    def assign_owner(self, request, pk=None): 
        property_obj = self.get_object() 
        owner_id = request.data.get('owner_id') 
        from owners.models import Owner 
        try: 
            owner = Owner.objects.get(id=owner_id) 
            property_obj.owner = owner 
            property_obj.save() 
            return Response({ 
                'message': f'Owner assigned to {property_obj.name}', 
                'property': PropertySerializer(property_obj).data 
            }) 
        except Owner.DoesNotExist: 
            return Response({'error': 'Owner not found'}, status=404) 
