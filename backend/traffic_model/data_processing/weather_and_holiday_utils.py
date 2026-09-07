import os
import glob
import pandas as pd
import numpy as np
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
TRAFFIC_MODEL_DIR = os.path.dirname(CURRENT_DIR)
RAW_DATA_DIR = os.path.join(TRAFFIC_MODEL_DIR, "data", "raw")

# MP / Indore Official Festival & Public Holiday Reference
MP_FESTIVAL_CALENDAR = {
    "01-14": ("Makar Sankranti", "regional", 0.70),
    "01-26": ("Republic Day", "national_holiday", 0.85),
    "03-08": ("Mahashivratri", "religious", 0.75),
    "03-14": ("Holi", "national_festival", 0.90),
    "03-20": ("Rang Panchami (Indore Gair)", "local_parade", 1.00), # Major Indore local event
    "03-30": ("Gangaur", "regional_festival", 0.65),
    "04-01": ("Eid-ul-Fitr", "gazetted_holiday", 0.80),
    "08-15": ("Independence Day", "national_holiday", 0.85),
    "09-06": ("Anant Chaturdashi (Indore Jhanki)", "local_parade", 1.00), # Major Indore procession
    "10-02": ("Gandhi Jayanti / Navratri Start", "national_holiday", 0.80),
    "10-12": ("Dussehra", "national_festival", 0.90),
    "10-20": ("Diwali", "national_festival", 0.95),
    "11-01": ("Madhya Pradesh Foundation Day", "state_holiday", 0.75),
    "12-25": ("Christmas", "gazetted_holiday", 0.70),
}

_WEATHER_DF = None
_WEATHER_LOOKUP = None
_WEATHER_MONTHLY_HOURLY_AVG = None
_HOLIDAY_DATES = None
_FESTIVAL_MAP = None


def load_weather_data():
    """Loads WEATHER.csv and builds fast hourly lookup & historical fallback table."""
    global _WEATHER_DF, _WEATHER_LOOKUP, _WEATHER_MONTHLY_HOURLY_AVG
    if _WEATHER_LOOKUP is not None:
        return _WEATHER_LOOKUP, _WEATHER_MONTHLY_HOURLY_AVG

    w_path = os.path.join(RAW_DATA_DIR, "WEATHER.csv")
    if not os.path.exists(w_path):
        w_path = os.path.join(RAW_DATA_DIR, "weather.csv")

    if os.path.exists(w_path):
        try:
            df = pd.read_csv(w_path, skiprows=3)
            df["dt"] = pd.to_datetime(df["time"], errors="coerce")
            
            rename_map = {}
            for col in df.columns:
                c_lower = str(col).lower()
                if "temp" in c_lower: rename_map[col] = "temperature"
                elif "cloud" in c_lower: rename_map[col] = "cloud_cover"
                elif "code" in c_lower: rename_map[col] = "weather_code"
                elif "precip" in c_lower: rename_map[col] = "precipitation"
                elif "humid" in c_lower: rename_map[col] = "humidity"
                elif "rain" in c_lower: rename_map[col] = "rain"
                elif "wind" in c_lower: rename_map[col] = "wind_speed"
            
            df = df.rename(columns=rename_map).dropna(subset=["dt"]).sort_values("dt")
            
            # Numeric conversion
            num_cols = ["temperature", "humidity", "precipitation", "wind_speed", "cloud_cover", "weather_code"]
            for c in num_cols:
                if c in df.columns:
                    df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0.0)
                else:
                    df[c] = 0.0

            df["month"] = df["dt"].dt.month
            df["hour"] = df["dt"].dt.hour

            _WEATHER_DF = df
            _WEATHER_LOOKUP = df.set_index(df["dt"].dt.strftime("%Y-%m-%d %H:00")).to_dict(orient="index")
            _WEATHER_MONTHLY_HOURLY_AVG = df.groupby(["month", "hour"])[num_cols].mean().to_dict(orient="index")

        except Exception as e:
            print(f"[Weather Warning] Failed to load WEATHER.csv: {e}", flush=True)

    if _WEATHER_LOOKUP is None:
        _WEATHER_LOOKUP = {}
        _WEATHER_MONTHLY_HOURLY_AVG = {}

    return _WEATHER_LOOKUP, _WEATHER_MONTHLY_HOURLY_AVG


