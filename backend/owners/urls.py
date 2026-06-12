# owners/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'owners', views.OwnerViewSet, basename='owner')

urlpatterns = [
    path('', include(router.urls)),
    path('owners/<int:owner_id>/upload-picture/', views.upload_owner_picture, name='upload-owner-picture'),
]