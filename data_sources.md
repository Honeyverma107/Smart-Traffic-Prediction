# Data Sources Verification & Provenance Document — Smart Traffic Indore

This document provides a complete, audited inventory of all traffic datasets utilized by the **Smart Traffic Management System** for Indore, Madhya Pradesh.

---

## 1. Dataset Reality & Sourcing Audit

> [!IMPORTANT]  
> **DATA PROVENANCE & REALITY STATEMENT**:  
> - **Benchmark Dataset (`traffic.csv`)**: Public Open Research Benchmark dataset (5,952 observations) used for ML baseline classification.
> - **Historical Indore Sample (`indore_traffic_historical.csv`)**: **Synthetic Sample File** created for demonstrating multi-source dataset ingestion (10 records).
> - **Recent Indore Telemetry Sample (`indore_traffic_recent.csv`)**: **Synthetic Sample File** created for demonstrating live continuous telemetry ingestion (7 records).
> - **Video Camera Feed (`traffic_video.mp4`)**: Demonstration video stream analyzed via YOLOv8 object tracking for vehicle detection simulation.

---

## 2. Dataset Inventory Details

| Dataset File | Record Count | Real vs. Synthetic Label | Source / Provenance | Usage in Project |
| :--- | :--- | :--- | :--- | :--- |
| `traffic.csv` | 5,952 | Public Benchmark Data | Kaggle Traffic Prediction Dataset | Baseline model training |
| `indore_traffic_historical.csv` | 10 | **Synthetic Sample** | Simulated Indore Survey (2022–2024) | Pipeline testing & time-decay weighting |
| `indore_traffic_recent.csv` | 7 | **Synthetic Sample** | Simulated ITMS Telemetry (2025–2026) | Pipeline testing & recency weighting |
| `traffic_video.mp4` | Video Stream | Demonstration Stream | Local Video Asset | Real-time YOLOv8 vehicle detection |

---

## 3. Data Processing & Recency Weighting Pipeline

The processing pipeline `traffic_model/data_processing/merge_traffic_data.py`:
1. Standardizes column schemas (`date_time`, `car_count`, `bike_count`, `bus_count`, `truck_count`, `speed_kmh`, `delay_min`, `congestion_level`).
2. Calculates an exponential time-decay sample weight:
   $$w = \exp(-0.001 \times \text{age\_in\_days}) \quad \text{clipped to } [0.25, 1.0]$$
3. Exports merged records to `traffic_model/data/processed/merged_traffic.csv` (5,969 total rows).
