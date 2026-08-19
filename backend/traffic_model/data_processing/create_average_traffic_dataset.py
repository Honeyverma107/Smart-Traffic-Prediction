import os
import sys
import pandas as pd
import numpy as np

# Path definitions
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DATA_DIR = os.path.join(BASE_DIR, "data", "processed")

os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)

# Standard Column Mapping
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
    'Traffic Situation': 'traffic_situation',
    'congestion_level': 'traffic_situation',
    'Day of the week': 'day_name',
    'day_name': 'day_name'
}

def load_and_standardize_raw_datasets():
    """
    STEP 1 & 2: Load raw datasets and standardize columns while tagging source provenance.
    """
    datasets = []
    
    # 1. Baseline Benchmark Dataset
    traffic_csv = os.path.join(RAW_DATA_DIR, "traffic.csv")
    if os.path.exists(traffic_csv):
        df_base = pd.read_csv(traffic_csv).rename(columns=COLUMN_MAP)
        df_base['source_tag'] = 'historical_benchmark_traffic_csv'
        df_base['is_synthetic'] = False
        datasets.append(df_base)
        
    # 2. Historical Indore Dataset (Synthetic Sample)
    hist_csv = os.path.join(RAW_DATA_DIR, "indore_traffic_historical.csv")
    if os.path.exists(hist_csv):
        df_hist = pd.read_csv(hist_csv).rename(columns=COLUMN_MAP)
        df_hist['source_tag'] = 'indore_historical_2022_2024'
        df_hist['is_synthetic'] = True
        datasets.append(df_hist)
        
    # 3. Recent Indore Dataset (Synthetic Sample)
    recent_csv = os.path.join(RAW_DATA_DIR, "indore_traffic_recent.csv")
    if os.path.exists(recent_csv):
        df_recent = pd.read_csv(recent_csv).rename(columns=COLUMN_MAP)
        df_recent['source_tag'] = 'indore_recent_2025_2026'
        df_recent['is_synthetic'] = True
        datasets.append(df_recent)

    if not datasets:
        raise FileNotFoundError("No raw traffic datasets found.")
        
    # Standardize individual datasets
    standardized_list = []
    for df in datasets:
        # Standardize Vehicle Counts
        for col in ['car_count', 'bike_count', 'bus_count', 'truck_count']:
            if col not in df.columns:
                df[col] = 0
            else:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)
                
        # Extract Hour
        if 'hour' not in df.columns:
            if 'time_str' in df.columns:
                df['hour'] = pd.to_datetime(df['time_str'], format="%I:%M:%S %p", errors='coerce').dt.hour
            elif 'timestamp' in df.columns:
                df['hour'] = pd.to_datetime(df['timestamp'], errors='coerce').dt.hour
            else:
                df['hour'] = 12
        df['hour'] = df['hour'].fillna(12).astype(int)
        
        # Day of Month
        if 'day_of_month' not in df.columns:
            if 'timestamp' in df.columns:
                df['day_of_month'] = pd.to_datetime(df['timestamp'], errors='coerce').dt.day
            else:
                df['day_of_month'] = 10
        df['day_of_month'] = df['day_of_month'].fillna(10).astype(int)
        
        # Day of week name
        if 'day_name' not in df.columns:
            if 'timestamp' in df.columns:
                df['day_name'] = pd.to_datetime(df['timestamp'], errors='coerce').dt.day_name()
            else:
                df['day_name'] = 'Monday'
        df['day_name'] = df['day_name'].fillna('Monday')
        
        standardized_list.append(df)
        
    all_raw = pd.concat(standardized_list, ignore_index=True)
    return all_raw

