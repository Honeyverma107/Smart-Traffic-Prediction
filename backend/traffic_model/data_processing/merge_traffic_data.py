import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

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
    'congestion_level': 'congestion_level',
    'Speed_Kmh': 'speed_kmh',
    'Delay_Min': 'delay_min',
    'Day of the week': 'day_name'
}

def standardize_dataset(df: pd.DataFrame, source_name: str) -> pd.DataFrame:
    """
    Standardizes column names, types, missing values, and extracts temporal features.
    """
    df = df.rename(columns=COLUMN_MAP)
    
    # Ensure standard vehicle count columns exist
    for col in ['car_count', 'bike_count', 'bus_count', 'truck_count']:
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
    
    # Calculate Total Vehicles if missing
    if 'total_vehicles' not in df.columns or df['total_vehicles'].isnull().all():
        df['total_vehicles'] = df['car_count'] + df['bike_count'] + df['bus_count'] + df['truck_count']
    else:
        df['total_vehicles'] = pd.to_numeric(df['total_vehicles'], errors='coerce').fillna(
            df['car_count'] + df['bike_count'] + df['bus_count'] + df['truck_count']
        ).astype(int)
        
    # Standardize Congestion Level labels
    if 'congestion_level' in df.columns:
        df['congestion_level'] = df['congestion_level'].astype(str).str.lower().replace({
            'normal': 'medium',
            'moderate': 'medium',
            'heavy': 'high',
            'smooth': 'low',
            'light': 'low'
        })
    else:
        df['congestion_level'] = 'medium'

    # Build or parse timestamp
    if 'timestamp' in df.columns:
        df['dt'] = pd.to_datetime(df['timestamp'], errors='coerce')
    elif 'time_str' in df.columns and 'day_of_month' in df.columns:
        # Reconstruct timestamp assuming current/historical reference year
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

    # Drop invalid datetimes
    df['dt'] = df['dt'].fillna(pd.Timestamp.now())

    # Feature Extraction
    df['hour'] = df['dt'].dt.hour
    df['day'] = df['dt'].dt.day
    df['month'] = df['dt'].dt.month
    df['day_name'] = df['dt'].dt.day_name()
    df['is_weekend'] = df['dt'].dt.dayofweek.apply(lambda d: 1 if d >= 5 else 0)
    df['is_peak_hour'] = df['hour'].apply(lambda h: 1 if (8 <= h <= 10 or 17 <= h <= 20) else 0)
    
    # Assign source provenance tag
    df['data_source'] = source_name
    
    # Calculate Recency Age in days and time-decay sample weight
    ref_date = datetime.now()
    df['age_days'] = df['dt'].apply(lambda d: max(0, (ref_date - d).days if isinstance(d, pd.Timestamp) else 365))
    
    # Recency weight decay: w = exp(-0.001 * age_days), bounded in [0.25, 1.0]
    # Recent data (age_days <= 30) receives weight near 1.0; 2-year old data receives ~0.48
    df['recency_weight'] = np.exp(-0.001 * df['age_days']).clip(0.25, 1.0)
    
    # Clean outlier counts (negative or unrealistically high)
    for col in ['car_count', 'bike_count', 'bus_count', 'truck_count']:
        df[col] = df[col].apply(lambda x: max(0, min(x, 500)))

    # Drop duplicate records
    df = df.drop_duplicates(subset=['dt', 'car_count', 'bike_count', 'bus_count', 'truck_count'])
    
    return df

def merge_all_traffic_datasets() -> pd.DataFrame:
    """
    Scans RAW_DATA_DIR for historical and recent traffic datasets, standardizes,
    and merges them into a single recency-weighted dataset for ML training.
    """
    all_dfs = []
    
    # Check existing traffic.csv
    raw_csv = os.path.join(RAW_DATA_DIR, "traffic.csv")
    if os.path.exists(raw_csv):
        print(f"[Data Pipeline] Loading raw baseline dataset: {raw_csv}")
        df_base = pd.read_csv(raw_csv)
        df_base_std = standardize_dataset(df_base, source_name="indore_baseline_survey")
        all_dfs.append(df_base_std)
        
    # Check historical files
    hist_csv = os.path.join(RAW_DATA_DIR, "indore_traffic_historical.csv")
    if os.path.exists(hist_csv):
        print(f"[Data Pipeline] Loading historical dataset: {hist_csv}")
        df_hist = pd.read_csv(hist_csv)
        df_hist_std = standardize_dataset(df_hist, source_name="indore_historical_2022_2024")
        all_dfs.append(df_hist_std)
        
    # Check recent files
    recent_csv = os.path.join(RAW_DATA_DIR, "indore_traffic_recent.csv")
    if os.path.exists(recent_csv):
        print(f"[Data Pipeline] Loading recent traffic dataset: {recent_csv}")
        df_recent = pd.read_csv(recent_csv)
        df_recent_std = standardize_dataset(df_recent, source_name="indore_recent_2025_2026")
        all_dfs.append(df_recent_std)

    if not all_dfs:
        raise FileNotFoundError("No traffic datasets found in raw data directory.")
        
    merged_df = pd.concat(all_dfs, ignore_index=True)
    
    # Export merged datasets
    merged_output_path = os.path.join(PROCESSED_DATA_DIR, "merged_traffic.csv")
    processed_output_path = os.path.join(PROCESSED_DATA_DIR, "processed_traffic.csv")
    
    merged_df.to_csv(merged_output_path, index=False)
    merged_df.to_csv(processed_output_path, index=False)
    
    print(f"\n[Data Pipeline SUCCESS] Merged {len(merged_df)} total records from {len(all_dfs)} datasets.")
    print(f"[Data Pipeline] Exported to:\n - {merged_output_path}\n - {processed_output_path}")
    print("\nDataset Summary by Provenance:")
    print(merged_df.groupby("data_source")["recency_weight"].describe())
    
    return merged_df

if __name__ == "__main__":
    merge_all_traffic_datasets()
