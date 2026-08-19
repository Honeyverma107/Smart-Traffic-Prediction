
import os
import joblib
import pandas as pd
import time

# ---------------------------------
# Current Directory
# ---------------------------------

current_dir = os.path.dirname(__file__)

# ---------------------------------
# Model Paths
# ---------------------------------

model_path = os.path.join(
    current_dir,
    "..",
    "models",
    "congestion_model.pkl"
)

traffic_encoder_path = os.path.join(
    current_dir,
    "..",
    "models",
    "traffic_encoder.pkl"
)

day_encoder_path = os.path.join(
    current_dir,
    "..",
    "models",
    "day_encoder.pkl"
)

# ---------------------------------
# Single-Load Model Memory Cache
# ---------------------------------

_MODEL = None
_TRAFFIC_ENCODER = None
_DAY_ENCODER = None


def load_ml_models():
    global _MODEL, _TRAFFIC_ENCODER, _DAY_ENCODER
    t0 = time.time()
    was_in_memory = (_MODEL is not None and _TRAFFIC_ENCODER is not None and _DAY_ENCODER is not None)
    if not was_in_memory:
        _MODEL = joblib.load(model_path)
        _TRAFFIC_ENCODER = joblib.load(traffic_encoder_path)
        _DAY_ENCODER = joblib.load(day_encoder_path)
    load_time = 0.0 if was_in_memory else (time.time() - t0)
    return _MODEL, _TRAFFIC_ENCODER, _DAY_ENCODER, load_time


# ---------------------------------
# Prediction Function
# ---------------------------------
def predict_congestion(
    time,
    day,
    day_of_week,
    car_count,
    bike_count,
    bus_count,
    truck_count
):
    model, traffic_encoder, day_encoder, _ = load_ml_models()

    # Convert Time to Hour
    hour = pd.to_datetime(
        time,
        format="%I:%M:%S %p"
    ).hour

    # Encode Weekday
    day_encoded = day_encoder.transform(
        [day_of_week]
    )[0]

    # Create Feature DataFrame
    features = pd.DataFrame(
        [[
            hour,
            day,
            day_encoded,
            car_count,
            bike_count,
            bus_count,
            truck_count
        ]],
        columns=[
            "Hour",
            "Day",
            "Day of week",
            "CarCount",
            "BikeCount",
            "BusCount",
            "TruckCount"
        ]
    )

    # Debug Input
    print("\n========== INPUT FEATURES ==========")
    print(features)

    # Predict
    prediction = model.predict(features)

    # Prediction Probabilities
    probabilities = model.predict_proba(features)

    print("\nPrediction Probabilities:")
    for cls, prob in zip(
        traffic_encoder.classes_,
        probabilities[0]
    ):
        print(f"{cls}: {prob:.4f}")

    # Encoded Prediction
    print("\nEncoded Prediction:")
    print(prediction)

    # Decode Prediction
    decoded = traffic_encoder.inverse_transform(prediction)

    print("\nDecoded Prediction:")
    print(decoded)

    print("\n====================================")

    return decoded[0]


# ---------------------------------
# Local Testing
# ---------------------------------
print("************ NEW PREDICT FILE RUNNING ************")

if __name__ == "__main__":

    result = predict_congestion(
        time="07:00:00 PM",
        day=10,
        day_of_week="Tuesday",
        car_count=10,
        bike_count=15,
        bus_count=15,
        truck_count=10
    )

    print("Predicted Traffic Situation:", result)