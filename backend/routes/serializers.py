from rest_framework import serializers
from .models import TrafficData, RawGPSData

class TrafficDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrafficData
        fields = ['road_id', 'latitude_start', 'longitude_start', 'latitude_end', 'longitude_end', 'speed_kmh', 'congestion_level']

class RawGPSDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = RawGPSData
        fields = ['latitude', 'longitude', 'speed_kmh', 'timestamp']