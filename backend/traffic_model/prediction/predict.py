import os
import sys
import joblib
import pandas as pd
import time

from datetime import datetime


# ============================================================
# PATHS
# ============================================================

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)

data_processing_dir = os.path.join(
    parent_dir,
    "data_processing"
)

models_dir = os.path.join(
    parent_dir,
    "models"
)

if data_processing_dir not in sys.path:
    sys.path.insert(0, data_processing_dir)


# ============================================================
# WEATHER / HOLIDAY UTILITIES
# ============================================================

# ============================================================
# WEATHER / HOLIDAY UTILITIES
# ============================================================

from weather_and_holiday_utils import (
    get_time_period,
    get_day_type_features,
    get_festival_features,
    get_weather_features
)


# ============================================================
# MODEL PATHS
# ============================================================

model_path = os.path.join(
    models_dir,
    "congestion_model.pkl"
)

traffic_encoder_path = os.path.join(
    models_dir,
    "traffic_encoder.pkl"
)

day_encoder_path = os.path.join(
    models_dir,
    "day_encoder.pkl"
)

road_encoder_path = os.path.join(
    models_dir,
    "road_encoder.pkl"
)

period_encoder_path = os.path.join(
    models_dir,
    "period_encoder.pkl"
)


# ============================================================
# CACHED MODEL ARTIFACTS
# ============================================================

_MODEL = None
_TRAFFIC_ENCODER = None
_DAY_ENCODER = None
_ROAD_ENCODER = None
_PERIOD_ENCODER = None


# ============================================================
# LOAD MODEL ARTIFACTS
# ============================================================

def load_ml_models():

    global _MODEL
    global _TRAFFIC_ENCODER
    global _DAY_ENCODER
    global _ROAD_ENCODER
    global _PERIOD_ENCODER

    t0 = time.time()

    already_loaded = (
        _MODEL is not None
        and _TRAFFIC_ENCODER is not None
        and _DAY_ENCODER is not None
        and _ROAD_ENCODER is not None
        and _PERIOD_ENCODER is not None
    )

    if not already_loaded:

        print(
            "[MODEL] Loading congestion model...",
            flush=True
        )

        required_files = [
            model_path,
            traffic_encoder_path,
            day_encoder_path
        ]

        for file_path in required_files:

            if not os.path.exists(file_path):

                raise FileNotFoundError(
                    f"Required model file not found: {file_path}"
                )

        _MODEL = joblib.load(model_path)
        if isinstance(_MODEL, dict) and "model" in _MODEL:
            _MODEL = _MODEL["model"]

        _TRAFFIC_ENCODER = joblib.load(traffic_encoder_path)
        _DAY_ENCODER = joblib.load(day_encoder_path)

        if os.path.exists(road_encoder_path):
            _ROAD_ENCODER = joblib.load(road_encoder_path)
        else:
            _ROAD_ENCODER = None

        if os.path.exists(period_encoder_path):
            _PERIOD_ENCODER = joblib.load(period_encoder_path)
        else:
            _PERIOD_ENCODER = None

        print(
            "[MODEL] Model and encoders loaded successfully.",
            flush=True
        )

    load_time = (
        0.0
        if already_loaded
        else time.time() - t0
    )

    return (
        _MODEL,
        _TRAFFIC_ENCODER,
        _DAY_ENCODER,
        _ROAD_ENCODER,
        _PERIOD_ENCODER,
        load_time
    )


# ============================================================
# SAFE INTEGER
# ============================================================

def _safe_int(value, default=0):

    try:

        if value is None:
            return default

        return int(
            float(value)
        )

    except (
        ValueError,
        TypeError
    ):

        return default


# ============================================================
# SAFE FLOAT
# ============================================================

def _safe_float(value, default=0.0):

    try:

        if value is None:
            return default

        return float(value)

    except (
        ValueError,
        TypeError
    ):

        return default


# ============================================================
# SAFE DAY ENCODING
# ============================================================

def _encode_day(
    day_of_week,
    day_encoder
):

    try:

        day_name = str(
            day_of_week
        ).strip()

        if hasattr(
            day_encoder,
            "classes_"
        ):

            classes = [
                str(x)
                for x in day_encoder.classes_
            ]

            if day_name in classes:

                return int(
                    day_encoder.transform(
                        [day_name]
                    )[0]
                )

        return 0

    except Exception:

        return 0


# ============================================================
# SAFE ROAD ENCODING
# ============================================================

def _encode_road(
    road_name,
    road_encoder
):

    if road_encoder is None:

        return 0

    try:

        road_clean = str(
            road_name
        ).strip()

        if hasattr(
            road_encoder,
            "classes_"
        ):

            classes = [
                str(x)
                for x in road_encoder.classes_
            ]

            if road_clean in classes:

                return int(
                    road_encoder.transform(
                        [road_clean]
                    )[0]
                )

        if "Generic Indore Corridor" in classes:

            return int(
                road_encoder.transform(
                    ["Generic Indore Corridor"]
                )[0]
            )

        if "Generic Traffic" in classes:

            return int(
                road_encoder.transform(
                    ["Generic Traffic"]
                )[0]
            )

        return 0

    except Exception:

        return 0


# ============================================================
# SAFE PERIOD ENCODING
# ============================================================

def _encode_period(
    time_period
):

    global _PERIOD_ENCODER

    if _PERIOD_ENCODER is not None:

        try:

            if hasattr(
                _PERIOD_ENCODER,
                "classes_"
            ):

                classes = [
                    str(x)
                    for x in _PERIOD_ENCODER.classes_
                ]

                if time_period in classes:

                    return int(
                        _PERIOD_ENCODER.transform(
                            [time_period]
                        )[0]
                    )

        except Exception:

            pass

    fallback = {

        "afternoon": 0,
        "evening": 1,
        "morning": 2,
        "night": 3

    }

    return fallback.get(
        time_period,
        2
    )


# ============================================================
# BUILD MODEL FEATURE ROW (EXACT 20 NUMERIC FEATURES)
# ============================================================

def _build_feature_row(
    dt_obj,
    road_name,
    car_c,
    bike_c,
    bus_c,
    truck_c,
    day_number,
    day_of_week,
    day_encoder,
    road_encoder
):

    hour = _safe_int(dt_obj.hour)
    day = _safe_int(day_number) if day_number is not None else _safe_int(dt_obj.day)

    dow_name = str(day_of_week).strip() if day_of_week else dt_obj.strftime("%A")
    day_encoded = _encode_day(dow_name, day_encoder)
    road_encoded = _encode_road(road_name, road_encoder)

    time_period = get_time_period(hour)
    period_encoded = _encode_period(time_period)

    try:
        day_type = get_day_type_features(dt_obj)
    except Exception:
        day_type = {"is_weekend": 0, "is_weekday": 1, "is_holiday": 0}

    try:
        festival = get_festival_features(dt_obj)
    except Exception:
        festival = {"is_festival": 0, "festival_intensity": 0.0}

    try:
        weather = get_weather_features(dt_obj)
    except Exception:
        weather = {"temperature": 25.0, "humidity": 50.0, "precipitation": 0.0, "wind_speed": 10.0, "cloud_cover": 20.0, "weather_code": 0}

    row = [
        hour,
        day,
        day_encoded,
        road_encoded,
        period_encoded,
        _safe_int(car_c),
        _safe_int(bike_c),
        _safe_int(bus_c),
        _safe_int(truck_c),
        _safe_int(day_type.get("is_weekend", 0)),
        _safe_int(day_type.get("is_weekday", 1)),
        _safe_int(day_type.get("is_holiday", 0)),
        _safe_int(festival.get("is_festival", 0)),
        _safe_float(festival.get("festival_intensity", 0.0)),
        _safe_float(weather.get("temperature", 25.0)),
        _safe_float(weather.get("humidity", 50.0)),
        _safe_float(weather.get("precipitation", 0.0)),
        _safe_float(weather.get("wind_speed", 10.0)),
        _safe_float(weather.get("cloud_cover", 20.0)),
        _safe_int(weather.get("weather_code", 0))
    ]

    columns = [
        "Hour",
        "Day",
        "Day of week",
        "Road ID",
        "time_period",
        "CarCount",
        "BikeCount",
        "BusCount",
        "TruckCount",
        "is_weekend",
        "is_weekday",
        "is_holiday",
        "is_festival",
        "festival_intensity",
        "temperature",
        "humidity",
        "precipitation",
        "wind_speed",
        "cloud_cover",
        "weather_code"
    ]

    features = pd.DataFrame([row], columns=columns)
    return features


