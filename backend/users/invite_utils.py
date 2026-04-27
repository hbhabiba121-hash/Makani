from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from .models import User

def send_invite_email(user, created_by, temp_password):
    """Send invitation email to new user"""
    
    subject = f"Welcome to {user.agency.name} - Makani Property Management"
    
    message = f"""
    Hello {user.first_name},
    
    {created_by.first_name} {created_by.last_name} from {user.agency.name} has invited you to join Makani.
    
    Your account has been created with:
    Email: {user.email}
    Temporary Password: {temp_password}
    Role: {user.role}
    
    Please login and change your password immediately:
    {settings.FRONTEND_URL}/login
    
    If you have any questions, contact your agency administrator.
    
    Welcome aboard!
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )