import os
from datetime import datetime

# MP / Indore Official Festival & Public Holiday Reference (2023 - 2026)
MP_FESTIVAL_CALENDAR = {
    # Date (MM-DD): (festival_name, festival_type, festival_intensity)
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

def get_time_period(hour: int) -> str:
    """
    Categorizes hour of day into standard time periods:
    05:00 - 10:59 -> morning
    11:00 - 16:59 -> afternoon
    17:00 - 21:59 -> evening
    22:00 - 04:59 -> night
    """
    h = int(hour) % 24
    if 5 <= h <= 10:
        return "morning"
    elif 11 <= h <= 16:
        return "afternoon"
    elif 17 <= h <= 21:
        return "evening"
    else:
        return "night"

def get_day_type_features(dt: datetime) -> dict:
    """
    Extracts weekend, weekday, and public holiday indicators for a datetime object.
    """
    dow = dt.weekday() # 0 = Monday, 6 = Sunday
    is_weekend = 1 if dow >= 5 else 0
    is_weekday = 1 if dow < 5 else 0
    
    mm_dd = dt.strftime("%m-%d")
    fest_info = MP_FESTIVAL_CALENDAR.get(mm_dd)
    is_holiday = 1 if (is_weekend or (fest_info and "holiday" in fest_info[1])) else 0

    return {
        "is_weekend": is_weekend,
        "is_weekday": is_weekday,
        "is_holiday": is_holiday
    }

def get_festival_features(dt: datetime) -> dict:
    """
    Looks up Madhya Pradesh and Indore local festival metadata for a given date.
    """
    mm_dd = dt.strftime("%m-%d")
    fest_info = MP_FESTIVAL_CALENDAR.get(mm_dd)
    
    if fest_info:
        return {
            "is_festival": 1,
            "festival_name": fest_info[0],
            "festival_type": fest_info[1],
            "festival_intensity": float(fest_info[2])
        }
    else:
        return {
            "is_festival": 0,
            "festival_name": "None",
            "festival_type": "none",
            "festival_intensity": 0.0
        }
