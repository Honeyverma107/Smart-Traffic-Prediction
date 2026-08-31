import os
import sys
import pandas as pd
import numpy as np
from datetime import datetime

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from weather_and_holiday_utils import (
    get_time_period,
    get_day_type_features,
    get_festival_features
)

# Path definitions
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "data", "processed")

os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)

# Standard Column Mapping Dictionary
COLUMN_MAP = {
    'Time': 'time_str',
    'Date': 'day_of_month',
    'Date_Time': 'timestamp',
    'datetime': 'timestamp',
    'timestamp': 'timestamp',
    'CarCount': 'car_count',
    'Cars': 'car_count',
    'car_count': 'car_count',
    'BikeCount': 'bike_count',
    'Bikes': 'bike_count',
    'Motorcycles': 'bike_count',
    'bike_count': 'bike_count',
    'BusCount': 'bus_count',
    'Buses': 'bus_count',
    'bus_count': 'bus_count',
    'TruckCount': 'truck_count',
    'Trucks': 'truck_count',
    'truck_count': 'truck_count',
    'Total': 'total_vehicles',
    'Traffic Situation': 'congestion_level',
    'Traffic Status': 'congestion_level',
    'congestion_status': 'congestion_level',
    'congestion_level': 'congestion_level',
    'Speed_Kmh': 'speed_kmh',
    'avg_speed': 'speed_kmh',
    'Delay_Min': 'delay_min',
    'Delay': 'delay_min',
    'delay_seconds': 'delay_seconds',
    'Day of the week': 'day_name',
    'day_of_week': 'day_name',
    'Road ID': 'road_id',
    'road_id': 'road_id',
    'Road_ID': 'road_id',
    'Intersection_ID': 'road_name',
    'road_name': 'road_name'
}

def standardize_dataset(df: pd.DataFrame, source_name: str, is_indore_native: bool = False) -> pd.DataFrame:
    """
    Standardizes dataset schema, performs explicit label normalization, derives spatio-temporal & festival features,
    and assigns sample weights based on data provenance.
    """
    df = df.rename(columns=COLUMN_MAP)

    # Road Identification
    if 'road_name' not in df.columns:
        if 'road_id' in df.columns:
            df['road_name'] = df['road_id'].astype(str)
        else:
            df['road_name'] = 'AB Road Vijay Nagar' if is_indore_native else 'Generic Baseline Corridor'
    else:
        df['road_name'] = df['road_name'].fillna('AB Road Vijay Nagar' if is_indore_native else 'Generic Baseline Corridor').astype(str)

    if 'road_id' not in df.columns:
        df['road_id'] = df['road_name'].apply(lambda x: f"IND_{str(x).upper().replace(' ', '_')}")

    # Vehicle counts
    for col in ['car_count', 'bike_count', 'bus_count', 'truck_count']:
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

    if 'total_vehicles' not in df.columns or df['total_vehicles'].isnull().all():
        df['total_vehicles'] = df['car_count'] + df['bike_count'] + df['bus_count'] + df['truck_count']
    else:
        df['total_vehicles'] = pd.to_numeric(df['total_vehicles'], errors='coerce').fillna(
            df['car_count'] + df['bike_count'] + df['bus_count'] + df['truck_count']
        ).astype(int)

    # Speed and Delay Targets (Genuine observations preserved)
    if 'delay_min' not in df.columns and 'delay_seconds' in df.columns:
        df['delay_min'] = pd.to_numeric(df['delay_seconds'], errors='coerce').fillna(np.nan) / 60.0
    elif 'delay_min' in df.columns:
        df['delay_min'] = pd.to_numeric(df['delay_min'], errors='coerce')
    else:
        df['delay_min'] = np.nan

    if 'speed_kmh' in df.columns:
        df['speed_kmh'] = pd.to_numeric(df['speed_kmh'], errors='coerce')
    else:
        df['speed_kmh'] = np.nan

    # EXPLICIT Congestion Level Normalization Table:
    # FREE, LIGHT, smooth, low -> low
    # MODERATE, normal, moderate, medium -> medium
    # HEAVY, heavy, high -> high
    if 'congestion_level' in df.columns:
        df['congestion_level'] = df['congestion_level'].astype(str).str.lower().str.strip().replace({
            'free': 'low',
            'smooth': 'low',
            'light': 'low',
            'normal': 'medium',
            'moderate': 'medium',
            'medium': 'medium',
            'heavy': 'high',
            'high': 'high'
        })
    else:
        df['congestion_level'] = 'medium'

    # Build or parse timestamp
    if 'timestamp' in df.columns:
        df['dt'] = pd.to_datetime(df['timestamp'], errors='coerce')
    elif 'time_str' in df.columns and 'day_of_month' in df.columns:
        current_year = datetime.now().year
        month_val = 6
        df['dt'] = df.apply(
            lambda r: pd.to_datetime(
                f"{current_year}-{month_val:02d}-{int(r['day_of_month']):02d} {r['time_str']}",
                format="%Y-%m-%d %I:%M:%S %p",
                errors='coerce'
            ),
            axis=1
        )
    else:
        df['dt'] = pd.Timestamp.now()

    df['dt'] = df['dt'].fillna(pd.Timestamp.now())

    # Temporal Feature Extraction
    df['hour'] = df['dt'].dt.hour
    df['day'] = df['dt'].dt.day
    df['month'] = df['dt'].dt.month
    df['day_name'] = df['dt'].dt.day_name()
    df['time_period'] = df['hour'].apply(get_time_period)

    # Day Type and MP Festival Features
    day_types = df['dt'].apply(get_day_type_features)
    df['is_weekend'] = day_types.apply(lambda d: d['is_weekend'])
    df['is_weekday'] = day_types.apply(lambda d: d['is_weekday'])
    df['is_holiday'] = day_types.apply(lambda d: d['is_holiday'])

    fest_features = df['dt'].apply(get_festival_features)
    df['is_festival'] = fest_features.apply(lambda f: f['is_festival'])
    df['festival_name'] = fest_features.apply(lambda f: f['festival_name'])
    df['festival_type'] = fest_features.apply(lambda f: f['festival_type'])
    df['festival_intensity'] = fest_features.apply(lambda f: f['festival_intensity'])

    # Explicitly report weather as UNAVAILABLE (Guardrail rule)
    df['weather_status'] = 'UNAVAILABLE'

    # Provenance tracking & source-weight assignment:
    # Genuine Indore records receive source_weight = 3.0
    # Generic baseline survey records receive source_weight = 0.15
    df['data_source'] = source_name
    df['is_indore_native'] = is_indore_native
    df['source_weight'] = 3.0 if is_indore_native else 0.15

    # Recency weight decay
    ref_date = datetime.now()
    df['age_days'] = df['dt'].apply(lambda d: max(0, (ref_date - d).days if isinstance(d, pd.Timestamp) else 365))
    df['recency_weight'] = np.exp(-0.001 * df['age_days']).clip(0.25, 1.0)

    # Combined sample weight for model training
    df['sample_weight'] = df['source_weight'] * df['recency_weight']

    # Clean extreme outlier count anomalies
    for col in ['car_count', 'bike_count', 'bus_count', 'truck_count']:
        df[col] = df[col].apply(lambda x: max(0, min(x, 500)))

    # Drop duplicate records
    df = df.drop_duplicates(subset=['dt', 'road_name', 'car_count', 'bike_count', 'bus_count', 'truck_count'])

    return df

