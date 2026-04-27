from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .models import User

def send_password_reset_email(user, request):
    """Sends password reset email with token - one function one responsibility"""
    
    # Generate token and uid
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Build reset URL (adjust for your frontend URL)
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
    
    # Send email
    subject = "Password Reset Request"
    message = f"""
    Hello {user.first_name},
    
    You requested a password reset. Click the link below to reset your password:
    
    {reset_url}
    
    If you didn't request this, please ignore this email.
    
    This link expires in 24 hours.
    """
    
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

def validate_reset_token(uidb64, token):
    """Validates password reset token and returns user if valid"""
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        
        if default_token_generator.check_token(user, token):
            return user
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        pass
    
    return None