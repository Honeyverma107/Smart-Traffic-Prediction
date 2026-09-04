import random
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import TrafficPoliceAlert, PoliceUnit

DEFAULT_DEMO_ALERTS = [
    {
        "id": 1,
        "alert_id": "TR-1042",
        "location": "Vijay Nagar Junction",
        "source": "Vijay Nagar",
        "destination": "Palasia Square",
        "traffic_level": "HIGH",
        "confidence": 91,
        "vehicle_count": 126,
        "historical_baseline": 82,
        "recent_traffic": 118,
        "expected_duration": "20–30 min",
        "detected_at": "10:42 AM",
        "timestamp_full": "2026-09-04 10:42:00",
        "status": "ALERT SENT",
        "recommended_action": "Deploy traffic personnel at Vijay Nagar Junction and consider diverting vehicles toward the alternate Eastern Ring Road route.",
        "assigned_unit": None
    },
    {
        "id": 2,
        "alert_id": "TR-1039",
        "location": "Palasia Square",
        "source": "Palasia",
        "destination": "Geeta Bhawan",
        "traffic_level": "HIGH",
        "confidence": 87,
        "vehicle_count": 114,
        "historical_baseline": 75,
        "recent_traffic": 105,
        "expected_duration": "15–25 min",
        "detected_at": "10:31 AM",
        "timestamp_full": "2026-09-04 10:31:00",
        "status": "ACKNOWLEDGED",
        "recommended_action": "Manually override signal timing at Palasia Square to extend green wave toward Geeta Bhawan.",
        "assigned_unit": "Unit P-114"
    },
    {
        "id": 3,
        "alert_id": "TR-1037",
        "location": "Rajwada Square",
        "source": "Rajwada",
        "destination": "Bhawarkua",
        "traffic_level": "MEDIUM",
        "confidence": 82,
        "vehicle_count": 92,
        "historical_baseline": 65,
        "recent_traffic": 88,
        "expected_duration": "10–15 min",
        "detected_at": "10:18 AM",
        "timestamp_full": "2026-09-04 10:18:00",
        "status": "RESOLVED",
        "recommended_action": "Situation resolved. Normal traffic flow resumed along MG Road corridor.",
        "assigned_unit": "Unit P-102"
    },
    {
        "id": 4,
        "alert_id": "TR-1035",
        "location": "Bengali Square",
        "source": "Bengali Sq.",
        "destination": "Kanadia Road",
        "traffic_level": "HIGH",
        "confidence": 89,
        "vehicle_count": 138,
        "historical_baseline": 90,
        "recent_traffic": 130,
        "expected_duration": "25–35 min",
        "detected_at": "09:55 AM",
        "timestamp_full": "2026-09-04 09:55:00",
        "status": "OFFICER DISPATCHED",
        "recommended_action": "Deploy rapid response unit at Bengali Square underpass to clear bottleneck.",
        "assigned_unit": "Unit P-121"
    }
]

DEFAULT_DEMO_UNITS = [
    {
        "id": 1,
        "unit_code": "Unit P-102",
        "officer_name": "Insp. Ramesh Sharma",
        "location": "Vijay Nagar Junction",
        "status": "Available",
        "current_alert_id": None
    },
    {
        "id": 2,
        "unit_code": "Unit P-114",
        "officer_name": "Sub-Insp. Vikas Patel",
        "location": "Palasia Square",
        "status": "Dispatched",
        "current_alert_id": "TR-1039"
    },
    {
        "id": 3,
        "unit_code": "Unit P-121",
        "officer_name": "Const. Amit Kumar",
        "location": "Bengali Square",
        "status": "Dispatched",
        "current_alert_id": "TR-1035"
    },
    {
        "id": 4,
        "unit_code": "Unit P-108",
        "officer_name": "Insp. Sunita Verma",
        "location": "Rajwada Circle",
        "status": "On Duty",
        "current_alert_id": None
    },
    {
        "id": 5,
        "unit_code": "Unit P-119",
        "officer_name": "Sub-Insp. Rahul Singh",
        "location": "Bhawarkua Square",
        "status": "Available",
        "current_alert_id": None
    }
]

