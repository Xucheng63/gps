# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import mod  # Importing mod modules
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Route to submit location
@app.route('/submit-location', methods=['POST'])
def submit_location():
    data = request.get_json()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    hole_number = int(data.get('holeNumber'))
    timestamp = data.get('timestamp')  # Get timestamp
    click_count = data.get('clickCount')  # Get clicks
    distance = data.get('distance')  # Acquisition distance

    # Use the function in mod.py to determine the coordinate distribution
    polygons = mod.parse_kml(r"C:\Users\Jack\Desktop\gps-tracker\Atkins Golf Club3.kml", hole_number)
    greencenter = mod.find_green_polygon_center(polygons)
    polygon_name = mod.find_polygon(polygons, (latitude, longitude))
    
    # Save actions and results to a file
    save_to_file(data, polygon_name, timestamp, click_count, distance)

    # Returns a JSON response, including coordinate distribution information
    return jsonify({
        "message": "Location received", 
        "polygon": polygon_name, 
        "distance": distance, 
        "hole_number": hole_number, 
        "click_count": click_count, 
        "greencenter": greencenter
    }), 200

# Route to submit shot penalty
@app.route('/submit-shot-penalty', methods=['POST'])
def submit_shot_penalty():
    data = request.get_json()
    hole_number = data.get('holeNumber')
    shot_number = data.get('shotNumber')
    timestamp = data.get('timestamp')  # Get timestamp

    # Save the shot penalty to a file or database
    save_shot_penalty(timestamp, hole_number, shot_number)

    # Return a JSON response
    return jsonify({
        "message": "Shot penalty received", 
        "shot_number": shot_number, 
        "hole_number": hole_number
    }), 200

def save_to_file(data, polygon_name, timestamp, click_count, distance):
    with open("operations_log.json", "a") as file:
        log_entry = {
            "holeNumber": int(data.get('holeNumber')),
            "shotNumber": click_count,
            "latitude": data.get('latitude'),
            "longitude": data.get('longitude'),
            "distance": distance,
            "polygon": polygon_name,
            "timestamp": timestamp
        }
        file.write(json.dumps(log_entry) + "\n\n")

def save_shot_penalty(timestamp, hole_number, shot_number):
    with open("operations_log.json", "a") as file:
        penalty_entry = {
            "holeNumber": hole_number,
            "shotNumber": shot_number,
            "shotPenalty": 'yes',
            "timestamp": timestamp
        }
        file.write(json.dumps(penalty_entry) + "\n\n")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)  # Allow access from any device on the network