def load_holiday_data():
    """Loads HolidayCalendar CSV files (2023-2026) & consolidates holiday/festival dates."""
    global _HOLIDAY_DATES, _FESTIVAL_MAP
    if _HOLIDAY_DATES is not None:
        return _HOLIDAY_DATES, _FESTIVAL_MAP

    _HOLIDAY_DATES = set()
    _FESTIVAL_MAP = {}

    h_files = sorted(glob.glob(os.path.join(RAW_DATA_DIR, "HolidayCalendar_*.csv")))
    
    # Write/ensure consolidated holidays.csv exists for reference
    consolidated_path = os.path.join(RAW_DATA_DIR, "holidays.csv")
    h_dfs = []

    for hf in h_files:
        try:
            df = pd.read_csv(hf)
            for col in ["Start", "End"]:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col], errors="coerce")
            h_dfs.append(df)

            for _, row in df.iterrows():
                if pd.notna(row.get("Start")):
                    d_str = row["Start"].strftime("%Y-%m-%d")
                    _HOLIDAY_DATES.add(d_str)
                    subj = str(row.get("Subject", "")).lower()
                    is_fest = any(k in subj for k in [
                        "holi", "diwali", "dussehra", "eid", "raksha", "navratri",
                        "christmas", "independence", "republic", "janmashtami",
                        "ram navami", "gair", "jhanki"
                    ])
                    intensity = 0.90 if is_fest else 0.70
                    _FESTIVAL_MAP[d_str] = {
                        "is_festival": 1,
                        "name": str(row.get("Subject", "Holiday")),
                        "intensity": intensity
                    }
        except Exception as err:
            print(f"[Holiday Warning] Could not parse {hf}: {err}", flush=True)

    if h_dfs and not os.path.exists(consolidated_path):
        try:
            pd.concat(h_dfs, ignore_index=True).to_csv(consolidated_path, index=False)
        except Exception:
            pass

    return _HOLIDAY_DATES, _FESTIVAL_MAP


def get_weather_features(dt_obj: datetime) -> dict:
    """
    Returns weather features for a given datetime object.
    Looks up exact hourly telemetry in WEATHER.csv if present, else falls back to historical monthly/hourly averages.
    """
    lookup, monthly_avg = load_weather_data()
    dt_key = dt_obj.strftime("%Y-%m-%d %H:00")

    if dt_key in lookup:
        w_row = lookup[dt_key]
        return {
            "temperature": float(w_row.get("temperature", 24.0)),
            "humidity": float(w_row.get("humidity", 55.0)),
            "precipitation": float(w_row.get("precipitation", 0.0)),
            "wind_speed": float(w_row.get("wind_speed", 10.0)),
            "cloud_cover": float(w_row.get("cloud_cover", 20.0)),
            "weather_code": int(w_row.get("weather_code", 0))
        }

    # Fallback to historical monthly/hourly average for Indore
    avg_key = (dt_obj.month, dt_obj.hour)
    if avg_key in monthly_avg:
        avg_row = monthly_avg[avg_key]
        return {
            "temperature": float(avg_row.get("temperature", 25.0)),
            "humidity": float(avg_row.get("humidity", 50.0)),
            "precipitation": float(avg_row.get("precipitation", 0.0)),
            "wind_speed": float(avg_row.get("wind_speed", 12.0)),
            "cloud_cover": float(avg_row.get("cloud_cover", 25.0)),
            "weather_code": int(round(avg_row.get("weather_code", 0)))
        }

    return {
        "temperature": 25.0,
        "humidity": 50.0,
        "precipitation": 0.0,
        "wind_speed": 10.0,
        "cloud_cover": 20.0,
        "weather_code": 0
    }


def get_time_period(hour: int) -> str:
    """Categorizes hour of day into standard time periods."""
    h = int(hour) % 24
    if 5 <= h <= 10:
        return "morning"
    elif 11 <= h <= 16:
        return "afternoon"
    elif 17 <= h <= 21:
        return "evening"
    else:
        return "night"


def get_day_type_features(dt_obj: datetime) -> dict:
    """Extracts weekend, weekday, and public holiday indicators."""
    h_dates, f_map = load_holiday_data()
    dow = dt_obj.weekday()  # 0 = Monday, 6 = Sunday
    is_weekend = 1 if dow >= 5 else 0
    is_weekday = 1 if dow < 5 else 0

    d_str = dt_obj.strftime("%Y-%m-%d")
    mm_dd = dt_obj.strftime("%m-%d")
    fest_ref = MP_FESTIVAL_CALENDAR.get(mm_dd)

    is_holiday = 1 if (is_weekend or d_str in h_dates or fest_ref is not None) else 0

    return {
        "is_weekend": is_weekend,
        "is_weekday": is_weekday,
        "is_holiday": is_holiday
    }


def get_festival_features(dt_obj: datetime) -> dict:
    """Looks up festival metadata and intensity for a given datetime."""
    h_dates, f_map = load_holiday_data()
    d_str = dt_obj.strftime("%Y-%m-%d")
    mm_dd = dt_obj.strftime("%m-%d")

    if d_str in f_map:
        f_info = f_map[d_str]
        return {
            "is_festival": 1,
            "festival_name": f_info["name"],
            "festival_type": "gazetted_holiday",
            "festival_intensity": float(f_info["intensity"])
        }

    fest_ref = MP_FESTIVAL_CALENDAR.get(mm_dd)
    if fest_ref:
        return {
            "is_festival": 1,
            "festival_name": fest_ref[0],
            "festival_type": fest_ref[1],
            "festival_intensity": float(fest_ref[2])
        }

    return {
        "is_festival": 0,
        "festival_name": "None",
        "festival_type": "none",
        "festival_intensity": 0.0
    }

