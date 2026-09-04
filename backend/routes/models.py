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


class ChallanRecord(models.Model):
    challan_id = models.CharField(max_length=64, unique=True, db_index=True)
    violation_type = models.CharField(max_length=100, default="RED LIGHT VIOLATION")
    vehicle_type = models.CharField(max_length=50, default="Car")
    vehicle_number = models.CharField(max_length=50, default="Pending ANPR")
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    location = models.CharField(max_length=150, default="Vijay Nagar Junction, Indore")
    signal_state = models.CharField(max_length=20, default="RED")
    evidence_image_url = models.CharField(max_length=500, blank=True, null=True)
    before_evidence_url = models.CharField(max_length=500, blank=True, null=True)
    during_evidence_url = models.CharField(max_length=500, blank=True, null=True)
    after_evidence_url = models.CharField(max_length=500, blank=True, null=True)
    tracking_id = models.IntegerField(default=0)
    confidence = models.FloatField(default=0.92)
    status = models.CharField(max_length=50, default="AI DETECTED — PENDING REVIEW")

    class Meta:
        ordering = ['-timestamp']

    def to_dict(self):
        demo_map = {
            1: {"number": "MP-09-AB-1234 (Demo ANPR)", "owner": "Rajesh Sharma (Demo)"},
            2: {"number": "MP-09-CD-5678 (Demo ANPR)", "owner": "Ankit Verma (Demo)"},
            7: {"number": "MP-09-XY-9876 (Demo ANPR)", "owner": "Pooja Patel (Demo)"},
            8: {"number": "MP-09-EF-4321 (Demo ANPR)", "owner": "Vikram Singh (Demo)"},
            12: {"number": "MP-09-GH-8765 (Demo ANPR)", "owner": "Suresh Gupta (Demo)"}
        }
        mock_info = demo_map.get(self.tracking_id, {"number": "MP-09-AZ-9999 (Demo ANPR)", "owner": "Demo Vehicle Owner"})

        ev_url = self.evidence_image_url if self.evidence_image_url else "/media/evidence/demo_evidence.jpg"
        b_url = self.before_evidence_url if self.before_evidence_url else ev_url
        d_url = self.during_evidence_url if self.during_evidence_url else ev_url
        a_url = self.after_evidence_url if self.after_evidence_url else ev_url

        return {
            "id": self.id,
            "challan_id": self.challan_id,
            "violation_type": self.violation_type,
            "vehicle_type": self.vehicle_type,
            "vehicle_number": mock_info["number"] if self.vehicle_number == "Pending ANPR" else self.vehicle_number,
            "owner_name": mock_info["owner"],
            "timestamp": self.timestamp.strftime("%Y-%m-%d %I:%M:%S %p") if self.timestamp else "",
            "location": self.location,
            "signal_state": self.signal_state,
            "evidence_image_url": ev_url,
            "before_evidence_url": b_url,
            "during_evidence_url": d_url,
            "after_evidence_url": a_url,
            "tracking_id": self.tracking_id,
            "confidence": self.confidence,
            "fine_amount": 1000,
            "status": self.status,
            "detection_summary": f"Vehicle ID #{self.tracking_id} ({self.vehicle_type}) crossed the stop line while the signal was {self.signal_state}."
        }


class TrafficPoliceAlert(models.Model):
    alert_id = models.CharField(max_length=64, unique=True, db_index=True)
    location = models.CharField(max_length=255)
    source = models.CharField(max_length=255, blank=True, default="")
    destination = models.CharField(max_length=255, blank=True, default="")
    traffic_level = models.CharField(max_length=20, default="HIGH")
    confidence = models.FloatField(default=0.91)
    vehicle_count = models.IntegerField(default=126)
    historical_baseline = models.IntegerField(default=82)
    recent_traffic = models.IntegerField(default=118)
    expected_duration = models.CharField(max_length=50, default="20–30 min")
    detected_at = models.DateTimeField(auto_now_add=True, db_index=True)
    status = models.CharField(max_length=50, default="ALERT SENT")
    recommended_action = models.TextField(default="Deploy traffic personnel to manage vehicle flow.")
    assigned_unit = models.CharField(max_length=100, blank=True, null=True, default=None)

    class Meta:
        ordering = ['-detected_at']

    def to_dict(self):
        return {
            "id": self.id,
            "alert_id": self.alert_id,
            "location": self.location,
            "source": self.source,
            "destination": self.destination,
            "traffic_level": self.traffic_level,
            "confidence": round(self.confidence * 100) if self.confidence <= 1.0 else round(self.confidence),
            "vehicle_count": self.vehicle_count,
            "historical_baseline": self.historical_baseline,
            "recent_traffic": self.recent_traffic,
            "expected_duration": self.expected_duration,
            "detected_at": self.detected_at.strftime("%I:%M %p") if self.detected_at else "",
            "timestamp_full": self.detected_at.strftime("%Y-%m-%d %H:%M:%S") if self.detected_at else "",
            "status": self.status,
            "recommended_action": self.recommended_action,
            "assigned_unit": self.assigned_unit
        }


class PoliceUnit(models.Model):
    unit_code = models.CharField(max_length=50, unique=True)
    officer_name = models.CharField(max_length=100, default="Officer On Duty")
    location = models.CharField(max_length=150, default="Central Post")
    status = models.CharField(max_length=50, default="Available")
    current_alert_id = models.CharField(max_length=64, blank=True, null=True, default=None)

    def to_dict(self):
        return {
            "id": self.id,
            "unit_code": self.unit_code,
            "officer_name": self.officer_name,
            "location": self.location,
            "status": self.status,
            "current_alert_id": self.current_alert_id
        }