# ============================================================
# VALIDATE MODEL FEATURES
# ============================================================

def _validate_feature_count(
    model,
    features
):

    expected = getattr(
        model,
        "n_features_in_",
        None
    )

    actual = features.shape[1]

    if (
        expected is not None
        and expected != actual
    ):

        raise ValueError(
            "Model feature mismatch. "
            f"Model expects {expected} features "
            f"but prediction created {actual} features."
        )


# ============================================================
# CURRENT CONGESTION PREDICTION WITH PROBABILITIES
# ============================================================

def predict_congestion_with_probabilities(
    time_str,
    day,
    day_of_week,
    car_count,
    bike_count,
    bus_count,
    truck_count,
    road_name="AB Road Vijay Nagar"
):
    """
    Predict congestion level AND class probabilities (LOW, MEDIUM, HIGH).
    """
    (
        model,
        traffic_encoder,
        day_encoder,
        road_encoder,
        period_encoder,
        _
    ) = load_ml_models()

    if isinstance(model, dict) and "model" in model:
        clf = model["model"]
    else:
        clf = model

    dt_time = None
    time_formats = [
        "%I:%M:%S %p",
        "%I:%M %p",
        "%H:%M:%S",
        "%H:%M"
    ]

    for fmt in time_formats:
        try:
            dt_time = datetime.strptime(str(time_str).strip(), fmt)
            break
        except ValueError:
            continue

    if dt_time is None:
        dt_time = datetime.now()

    features = _build_feature_row(
        dt_time,
        road_name,
        car_count,
        bike_count,
        bus_count,
        truck_count,
        day,
        day_of_week,
        day_encoder,
        road_encoder
    )

    _validate_feature_count(clf, features)

    prediction = clf.predict(features)
    decoded = str(traffic_encoder.inverse_transform(prediction)[0]).lower().strip()

    proba_dict = {"low": 0.33, "medium": 0.33, "high": 0.34}
    if hasattr(clf, "predict_proba") and hasattr(traffic_encoder, "classes_"):
        probas = clf.predict_proba(features)[0]
        classes = [str(c).lower().strip() for c in traffic_encoder.classes_]
        for cls_name, p_val in zip(classes, probas):
            proba_dict[cls_name] = round(float(p_val), 4)

    return decoded, proba_dict


def predict_congestion_current(
    time_str,
    day,
    day_of_week,
    car_count,
    bike_count,
    bus_count,
    truck_count,
    road_name="AB Road Vijay Nagar"
):
    decoded, _ = predict_congestion_with_probabilities(
        time_str, day, day_of_week, car_count, bike_count, bus_count, truck_count, road_name
    )
    return decoded


def predict_congestion(
    time_str,
    day,
    day_of_week,
    car_count,
    bike_count,
    bus_count,
    truck_count,
    road_name="AB Road Vijay Nagar"
):
    """
    Standard backward-compatible entry point returning predicted congestion label.
    """
    return predict_congestion_current(
        time_str, day, day_of_week, car_count, bike_count, bus_count, truck_count, road_name
    )



# ============================================================
# DATASET BASELINE CACHE
# ============================================================

_CORRIDOR_BASELINE_CACHE = None
_GENERAL_BASELINE_CACHE = None


# ============================================================
# LOAD DATASET BASELINES
# ============================================================