def create_average_traffic_dataset():
    """
    STEPS 3, 4, 5 & 6: Group records by time pattern (Hour, Day of week, Day),
    calculate balanced representative average traffic counts, determine target Traffic Situation,
    and save to backend/traffic_model/data/processed/average_traffic_dataset.csv.
    """
    raw_df = load_and_standardize_raw_datasets()
    
    print("\n--- STEP 1 & 2: RAW DATASET LOADING & STANDARDIZATION ---")
    print(f"Total Combined Raw Records Loaded: {len(raw_df)}")
    print("Source Breakdown:")
    for src, grp in raw_df.groupby('source_tag'):
        is_syn = grp['is_synthetic'].iloc[0]
        print(f" - {src:32s}: {len(grp):5d} records (Synthetic: {is_syn})")

    # Grouping Keys: Hour, Day of month, Day of week
    group_keys = ['hour', 'day_of_month', 'day_name']
    
    # STEP 3 & 4: Representative Averaging
    print("\n--- STEP 3 & 4: HISTORICAL + RECENT BALANCED AVERAGING ---")
    
    # Separate historical vs recent sources
    historical_mask = raw_df['source_tag'] != 'indore_recent_2025_2026'
    recent_mask = raw_df['source_tag'] == 'indore_recent_2025_2026'
    
    df_hist = raw_df[historical_mask]
    df_recent = raw_df[recent_mask]
    
    # Group historical
    hist_grouped = df_hist.groupby(group_keys)[['car_count', 'bike_count', 'bus_count', 'truck_count']].mean().reset_index()
    
    # Group recent
    recent_grouped = df_recent.groupby(group_keys)[['car_count', 'bike_count', 'bus_count', 'truck_count']].mean().reset_index()
    
    # Merge grouped time patterns
    merged_pattern = pd.merge(
        hist_grouped,
        recent_grouped,
        on=group_keys,
        how='left',
        suffixes=('_hist', '_recent')
    )
    
    # Calculate Representative Balanced Counts (60% Recent weight, 40% Historical weight when recent exists)
    alpha = 0.6 # Weight given to recent observation when present
    
    rep_rows = []
    for _, row in merged_pattern.iterrows():
        h_cars, r_cars = row['car_count_hist'], row['car_count_recent']
        h_bikes, r_bikes = row['bike_count_hist'], row['bike_count_recent']
        h_buses, r_buses = row['bus_count_hist'], row['bus_count_recent']
        h_trucks, r_trucks = row['truck_count_hist'], row['truck_count_recent']
        
        has_recent = not np.isnan(r_cars)
        
        if has_recent:
            cars = int(round(alpha * r_cars + (1 - alpha) * h_cars))
            bikes = int(round(alpha * r_bikes + (1 - alpha) * h_bikes))
            buses = int(round(alpha * r_buses + (1 - alpha) * h_buses))
            trucks = int(round(alpha * r_trucks + (1 - alpha) * h_trucks))
            provenance = "balanced_historical_and_recent"
        else:
            cars = int(round(h_cars))
            bikes = int(round(h_bikes))
            buses = int(round(h_buses))
            trucks = int(round(h_trucks))
            provenance = "historical_baseline_average"
            
        total = cars + bikes + buses + trucks
        
        # Target 'Traffic Situation' determination without target leakage
        # Thresholds: total < 100 -> low, total >= 100 -> medium
        if total < 100:
            traffic_sit = "low"
        else:
            traffic_sit = "medium"
            
        rep_rows.append({
            "Hour": int(row['hour']),
            "Day": int(row['day_of_month']),
            "Day of week": str(row['day_name']),
            "CarCount": cars,
            "BikeCount": bikes,
            "BusCount": buses,
            "TruckCount": trucks,
            "TotalCount": total,
            "Traffic Situation": traffic_sit,
            "source_provenance": provenance
        })
        
    avg_df = pd.DataFrame(rep_rows)
    
    # Sort cleanly by Day, Hour
    avg_df = avg_df.sort_values(by=['Day', 'Hour']).reset_index(drop=True)
    
    # STEP 6: Save Average Traffic Dataset
    output_path = os.path.join(PROCESSED_DATA_DIR, "average_traffic_dataset.csv")
    avg_df.to_csv(output_path, index=False)
    
    print(f"\n[SUCCESS] Generated Representative Average Traffic Dataset!")
    print(f" - Saved to: {output_path}")
    print(f" - Total Representative Time-Pattern Records: {len(avg_df)}")
    print("\nRepresentative Traffic Situation Target Distribution:")
    print(avg_df['Traffic Situation'].value_counts())
    
    print("\nSample Representative Averaged Records:")
    print(avg_df[['Hour', 'Day', 'Day of week', 'CarCount', 'BikeCount', 'BusCount', 'TruckCount', 'Traffic Situation', 'source_provenance']].head(5))
    
    return avg_df

if __name__ == "__main__":
    create_average_traffic_dataset()
