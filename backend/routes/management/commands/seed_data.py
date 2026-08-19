import os
import pandas as pd
import numpy as np
from django.core.management.base import BaseCommand
from routes.models import TrafficData
import osmnx as ox
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Seeds the database with traffic data for Indore'

    def handle(self, *args, **kwargs):
        # Clear existing data
        TrafficData.objects.all().delete()

        # Clear OSMnx cache
        cache_folder = os.path.join(os.path.dirname(__file__), '..', '..', 'cache')
        os.makedirs(cache_folder, exist_ok=True)
        for file in os.listdir(cache_folder):
            os.remove(os.path.join(cache_folder, file))
            self.stdout.write(self.style.WARNING(f"Deleted cache file: {file}"))

        # Load Indore road data network
        ox.settings.use_cache = True
        ox.settings.cache_folder = cache_folder
        try:
            G = ox.graph_from_place('Indore, India', network_type='drive')
            edges = ox.graph_to_gdfs(G, nodes=False, edges=True)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to load Indore map data: {str(e)}"))
            return

        # Log sample osmids
        sample_osmids = [str(osmid) if not isinstance(osmid, list) else str(osmid[0]) for osmid in edges['osmid'].values[:5]]
        self.stdout.write(self.style.NOTICE(f"Sample OSM osmids: {sample_osmids}"))

        # Generate synthetic data
        num_rows = 10000
        road_ids = edges['osmid'].values
        road_types = edges['highway'].values
        hours = np.random.randint(0, 24, num_rows)
        days_of_week = np.random.randint(0, 7, num_rows)
        dates = [datetime(2025, 5, 1) + timedelta(days=i % 30) for i in range(num_rows)]
        times = [f"{h:02d}:00:00" for h in hours]
        speeds = []

        # Base speeds for Indore road types
        base_speeds = {
            'motorway': 70, 'primary': 50, 'secondary': 40, 'tertiary': 30,
            'residential': 25, 'unclassified': 20
        }

        # Generate speeds
        for i in range(num_rows):
            road_type = road_types[i % len(road_types)] if isinstance(road_types[i % len(road_types)], str) else 'residential'
            base_speed = base_speeds.get(road_type, 25)
            hour = hours[i]
            time_factor = 0.65 if hour in [9, 10, 11, 18, 19, 20] else 1.0
            day_factor = 0.85 if days_of_week[i] < 5 else 1.0
            random_factor = np.random.uniform(0.7, 1.3)
            speed = base_speed * time_factor * day_factor * random_factor
            speeds.append(max(5, min(speed, 80)))

        # Create DataFrame
        road_id_list = [
            str(road_ids[i % len(road_ids)]) if not isinstance(road_ids[i % len(road_ids)], list)
            else str(road_ids[i % len(road_ids)][0])
            for i in range(num_rows)
        ]
        self.stdout.write(self.style.NOTICE(f"Sample generated road_ids: {road_id_list[:5]}"))

        data = {
            'road_id': road_id_list,
            'latitude_start': [edges.iloc[i % len(edges)]['geometry'].coords[0][1] for i in range(num_rows)],
            'longitude_start': [edges.iloc[i % len(edges)]['geometry'].coords[0][0] for i in range(num_rows)],
            'latitude_end': [edges.iloc[i % len(edges)]['geometry'].coords[-1][1] for i in range(num_rows)],
            'longitude_end': [edges.iloc[i % len(edges)]['geometry'].coords[-1][0] for i in range(num_rows)],
            'date': dates,
            'time': times,
            'speed_kmh': speeds,
            'congestion_level': ['red' if s < 12 else 'yellow' if s < 25 else 'green' for s in speeds]
        }
        df = pd.DataFrame(data)

        # Seed database
        for _, row in df.iterrows():
            TrafficData.objects.create(
                road_id=row['road_id'],
                latitude_start=row['latitude_start'],
                longitude_start=row['longitude_start'],
                latitude_end=row['latitude_end'],
                longitude_end=row['longitude_end'],
                date=row['date'],
                time=row['time'],
                speed_kmh=row['speed_kmh'],
                congestion_level=row['congestion_level']
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {num_rows} rows for Indore'))