from django.db import models
from properties.models import Property

class Report(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reports')
    month = models.IntegerField()
    year = models.IntegerField()
    generated_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    
    def __str__(self):
        return f'Report — {self.property.name} {self.month}/{self.year}'
    
    class Meta:
        unique_together = ('property', 'month', 'year')
        ordering = ['-year', '-month']