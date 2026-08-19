# Indore Smart Traffic Management & Dynamic Signal Intelligence System

A commercial-grade, AI-powered smart navigation, traffic forecasting, and camera-integrated signal timing application for **Indore, Madhya Pradesh**.

---

## Key System Features

### 1. Multi-Source Traffic Data Processing & ML Pipeline
- **Dataset Integration**: Standardizes and merges historical traffic survey records (2022–2024) and recent telemetry feeds (2025–2026).
- **Automated Standardization**: Maps column variations across datasets (`date_time`, `vehicle_count`, `car_count`, `bike_count`, `bus_count`, `truck_count`, `speed`, `delay`, `congestion_level`).
- **Recency Sample Weighting**: Employs an exponential time-decay weight decay ($w = \exp(-0.001 \times \text{age\_in\_days})$) during Random Forest training so recent traffic patterns strongly influence predictions without ignoring multi-year historical baselines.
- **Pipeline Script**: `traffic_model/data_processing/merge_traffic_data.py`
- **ML Training Script**: `traffic_model/training/train_congestion.py`

### 2. Intelligent Dynamic Traffic Signal Timing
- **Intersection Optimization**: Evaluates directional vehicle counts across North, South, East, and West directions for Indore intersections (e.g. Vijay Nagar Square, Palasia Square, Ring Road Bypass).
- **YOLOv8 Vehicle Detection**: Integrates with Ultralytics YOLO (`yolov8n.pt`) frame analysis for vehicle detection (Cars, Motorcycles/Bikes, Buses, Trucks, Auto-rickshaws).
- **PCE & Priority Calculation**: Computes Passenger Car Equivalents (PCE), traffic density, and a priority score for each direction:
  $$\text{Priority Score} = 0.5 \cdot \text{PCE} + 0.3 \cdot \left(\frac{\text{Waiting Time}}{10}\right) + 0.2 \cdot (\text{Density} \times 10)$$
- **Fairness & Safety Bounds**: Dynamically allocates green time proportional to priority score while enforcing strict safety bounds:
  - `minimum_green_time` = 15s (prevents starvation)
  - `maximum_green_time` = 65s
  - `yellow_time` = 3s
  - `all_red_time` = 2s
- **Interactive UI Panel**: Visual breakdown in React dashboard under the **Live Traffic Signal Status** tab.

---

## API Endpoints Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/routes/` | `POST` | Calculate smart route alternatives, travel time, and ML congestion prediction |
| `/api/signal-timing/` | `POST` / `GET` | Dynamic green-light timing allocation per direction based on vehicle density |
| `/api/traffic/current/` | `GET` | Live camera counts, dataset provenance, and ML pipeline status |
| `/api/send-otp/` | `POST` | Dispatch 6-digit OTP verification code via email |
| `/api/verify-otp/` | `POST` | Verify OTP code and issue JWT tokens |
| `/api/google-login/` | `POST` | Authenticate user with Google OAuth 2.0 ID Token |
| `/api/predict-congestion/` | `POST` | Raw ML Random Forest congestion classification |

---

## Project Execution Guide

### 1. Data Pipeline & ML Retraining
```bash
# Navigate to backend and activate virtualenv
cd backend
venv\Scripts\activate

# Run data processing & model training
python traffic_model/training/train_congestion.py
```

### 2. Start Django Backend Server
```bash
cd backend
venv\Scripts\activate
python manage.py runserver
```

### 3. Start React Frontend
```bash
cd frontend
npm start
```
App will launch at `http://localhost:3000`.

---

## Documentation References
- [`data_sources.md`](./data_sources.md): Complete data provenance inventory for Indore historical, recent, and camera datasets.
