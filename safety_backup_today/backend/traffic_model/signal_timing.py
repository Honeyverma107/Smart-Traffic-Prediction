import os
import math

# PCE (Passenger Car Equivalent) factors
PCE_WEIGHTS = {
    "car_count": 1.0,
    "bike_count": 0.5,
    "bus_count": 2.5,
    "truck_count": 3.0,
    "auto_count": 0.8
}

# Signal System Safety Parameters
MIN_GREEN_SEC = 15      # Minimum green time to prevent direction starvation
MAX_GREEN_SEC = 65      # Maximum green time limit
YELLOW_SEC = 3          # Standard yellow transition
ALL_RED_SEC = 2         # Clearance interval

def calculate_priority_score(pce_count: float, waiting_time_sec: float, density: float) -> float:
    """
    Computes a balanced signal priority score combining PCE volume, waiting time, and density.
    Priority Score = (0.5 * PCE) + (0.3 * (waiting_time / 10)) + (0.2 * (density * 10))
    """
    w_pce = 0.5
    w_wait = 0.3
    w_density = 0.2
    
    score = (w_pce * pce_count) + (w_wait * (waiting_time_sec / 10.0)) + (w_density * (density * 10.0))
    return round(score, 2)

def calculate_dynamic_signal_timing(
    directional_data: dict, 
    intersection_name: str = "Vijay Nagar Square, Indore",
    cycle_target_sec: int = 140
) -> dict:
    """
    Calculates dynamic green light durations across 4 directions (north, south, east, west)
    based on YOLO vehicle detection, PCE density, waiting time, and priority scoring.
    
    Args:
        directional_data (dict): Dictionary with keys 'north', 'south', 'east', 'west', 
            where each contains vehicle counts & optional waiting_time.
        intersection_name (str): Name of the Indore intersection.
        cycle_target_sec (int): Target full cycle duration in seconds.
        
    Returns:
        dict: Complete JSON response with directional green times, priority scores, and phase summary.
    """
    directions = ['north', 'south', 'east', 'west']
    processed_directions = {}
    total_priority = 0.0
    
    # 1. Process each direction's PCE, density, and priority score
    for dir_key in directions:
        dir_info = directional_data.get(dir_key, {})
        
        car_c = int(dir_info.get("car_count", 0))
        bike_c = int(dir_info.get("bike_count", 0))
        bus_c = int(dir_info.get("bus_count", 0))
        truck_c = int(dir_info.get("truck_count", 0))
        auto_c = int(dir_info.get("auto_count", 0))
        
        waiting_sec = float(dir_info.get("waiting_time_sec", 30))
        
        # Calculate Passenger Car Equivalent (PCE) Volume
        pce = (
            (car_c * PCE_WEIGHTS["car_count"]) +
            (bike_c * PCE_WEIGHTS["bike_count"]) +
            (bus_c * PCE_WEIGHTS["bus_count"]) +
            (truck_c * PCE_WEIGHTS["truck_count"]) +
            (auto_c * PCE_WEIGHTS["auto_count"])
        )
        
        total_veh = car_c + bike_c + bus_c + truck_c + auto_c
        
        # Density (assume 50 PCE capacity baseline)
        density = min(1.0, pce / 50.0)
        
        # Priority Score
        priority = calculate_priority_score(pce, waiting_sec, density)
        total_priority += max(0.1, priority)
        
        # Congestion Level mapping
        if pce < 15:
            cong = "LOW"
        elif pce < 38:
            cong = "MEDIUM"
        else:
            cong = "HIGH"
            
        processed_directions[dir_key] = {
            "direction_label": dir_key.upper(),
            "vehicle_counts": {
                "car_count": car_c,
                "bike_count": bike_c,
                "bus_count": bus_c,
                "truck_count": truck_c,
                "auto_count": auto_c
            },
            "total_vehicles": total_veh,
            "pce_volume": round(pce, 1),
            "traffic_density": round(density, 2),
            "waiting_time_sec": int(waiting_sec),
            "congestion": cong,
            "priority_score": priority
        }
        
    # 2. Allocate Dynamic Green Times proportionally while respecting MIN and MAX bounds
    allocable_green_pool = max(0, cycle_target_sec - (4 * MIN_GREEN_SEC) - (4 * YELLOW_SEC) - (4 * ALL_RED_SEC))
    
    total_cycle_actual = 0
    highest_priority_dir = "north"
    highest_priority_score = -1
    
    for dir_key in directions:
        dir_data = processed_directions[dir_key]
        p_score = dir_data["priority_score"]
        
        # Proportional green calculation
        prop_share = p_score / max(0.1, total_priority)
        calculated_green = MIN_GREEN_SEC + math.floor(prop_share * allocable_green_pool)
        
        # Enforce MIN and MAX limits
        final_green = max(MIN_GREEN_SEC, min(MAX_GREEN_SEC, calculated_green))
        
        dir_data["green_time_sec"] = final_green
        dir_data["yellow_time_sec"] = YELLOW_SEC
        dir_data["all_red_time_sec"] = ALL_RED_SEC
        
        total_cycle_actual += (final_green + YELLOW_SEC + ALL_RED_SEC)
        
        if p_score > highest_priority_score:
            highest_priority_score = p_score
            highest_priority_dir = dir_key
            
    # Direction labels for Indore intersections
    dir_location_names = {
        "north": "North (AB Road / Vijay Nagar)",
        "south": "South (Palasia Square)",
        "east": "East (Ring Road / Bypass)",
        "west": "West (Super Corridor / MR 10)"
    }
    
    for k in processed_directions:
        processed_directions[k]["name"] = dir_location_names.get(k, k.upper())
        
    rec_summary = (
        f"{processed_directions[highest_priority_dir]['name']} assigned priority phase with "
        f"{processed_directions[highest_priority_dir]['green_time_sec']}s green time "
        f"for {processed_directions[highest_priority_dir]['total_vehicles']} waiting vehicles."
    )
    
    return {
        "intersection": intersection_name,
        "mode": "CAMERA_SIMULATED_DYNAMIC_TIMING",
        "cycle_time_sec": total_cycle_actual,
        "active_phase": highest_priority_dir,
        "recommendation_summary": rec_summary,
        "directions": processed_directions
    }

if __name__ == "__main__":
    test_input = {
        "north": {"car_count": 12, "bike_count": 8, "bus_count": 1, "truck_count": 0, "waiting_time_sec": 20},
        "south": {"car_count": 8, "bike_count": 5, "bus_count": 0, "truck_count": 0, "waiting_time_sec": 15},
        "east": {"car_count": 65, "bike_count": 40, "bus_count": 5, "truck_count": 3, "waiting_time_sec": 50},
        "west": {"car_count": 42, "bike_count": 30, "bus_count": 3, "truck_count": 2, "waiting_time_sec": 40}
    }
    output = calculate_dynamic_signal_timing(test_input)
    import json
    print(json.dumps(output, indent=2))
