# owners/models.py - Add this field if missing

from django.db import models

class Owner(models.Model):
    user = models.OneToOneField('users.User', on_delete=models.CASCADE, related_name='owner_profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    picture = models.ImageField(upload_to='owner_pictures/', null=True, blank=True)  # ADD THIS LINE
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"