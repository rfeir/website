import csv
import json

def csv_to_json(csv_file_path, json_file_path):
    try:
        # Read the CSV file
        with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file)  # Automatically uses headers as keys
            rows = list(csv_reader)  # Convert to list of dictionaries

        # Write to a JSON file
        with open(json_file_path, mode='w', encoding='utf-8') as json_file:
            json.dump(rows, json_file, indent=4)

        print(f"JSON file has been created at {json_file_path}")
    except Exception as e:
        print(f"Error: {e}")

# File paths
csv_file = "aggregated_data_4.csv"
json_file = "aggregated_data.json"

# Convert CSV to JSON
csv_to_json(csv_file, json_file)

