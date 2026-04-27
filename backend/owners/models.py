from django.db import models
from users.models import User

class Owner(models.Model):
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE,  # This is KEY: when User is deleted, Owner is auto-deleted
        related_name='owner_profile'
    )
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name}"
    
    class Meta:
        verbose_name = 'Owner'
        verbose_name_plural = 'Owners'
        ordering = ['-created_at']