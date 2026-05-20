# users/urls.py - COMPLETE FIXED VERSION

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    LoginView, LogoutView, ProfileView, ChangePasswordView,
    ForgotPasswordView, ResetPasswordView, UserViewSet,
    CreateUserByAgencyAdminView, AgencyUsersListView,
    CreateStaffView, StaffListView, StaffDetailView, StaffDeleteView,
    upload_profile_picture, update_profile, get_current_user,
    upload_staff_picture  # Add this import
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Router URLs
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile management
    path('profile/', ProfileView.as_view(), name='profile'),
    path('me/', get_current_user, name='current-user'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Password reset
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/<uidb64>/<token>/', ResetPasswordView.as_view(), name='reset_password'),
    
    # Agency user management
    path('agency/create-user/', CreateUserByAgencyAdminView.as_view(), name='create_user_by_agency'),
    path('agency/users/', AgencyUsersListView.as_view(), name='agency_users'),

    # Staff CRUD endpoints
    path("staff/", StaffListView.as_view(), name='staff-list'),
    path("staff/create/", CreateStaffView.as_view(), name='staff-create'),
    path("staff/<int:pk>/", StaffDetailView.as_view(), name='staff-detail'),
    path("staff/<int:pk>/delete/", StaffDeleteView.as_view(), name='staff-delete'),
    path('staff/<int:staff_id>/upload-picture/', upload_staff_picture, name='upload-staff-picture'),  # ADD THIS LINE

    # Profile picture and update endpoints
    path('profile/update/', update_profile, name='update-profile'),
    path('profile/upload-picture/', upload_profile_picture, name='upload-picture'),
]