def create_alert_if_high(location, source="", destination="", confidence=0.91, vehicle_count=126, duration="20–30 min"):
    """
    Consumes ML HIGH congestion output and creates/updates a TrafficPoliceAlert
    with duplication protection.
    """
    try:
        now = timezone.now()
        fifteen_min_ago = now - timedelta(minutes=15)

        # Check for existing active alert for this location in last 15 minutes
        existing_alert = TrafficPoliceAlert.objects.filter(
            location__icontains=location.split()[0],
            detected_at__gte=fifteen_min_ago,
            status__in=["ALERT SENT", "ACKNOWLEDGED", "OFFICER DISPATCHED"]
        ).first()

        if existing_alert:
            existing_alert.vehicle_count = vehicle_count
            existing_alert.confidence = max(existing_alert.confidence, confidence)
            existing_alert.save()
            return existing_alert

        # Create new unique alert ID
        rand_num = random.randint(1000, 9999)
        alert_id = f"TR-{rand_num}"

        action_msg = f"Deploy traffic personnel at {location} and consider diverting vehicles toward alternate arterial routes."

        alert = TrafficPoliceAlert.objects.create(
            alert_id=alert_id,
            location=location,
            source=source,
            destination=destination,
            traffic_level="HIGH",
            confidence=confidence,
            vehicle_count=vehicle_count,
            historical_baseline=max(60, vehicle_count - random.randint(20, 45)),
            recent_traffic=max(70, vehicle_count - random.randint(5, 15)),
            expected_duration=duration,
            status="ALERT SENT",
            recommended_action=action_msg
        )
        return alert
    except Exception as e:
        print(f"[TrafficPoliceAlert Exception] Failed to create alert: {e}")
        return None


class TrafficPoliceAlertsView(APIView):
    """
    GET: Fetch active traffic police alerts.
    """
    def get(self, request):
        try:
            alerts = TrafficPoliceAlert.objects.all()
            return Response({"alerts": [a.to_dict() for a in alerts]})
        except Exception as e:
            return Response({"alerts": [], "error": str(e)})


class TrafficPoliceUpdateAlertStatusView(APIView):
    """
    PATCH: Update alert status (ACKNOWLEDGED, OFFICER DISPATCHED, RESOLVED).
    """
    def patch(self, request, alert_id):
        new_status = request.data.get("status")
        assigned_unit = request.data.get("assigned_unit")

        if not new_status:
            return Response({"error": "Status is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            alert = TrafficPoliceAlert.objects.filter(alert_id=alert_id).first()
            if alert:
                alert.status = new_status
                if assigned_unit:
                    alert.assigned_unit = assigned_unit
                alert.save()

                if assigned_unit:
                    unit = PoliceUnit.objects.filter(unit_code=assigned_unit).first()
                    if unit:
                        unit.status = "Dispatched" if new_status != "RESOLVED" else "Available"
                        unit.current_alert_id = alert_id if new_status != "RESOLVED" else None
                        unit.save()

                return Response({"message": "Alert status updated", "alert": alert.to_dict()})
            
            # Fallback for demo in-memory data
            for d in DEFAULT_DEMO_ALERTS:
                if d["alert_id"] == alert_id:
                    d["status"] = new_status
                    if assigned_unit:
                        d["assigned_unit"] = assigned_unit
                    return Response({"message": "Demo alert status updated", "alert": d})
            
            return Response({"message": "Status updated successfully", "alert_id": alert_id, "status": new_status})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrafficPoliceUnitsView(APIView):
    """
    GET: Fetch active police units list.
    POST: Dispatch unit to alert.
    """
    def get(self, request):
        try:
            units = PoliceUnit.objects.all()
            return Response({"units": [u.to_dict() for u in units]})
        except Exception as e:
            return Response({"units": [], "error": str(e)})

    def post(self, request):
        unit_code = request.data.get("unit_code")
        alert_id = request.data.get("alert_id")
        action = request.data.get("action", "dispatch")

        if not unit_code:
            return Response({"error": "unit_code is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            unit = PoliceUnit.objects.filter(unit_code=unit_code).first()
            if unit:
                unit.status = "Dispatched" if action == "dispatch" else "Available"
                unit.current_alert_id = alert_id if action == "dispatch" else None
                unit.save()

                if alert_id:
                    alert = TrafficPoliceAlert.objects.filter(alert_id=alert_id).first()
                    if alert and action == "dispatch":
                        alert.status = "OFFICER DISPATCHED"
                        alert.assigned_unit = unit_code
                        alert.save()

                return Response({"message": f"Unit {unit_code} updated", "unit": unit.to_dict()})

            # Demo fallback
            for u in DEFAULT_DEMO_UNITS:
                if u["unit_code"] == unit_code:
                    u["status"] = "Dispatched" if action == "dispatch" else "Available"
                    u["current_alert_id"] = alert_id if action == "dispatch" else None
                    return Response({"message": f"Demo unit {unit_code} updated", "unit": u})

            return Response({"message": f"Unit {unit_code} status updated"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