def _load_dataset_baselines():

    global _CORRIDOR_BASELINE_CACHE
    global _GENERAL_BASELINE_CACHE

    if (
        _CORRIDOR_BASELINE_CACHE is not None
        and _GENERAL_BASELINE_CACHE is not None
    ):

        return

    try:

        possible_files = [

            os.path.join(
                parent_dir,
                "data",
                "processed",
                "merged_traffic.csv"
            ),

            os.path.join(
                parent_dir,
                "data",
                "processed",
                "processed_traffic.csv"
            ),

            os.path.join(
                parent_dir,
                "data",
                "merged_traffic.csv"
            )

        ]

        csv_path = None

        for path in possible_files:

            if os.path.exists(path):

                csv_path = path
                break

        if csv_path is None:

            _CORRIDOR_BASELINE_CACHE = {}
            _GENERAL_BASELINE_CACHE = {}

            return

        df = pd.read_csv(
            csv_path
        )

        # ----------------------------------------------------
        # NORMALIZE COLUMN NAMES
        # ----------------------------------------------------

        rename_map = {

            "CarCount": "car_count",
            "BikeCount": "bike_count",
            "BusCount": "bus_count",
            "TruckCount": "truck_count",

            "car_count": "car_count",
            "bike_count": "bike_count",
            "bus_count": "bus_count",
            "truck_count": "truck_count"

        }

        df = df.rename(
            columns=rename_map
        )

        required_columns = [

            "car_count",
            "bike_count",
            "bus_count",
            "truck_count"

        ]

        for column in required_columns:

            if column not in df.columns:

                df[column] = 0

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            ).fillna(0)

        # ----------------------------------------------------
        # CREATE HOUR IF NEEDED
        # ----------------------------------------------------

        if "hour" not in df.columns:

            possible_time_columns = [

                "timestamp",
                "Date_Time",
                "time",
                "Time"

            ]

            found_time = None

            for column in possible_time_columns:

                if column in df.columns:

                    found_time = column
                    break

            if found_time is not None:

                parsed = pd.to_datetime(
                    df[found_time],
                    errors="coerce"
                )

                df["hour"] = (
                    parsed.dt.hour
                )

        # ----------------------------------------------------
        # CREATE ROAD NAME IF NEEDED
        # ----------------------------------------------------

        if "road_name" not in df.columns:

            if "Intersection_ID" in df.columns:

                df["road_name"] = (
                    df["Intersection_ID"]
                )

            else:

                df["road_name"] = (
                    "Generic Traffic"
                )

        # ----------------------------------------------------
        # CLEAN HOUR
        # ----------------------------------------------------

        df["hour"] = pd.to_numeric(
            df["hour"],
            errors="coerce"
        )

        df = df.dropna(
            subset=["hour"]
        )

        df["hour"] = df["hour"].astype(
            int
        )

        # ----------------------------------------------------
        # ROAD + HOUR BASELINE
        # ----------------------------------------------------

        _CORRIDOR_BASELINE_CACHE = (

            df.groupby(
                [
                    "road_name",
                    "hour"
                ]
            )[required_columns]
            .mean()
            .to_dict(
                orient="index"
            )
        )

        # ----------------------------------------------------
        # GENERAL HOURLY BASELINE
        # ----------------------------------------------------

        _GENERAL_BASELINE_CACHE = (

            df.groupby(
                "hour"
            )[required_columns]
            .mean()
            .to_dict(
                orient="index"
            )
        )

    except Exception as err:

        print(
            f"[Dataset Baseline Warning] {err}",
            flush=True
        )

        _CORRIDOR_BASELINE_CACHE = {}
        _GENERAL_BASELINE_CACHE = {}


# ============================================================
# GET MINUTE LEVEL BASELINE
# ============================================================

def _get_dataset_minute_baseline(
    dt_obj,
    road_name="AB Road Vijay Nagar"
):

    _load_dataset_baselines()

    h1 = int(
        dt_obj.hour
    )

    h2 = (
        h1 + 1
    ) % 24

    minute = int(
        dt_obj.minute
    )

    alpha = (
        minute / 60.0
    )

    road_clean = str(
        road_name
    ).strip()

    key1 = (
        road_clean,
        h1
    )

    key2 = (
        road_clean,
        h2
    )

    default1 = {

        "car_count": 45,
        "bike_count": 20,
        "bus_count": 10,
        "truck_count": 12

    }

    default2 = {

        "car_count": 50,
        "bike_count": 22,
        "bus_count": 11,
        "truck_count": 13

    }

    entry1 = (

        _CORRIDOR_BASELINE_CACHE.get(
            key1
        )

        or

        _GENERAL_BASELINE_CACHE.get(
            h1,
            default1
        )

        or

        default1

    )

    entry2 = (

        _CORRIDOR_BASELINE_CACHE.get(
            key2
        )

        or

        _GENERAL_BASELINE_CACHE.get(
            h2,
            default2
        )

        or

        default2

    )

    base_car = (

        (1.0 - alpha)
        * entry1.get(
            "car_count",
            45
        )

        +

        alpha
        * entry2.get(
            "car_count",
            50
        )

    )

    base_bike = (

        (1.0 - alpha)
        * entry1.get(
            "bike_count",
            20
        )

        +

        alpha
        * entry2.get(
            "bike_count",
            22
        )

    )

    base_bus = (

        (1.0 - alpha)
        * entry1.get(
            "bus_count",
            10
        )

        +

        alpha
        * entry2.get(
            "bus_count",
            11
        )

    )

    base_truck = (

        (1.0 - alpha)
        * entry1.get(
            "truck_count",
            12
        )

        +

        alpha
        * entry2.get(
            "truck_count",
            13
        )

    )

    return {

        "car_count": int(
            round(base_car)
        ),

        "bike_count": int(
            round(base_bike)
        ),

        "bus_count": int(
            round(base_bus)
        ),

        "truck_count": int(
            round(base_truck)
        ),

        "total_count": int(
            round(
                base_car
                + base_bike
                + base_bus
                + base_truck
            )
        ),

        "road_corridor": road_clean

    }


