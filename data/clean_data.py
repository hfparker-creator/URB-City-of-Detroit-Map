import json
import re
from pathlib import Path
import openpyxl

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "phase1.xlsx"
OUTPUT_FILE = BASE_DIR / "resources.geojson"

wb = openpyxl.load_workbook(INPUT_FILE, data_only=True)

def clean_text(value):
    if value is None:
        return ""
    return str(value).strip()

def parse_number(value):
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    if match:
        return float(match.group())
    return None

def normalize_coords(x_value, y_value):
    x = parse_number(x_value)
    y = parse_number(y_value)

    if x is None or y is None:
        return None, None

    if abs(x) > 90 and abs(y) <= 90:
        lng, lat = x, y
    elif abs(y) > 90 and abs(x) <= 90:
        lng, lat = y, x
    else:
        return None, None

    return lat, lng

def category_from_sheet(title):
    lowered = title.lower()
    if "community" in lowered:
        return "community"
    if "business" in lowered:
        return "business"
    if "transportation" in lowered:
        return "transportation"
    if "public" in lowered:
        return "public_resources"
    return "other"

features = []

for ws in wb.worksheets:
    category = category_from_sheet(ws.title)

    for row in ws.iter_rows(values_only=True):
        values = list(row)

        if not any(v is not None and str(v).strip() != "" for v in values):
            continue

        name = clean_text(values[0]) if len(values) > 0 else ""
        source = clean_text(values[1]) if len(values) > 1 else ""
        x_value = values[2] if len(values) > 2 else None
        y_value = values[3] if len(values) > 3 else None

        joined = " ".join(clean_text(v).lower() for v in values)
        if "resource title" in joined or "x-coordinate" in joined:
            continue

        if not name:
            continue

        lat, lng = normalize_coords(x_value, y_value)
        if lat is None or lng is None:
            continue

        features.append({
            "type": "Feature",
            "properties": {
                "name": name,
                "category": category,
                "sheet": ws.title,
                "source": source
            },
            "geometry": {
                "type": "Point",
                "coordinates": [lng, lat]
            }
        })

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(geojson, f, indent=2)

print(f"Wrote {len(features)} features to {OUTPUT_FILE}")