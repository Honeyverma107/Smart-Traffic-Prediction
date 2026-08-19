import os
import sys

# Set up Django environment if needed or test modules directly
current_dir = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from traffic_model.vision.detect_vehicles import detect_vehicles
from traffic_model.prediction.predict import predict_congestion


def test_full_pipeline():
    print("\n==================================================")
    print("STEP 1: Running YOLO Vehicle Detection")
    print("==================================================")

    video_path = os.path.join(backend_dir, "traffic_video.mp4")

    # Call YOLO module
    counts = detect_vehicles(video_path)

    print("\nVehicle counts obtained from YOLO:")
    print(counts)

    car_count = counts.get("car_count", 0)
    bike_count = counts.get("bike_count", 0)
    bus_count = counts.get("bus_count", 0)
    truck_count = counts.get("truck_count", 0)

    print("\n==================================================")
    print("STEP 2: Calling Existing predict_congestion()")
    print("==================================================")

    predicted_congestion = predict_congestion(
        time="08:30:00 AM",
        day=11,
        day_of_week="Tuesday",
        car_count=car_count,
        bike_count=bike_count,
        bus_count=bus_count,
        truck_count=truck_count
    )

    print("\n==================================================")
    print(f"SUCCESS: Predicted Congestion = {predicted_congestion}")
    print("==================================================\n")

    return predicted_congestion


if __name__ == "__main__":
    test_full_pipeline()
