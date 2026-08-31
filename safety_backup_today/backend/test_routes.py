import os
import sys
import time
import pandas as pd
import osmnx as ox
import osmnx.distance as distance

ox.settings.use_cache = True
ox.settings.cache_folder = os.path.join(os.path.dirname(__file__), "cache")

print("Loading Indore graph from cache...")
start = time.time()
G = ox.graph_from_place("Indore, India", network_type="drive")
G = distance.add_edge_lengths(G)
print(f"Graph loaded in {time.time() - start:.2f}s")

# Test origin and destination: Vijay Nagar to Palasia in Indore
source = (22.7533, 75.8937)  # Vijay Nagar
dest = (22.7244, 75.8839)    # Palasia

origin_node = ox.nearest_nodes(G, source[1], source[0])
dest_node = ox.nearest_nodes(G, dest[1], dest[0])

print(f"Nearest nodes: origin={origin_node}, dest={dest_node}")

# Route 1: Primary shortest path by length
route1 = ox.shortest_path(G, origin_node, dest_node, weight="length")

# Route 2: Penalize edges of route 1 to find alternative path
G_temp2 = G.copy()
if route1 and len(route1) > 2:
    for u, v in zip(route1[1:-1], route1[2:]):
        if G_temp2.has_edge(u, v):
            for k in G_temp2[u][v]:
                G_temp2[u][v][k]["length"] = G_temp2[u][v][k].get("length", 1) * 2.5

route2 = ox.shortest_path(G_temp2, origin_node, dest_node, weight="length")

# Route 3: Penalize edges of route 1 and route 2 further to find 3rd alternative path
G_temp3 = G_temp2.copy()
if route2 and len(route2) > 2:
    for u, v in zip(route2[1:-1], route2[2:]):
        if G_temp3.has_edge(u, v):
            for k in G_temp3[u][v]:
                G_temp3[u][v][k]["length"] = G_temp3[u][v][k].get("length", 1) * 3.0

route3 = ox.shortest_path(G_temp3, origin_node, dest_node, weight="length")

print("Route 1 node count:", len(route1) if route1 else 0)
print("Route 2 node count:", len(route2) if route2 else 0)
print("Route 3 node count:", len(route3) if route3 else 0)