# ============================================================
# TRAFFIC TREND
# ============================================================

def calculate_recent_traffic_trend(
    current_total,
    historical_total,
    prev_total=None
):

    current_total = _safe_float(
        current_total
    )

    historical_total = _safe_float(
        historical_total,
        1.0
    )

    if (
        prev_total is not None
        and _safe_float(prev_total) > 0
    ):

        prev_total = _safe_float(
            prev_total
        )

        difference = (
            current_total
            - prev_total
        )

        if difference >= 5:

            trend = "INCREASING"
            trend_factor = 1.15

        elif difference <= -5:

            trend = "DECREASING"
            trend_factor = 0.85

        else:

            trend = "STABLE"
            trend_factor = 1.00

        reference_value = prev_total

    else:

        ratio = (

            current_total
            /
            max(
                1.0,
                historical_total
            )

        )

        if ratio >= 1.15:

            trend = "INCREASING"
            trend_factor = 1.12

        elif ratio <= 0.85:

            trend = "DECREASING"
            trend_factor = 0.88

        else:

            trend = "STABLE"
            trend_factor = 1.00

        reference_value = historical_total

    return {

        "trend": trend,

        "trend_factor": trend_factor,

        "previous_total": reference_value,

        "current_total": current_total

    }


# ============================================================
# FUTURE CONGESTION + PROBABILITIES
# ============================================================

def predict_congestion_future_proba(
    dt_obj,
    road_name="AB Road Vijay Nagar",
    yolo_obs=None
):

    """
    Predict future congestion level
    and class probabilities.
    """

    (
        model,
        traffic_encoder,
        day_encoder,
        road_encoder,
        period_encoder,
        _
    ) = load_ml_models()

    # --------------------------------------------------------
    # ENSURE DATETIME
    # --------------------------------------------------------

    if not isinstance(
        dt_obj,
        datetime
    ):

        try:

            dt_obj = pd.to_datetime(
                dt_obj
            ).to_pydatetime()

        except Exception:

            dt_obj = datetime.now()

    # --------------------------------------------------------
    # DATASET BASELINE
    # --------------------------------------------------------

    base_counts = (
        _get_dataset_minute_baseline(
            dt_obj,
            road_name
        )
    )

    # --------------------------------------------------------
    # YOLO OBSERVATION
    # --------------------------------------------------------

    if (
        yolo_obs
        and isinstance(
            yolo_obs,
            dict
        )
    ):

        now_dt = datetime.now()

        current_baseline = (
            _get_dataset_minute_baseline(
                now_dt,
                road_name
            )
        )

        c_car = max(

            0,

            _safe_int(
                yolo_obs.get(
                    "car_count",
                    0
                )
            )

            +

            (
                base_counts[
                    "car_count"
                ]

                -

                current_baseline[
                    "car_count"
                ]

            )

        )

        c_bike = max(

            0,

            _safe_int(
                yolo_obs.get(
                    "bike_count",
                    0
                )
            )

            +

            (
                base_counts[
                    "bike_count"
                ]

                -

                current_baseline[
                    "bike_count"
                ]

            )

        )

        c_bus = max(

            0,

            _safe_int(
                yolo_obs.get(
                    "bus_count",
                    0
                )
            )

            +

            (
                base_counts[
                    "bus_count"
                ]

                -

                current_baseline[
                    "bus_count"
                ]

            )

        )

        c_truck = max(

            0,

            _safe_int(
                yolo_obs.get(
                    "truck_count",
                    0
                )
            )

            +

            (
                base_counts[
                    "truck_count"
                ]

                -

                current_baseline[
                    "truck_count"
                ]

            )

        )

    else:

        c_car = base_counts[
            "car_count"
        ]

        c_bike = base_counts[
            "bike_count"
        ]

        c_bus = base_counts[
            "bus_count"
        ]

        c_truck = base_counts[
            "truck_count"
        ]

    # --------------------------------------------------------
    # FUTURE FEATURES
    # --------------------------------------------------------

    features = _build_feature_row(

        dt_obj,

        road_name,

        c_car,

        c_bike,

        c_bus,

        c_truck,

        dt_obj.day,

        dt_obj.strftime("%A"),

        day_encoder,

        road_encoder

    )

    # --------------------------------------------------------
    # VALIDATE
    # --------------------------------------------------------

    _validate_feature_count(
        model,
        features
    )

    # --------------------------------------------------------
    # MODEL PREDICTION
    # --------------------------------------------------------

    prediction = model.predict(
        features
    )

    probabilities = model.predict_proba(
        features
    )[0]

    decoded = str(

        traffic_encoder.inverse_transform(
            prediction
        )[0]

    ).lower()

    classes = [

        str(c).lower()

        for c in traffic_encoder.classes_

    ]

    probability_dict = dict(

        zip(
            classes,
            [
                float(p)
                for p in probabilities
            ]
        )

    )

    return (
        decoded,
        probability_dict
    )


