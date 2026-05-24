from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    portfolio_count = models.IntegerField(default=0)
    selected_university_id = models.IntegerField(null=True, blank=True)
    current_roadmap_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username}'s profile"
