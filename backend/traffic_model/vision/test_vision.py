import os
import sys
import cv2
import numpy as np

# Add parent directories to sys.path
current_dir = os.path.dirname(__file__)
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from traffic_model.vision.detect_vehicles import detect_vehicles


def create_sample_video(output_path="traffic_video.mp4", duration_sec=3, fps=10):
    """
    Creates a simple sample video file for testing vehicle detection if no video is present.
    """
    height, width = 480, 640
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    num_frames = duration_sec * fps
    for i in range(num_frames):
        # Create dark background
        frame = np.zeros((height, width, 3), dtype=np.uint8) + 40
        # Draw road
        cv2.rectangle(frame, (100, 0), (540, 480), (80, 80, 80), -1)
        # Draw lane divider
        for y in range(0, 480, 40):
            cv2.line(frame, (320, y), (320, y + 20), (255, 255, 255), 2)
        out.write(frame)

    out.release()
    print(f"Sample test video created at '{output_path}'")


def run_test():
    video_path = os.path.join(backend_dir, "traffic_video.mp4")

    if not os.path.exists(video_path):
        print(f"No existing '{video_path}' found. Generating a sample test video...")
        create_sample_video(video_path, duration_sec=2, fps=10)

    print(f"Testing detect_vehicles on '{video_path}'...")
    results = detect_vehicles(video_path)
    print("\n========== YOLO DETECTION RESULT ==========")
    print(results)
    print("===========================================")
    return results


if __name__ == "__main__":
    run_test()
