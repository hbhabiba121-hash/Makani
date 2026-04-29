from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.files.uploadedfile import UploadedFile
from .models import Property, PropertyImage
from .serializers import PropertySerializer, CreatePropertySerializer, PropertyImageSerializer


class CanManageProperties(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'staff']
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        if request.user.role in ['admin', 'staff']:
            return obj.agency == request.user.agency
        return False


class CanViewProperties(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        if request.user.role in ['admin', 'staff']:
            return obj.agency == request.user.agency
        if request.user.role == 'owner':
            return obj.owner and obj.owner.user == request.user
        return False


class PropertyViewSet(viewsets.ModelViewSet):
    queryset = Property.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def get_serializer_class(self):
        if self.action == 'create':
            return CreatePropertySerializer
        return PropertySerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Property.objects.all().prefetch_related('images')
        elif user.role == 'staff':
            return Property.objects.filter(agency=user.agency).prefetch_related('images')
        elif user.role == 'owner' and hasattr(user, 'owner_profile'):
            return Property.objects.filter(owner=user.owner_profile).prefetch_related('images')
        return Property.objects.none()

    def perform_create(self, serializer):
        agency = self.request.user.agency
        serializer.save(agency=agency)

    @action(detail=True, methods=['post'], url_path='upload-images')
    def upload_images(self, request, pk=None):
        """Upload multiple images for a property"""
        property_obj = self.get_object()
        
        # Check permission
        user = request.user
        if user.role not in ['admin', 'staff']:
            if user.role == 'owner' and property_obj.owner and property_obj.owner.user != user:
                return Response(
                    {'error': 'You do not have permission to upload images for this property'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        images = request.FILES.getlist('images')
        
        if not images:
            return Response(
                {'error': 'No images provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_images = []
        for i, image in enumerate(images):
            if isinstance(image, UploadedFile):
                # First image becomes main if no main image exists
                is_main = (i == 0 and not property_obj.images.filter(is_main=True).exists())
                
                property_image = PropertyImage.objects.create(
                    property=property_obj,
                    image=image,
                    is_main=is_main
                )
                uploaded_images.append(property_image)
        
        serializer = PropertyImageSerializer(
            uploaded_images, 
            many=True, 
            context={'request': request}
        )
        
        return Response({
            'message': f'Successfully uploaded {len(uploaded_images)} images',
            'images': serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path='delete-image/(?P<image_id>[^/.]+)')
    def delete_image(self, request, pk=None, image_id=None):
        """Delete a specific image from a property"""
        property_obj = self.get_object()
        
        try:
            image = property_obj.images.get(id=image_id)
            image.delete()
            
            # If we deleted the main image, make another image main if available
            if image.is_main:
                next_image = property_obj.images.first()
                if next_image:
                    next_image.is_main = True
                    next_image.save()
            
            return Response({'message': 'Image deleted successfully'}, status=status.HTTP_200_OK)
        except PropertyImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], url_path='set-main-image/(?P<image_id>[^/.]+)')
    def set_main_image(self, request, pk=None, image_id=None):
        """Set an image as the main image for the property"""
        property_obj = self.get_object()
        
        try:
            # Remove main flag from all images
            property_obj.images.update(is_main=False)
            
            # Set new main image
            image = property_obj.images.get(id=image_id)
            image.is_main = True
            image.save()
            
            return Response({'message': 'Main image updated successfully'}, status=status.HTTP_200_OK)
        except PropertyImage.DoesNotExist:
            return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)

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
                'property': PropertySerializer(property_obj, context={'request': request}).data
            })
        except Owner.DoesNotExist:
            return Response({'error': 'Owner not found'}, status=404)