def merge_all_traffic_datasets() -> pd.DataFrame:
    """
    Merges all genuine Indore datasets and generic baseline survey dataset into a unified, provenance-tracked training dataframe.
    """
    all_dfs = []

    # 1. Indore Vijay Nagar Mendeley dataset (indore_vijay_nagar_mendeley.csv) - Genuine Indore
    mendeley_csv = os.path.join(RAW_DATA_DIR, "indore_vijay_nagar_mendeley.csv")
    if os.path.exists(mendeley_csv):
        print(f"[Data Pipeline] Loading Indore Vijay Nagar Mendeley dataset: {mendeley_csv}")
        df_mendeley = pd.read_csv(mendeley_csv)
        all_dfs.append(standardize_dataset(df_mendeley, source_name="indore_vijay_nagar_mendeley_dataset", is_indore_native=True))

    # 2. Historical Indore survey dataset (indore_traffic_historical.csv) - Genuine Indore
    hist_csv = os.path.join(RAW_DATA_DIR, "indore_traffic_historical.csv")
    if os.path.exists(hist_csv):
        print(f"[Data Pipeline] Loading historical Indore dataset: {hist_csv}")
        df_hist = pd.read_csv(hist_csv)
        all_dfs.append(standardize_dataset(df_hist, source_name="indore_historical_2022_2024", is_indore_native=True))

    # 3. Recent Indore ITMS telemetry (indore_traffic_recent.csv) - Genuine Indore
    recent_csv = os.path.join(RAW_DATA_DIR, "indore_traffic_recent.csv")
    if os.path.exists(recent_csv):
        print(f"[Data Pipeline] Loading recent Indore ITMS telemetry: {recent_csv}")
        df_recent = pd.read_csv(recent_csv)
        all_dfs.append(standardize_dataset(df_recent, source_name="indore_recent_2025_2026", is_indore_native=True))

    # 4. Baseline generic survey dataset (traffic.csv) - Generic Baseline Survey
    raw_csv = os.path.join(RAW_DATA_DIR, "traffic.csv")
    if os.path.exists(raw_csv):
        print(f"[Data Pipeline] Loading generic baseline survey dataset: {raw_csv}")
        df_base = pd.read_csv(raw_csv)
        all_dfs.append(standardize_dataset(df_base, source_name="indore_baseline_survey", is_indore_native=False))

    if not all_dfs:
        raise FileNotFoundError("No traffic datasets found in raw data directory.")

    merged_df = pd.concat(all_dfs, ignore_index=True)

    # Export merged datasets
    merged_output_path = os.path.join(PROCESSED_DATA_DIR, "merged_traffic.csv")
    processed_output_path = os.path.join(PROCESSED_DATA_DIR, "processed_traffic.csv")

    merged_df.to_csv(merged_output_path, index=False)
    merged_df.to_csv(processed_output_path, index=False)

    print(f"\n[Data Pipeline SUCCESS] Merged {len(merged_df)} total records from {len(all_dfs)} datasets.")
    print(f" - Genuine Indore Native Records: {len(merged_df[merged_df['is_indore_native']])}")
    print(f" - Generic Baseline Survey Records: {len(merged_df[~merged_df['is_indore_native']])}")
    print(f"[Data Pipeline] Exported to:\n - {merged_output_path}\n - {processed_output_path}")

    return merged_df

if __name__ == "__main__":
    merge_all_traffic_datasets()