# ============================================================
# FUTURE CONGESTION ONLY
# ============================================================

def predict_congestion_future(
    dt_obj,
    road_name="AB Road Vijay Nagar"
):

    label, _ = (
        predict_congestion_future_proba(
            dt_obj,
            road_name
        )
    )

    return label


# ============================================================
# CANONICAL TRAFFIC LABEL
# ============================================================

def map_canonical_traffic_label(
    raw_label
):

    value = str(
        raw_label
    ).strip().lower()

    if value in [

        "medium",
        "normal",
        "moderate"

    ]:

        return "NORMAL"

    elif value in [

        "high",
        "heavy"

    ]:

        return "HIGH"

    elif value in [

        "low",
        "free",
        "light",
        "smooth"

    ]:

        return "LOW"

    return "NORMAL"


# ============================================================
# MAIN PUBLIC PREDICTION FUNCTION
# ============================================================

def predict_congestion(
    time_str,
    day,
    day_of_week,
    car_count,
    bike_count,
    bus_count,
    truck_count,
    road_name="AB Road Vijay Nagar"
):

    return predict_congestion_current(

        time_str,

        day,

        day_of_week,

        car_count,

        bike_count,

        bus_count,

        truck_count,

        road_name

    )


# ============================================================
# MAIN TEST
# ============================================================

if __name__ == "__main__":

    print()

    print(
        "=" * 60
    )

    print(
        "        CONGESTION PREDICTION TEST"
    )

    print(
        "=" * 60
    )

    print()

    # --------------------------------------------------------
    # TEST 1
    # --------------------------------------------------------

    print(
        "[TEST 1] Current congestion prediction"
    )

    print()

    try:

        result = predict_congestion_current(

            "08:30:00 AM",

            18,

            "Wednesday",

            58,

            85,

            9,

            4,

            "AB Road Vijay Nagar"

        )

        print(
            "Prediction:",
            result.upper()
        )

    except Exception as err:

        print(
            "[ERROR]",
            err
        )

    print()

    # --------------------------------------------------------
    # TEST 2
    # --------------------------------------------------------

    print(
        "[TEST 2] Future congestion prediction"
    )

    print()

    try:

        future_time = datetime.now()

        (
            future_result,
            probabilities
        ) = predict_congestion_future_proba(

            future_time,

            "AB Road Vijay Nagar"

        )

        print(
            "Prediction:",
            future_result.upper()
        )

        print()

        print(
            "Probabilities:"
        )

        for label, probability in probabilities.items():

            print(

                f"{label.upper():8s}: "
                f"{probability * 100:.2f}%"

            )

    except Exception as err:

        print(
            "[ERROR]",
            err
        )

    print()

    print(
        "=" * 60
    )

    print(
        "        PREDICTION TEST COMPLETE"
    )

    print(
        "=" * 60
    )