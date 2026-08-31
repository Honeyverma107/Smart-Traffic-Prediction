import os
import logging
import time
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# COCO Class mappings for vehicle detection
# COCO class IDs: 2: car, 3: motorcycle, 5: bus, 7: truck
CLASS_MAP = {
    2: "car_count",
    3: "bike_count",      # motorcycle -> bike_count
    5: "bus_count",
    7: "truck_count"
}

TARGET_CLASSES = list(CLASS_MAP.keys())

_YOLO_MODEL = None
_CACHED_COUNTS = {}


def get_yolo_model(model_name: str = "yolov8n.pt"):
    global _YOLO_MODEL
    if _YOLO_MODEL is None:
        _YOLO_MODEL = YOLO(model_name)
    return _YOLO_MODEL


def detect_vehicles(video_path: str = "traffic_video.mp4", model_name: str = "yolov8n.pt") -> dict:
    """
    Processes a recorded traffic video using YOLOv8 object detection/tracking.
    Caches results per (video_path, mtime) so unchanged videos are not re-processed on every request.

    Returns:
        dict: {
            "car_count": int,
            "bike_count": int,
            "bus_count": int,
            "truck_count": int
        }
    """
    counts = {
        "car_count": 0,
        "bike_count": 0,
        "bus_count": 0,
        "truck_count": 0
    }

    if not os.path.exists(video_path):
        logger.warning(f"Video file '{video_path}' not found. Returning zero counts.")
        print(f"[YOLO Vision Warning] Video file '{video_path}' not found at path: {os.path.abspath(video_path)}")
        return counts

    abs_path = os.path.abspath(video_path)
    mtime = os.path.getmtime(abs_path)
    cache_key = (abs_path, mtime)

    if cache_key in _CACHED_COUNTS:
        cached_result = dict(_CACHED_COUNTS[cache_key])
        print(f"[YOLO Vision Cache] Reusing cached vehicle counts for '{video_path}': {cached_result}")
        print(f"CAR COUNT: {cached_result['car_count']}")
        print(f"BIKE COUNT: {cached_result['bike_count']}")
        print(f"BUS COUNT: {cached_result['bus_count']}")
        print(f"TRUCK COUNT: {cached_result['truck_count']}")
        return cached_result

    try:
        model = get_yolo_model(model_name)

        seen_track_ids = {
            "car_count": set(),
            "bike_count": set(),
            "bus_count": set(),
            "truck_count": set()
        }

        max_frame_counts = {
            "car_count": 0,
            "bike_count": 0,
            "bus_count": 0,
            "truck_count": 0
        }

        results = model.predict(
            source=video_path,
            classes=TARGET_CLASSES,
            stream=True,
            verbose=False
        )

        for result in results:
            if result.boxes is None or len(result.boxes) == 0:
                continue

            current_frame_counts = {
                "car_count": 0,
                "bike_count": 0,
                "bus_count": 0,
                "truck_count": 0
            }

            boxes = result.boxes
            cls_ids = boxes.cls.cpu().numpy() if boxes.cls is not None else []
            track_ids = boxes.id.cpu().numpy() if (hasattr(boxes, 'id') and boxes.id is not None) else None

            for i, cls_id in enumerate(cls_ids):
                cls_id_int = int(cls_id)
                count_key = CLASS_MAP.get(cls_id_int)
                if not count_key:
                    continue

                current_frame_counts[count_key] += 1

                if track_ids is not None and i < len(track_ids):
                    track_id = int(track_ids[i])
                    seen_track_ids[count_key].add(track_id)

            for key in max_frame_counts:
                max_frame_counts[key] = max(max_frame_counts[key], current_frame_counts[key])

        for key in counts:
            counts[key] = max(len(seen_track_ids[key]), max_frame_counts[key])

        _CACHED_COUNTS[cache_key] = counts

        print(f"[YOLO Vision] Vehicle detection completed for '{video_path}':")
        print(f"CAR COUNT: {counts['car_count']}")
        print(f"BIKE COUNT: {counts['bike_count']}")
        print(f"BUS COUNT: {counts['bus_count']}")
        print(f"TRUCK COUNT: {counts['truck_count']}")

        return counts

    except Exception as e:
        logger.error(f"Error during vehicle detection: {e}", exc_info=True)
        print(f"[YOLO Vision Error] Detection failed: {e}")
        return counts


if __name__ == "__main__":
    test_counts = detect_vehicles("traffic_video.mp4")
    print("Test Vehicle Counts:", test_counts)
