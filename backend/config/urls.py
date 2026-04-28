# backend/config/urls.py - FIXED WITH MEDIA FILES

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/users/', include('users.urls')),
    path('api/', include('owners.urls')),
    path('api/', include('properties.urls')),
    path('financials/', include('financials.urls')),
    path('reports/', include('reports.urls')),  # MAKE SURE THIS LINE EXISTS
    path('api-auth/', include('rest_framework.urls')),
]

# Serve media files in development (for receipts/uploads)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)