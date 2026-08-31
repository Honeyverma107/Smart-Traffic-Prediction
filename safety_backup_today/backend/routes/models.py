from django.db import models
from django.utils import timezone
from datetime import timedelta
# Create your models here.


class TrafficData(models.Model):
    road_id = models.BigIntegerField()
    latitude_start = models.FloatField()
    longitude_start = models.FloatField()
    latitude_end = models.FloatField()
    longitude_end = models.FloatField()
    date = models.DateField()
    time = models.TimeField()
    speed_kmh = models.FloatField()
    congestion_level = models.CharField(max_length=20)

    class Meta:
        indexes = [
            models.Index(fields=['road_id', 'time']),
        ]

class RawGPSData(models.Model):
    latitude = models.FloatField()
    longitude = models.FloatField()
    speed_kmh = models.FloatField()
    timestamp = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    

#------------------



class UserProfile(models.Model):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class OTP(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=5)


class SegmentTrafficObservation(models.Model):
    u_node = models.BigIntegerField(db_index=True)
    v_node = models.BigIntegerField(db_index=True)
    edge_key = models.IntegerField(default=0)
    osmid = models.CharField(max_length=100, null=True, blank=True)
    road_name = models.CharField(max_length=255, default="Unnamed Road")
    camera_lat = models.FloatField()
    camera_lng = models.FloatField()
    car_count = models.IntegerField(default=0)
    bike_count = models.IntegerField(default=0)
    bus_count = models.IntegerField(default=0)
    truck_count = models.IntegerField(default=0)
    observed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['u_node', 'v_node', 'edge_key']),
            models.Index(fields=['observed_at']),
        ]

