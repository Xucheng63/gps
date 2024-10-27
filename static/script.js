// script.js
let clickPositions = [];  // Store the location of each click
let clickCount = 0;
let holeNumber = 1;
let isFirstClick = true;  // Add a flag to detect if it is the first click
let par = [5, 4, 4, 3, 4, 5, 4, 4, 3, 4, 5, 4, 3, 4, 5, 4, 3, 4];
let holeScores = [];  // Store the score for each hole
let putts=0;
let isputts=0;
let shortgameshot=0
function updateHoleShotDisplay() {
    const holeSelectElement = document.getElementById('holeSelect');
    const currentHole = holeSelectElement.options[holeSelectElement.selectedIndex].text;
    let shotNumberText = isFirstClick ? 'Tee' : `(Shot ${clickCount} )`;
    document.getElementById('clickCount').innerText = `${currentHole} | ${shotNumberText}`;
}

document.getElementById('gpsButton').addEventListener('click', function() {
    if (isFirstClick) {
        updateHoleShotDisplay();
        isFirstClick = false;  // Update the flag to indicate that it is no longer the first click
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPositionb, showError, {enableHighAccuracy: true});
        } else {
            document.getElementById('locationInfo').innerHTML = "Geolocation is not supported by this browser.";
        }
    } else {
        clickCount++;  // Increase click count
        updateHoleShotDisplay();   
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition, showError, {enableHighAccuracy: true});
        } else {
            document.getElementById('locationInfo').innerHTML = "Geolocation is not supported by this browser.";
        }
    }
});

document.getElementById('incrementButton').addEventListener('click', function() {
    clickCount++;
    const holeNumber = parseInt(document.getElementById('holeSelect').value, 10);
    const shotPenalty = `Shot ${clickCount}: Penalty`;
    const locationInfo = document.getElementById('locationInfo');
    locationInfo.innerHTML += `\n${shotPenalty}`;
    updateHoleShotDisplay();
    const currentTime = new Date().toISOString();
    sendShotPenaltyToServer(holeNumber, clickCount, currentTime);
});

document.getElementById('switchHoleButton').addEventListener('click', function() {
    if (holeNumber != 18) {
        holeScores[holeNumber - 1] = clickCount; 
        isFirstClick = true;
        clickCount = 0; // Reset click count when switching holes
        holeNumber = parseInt(document.getElementById('holeSelect').value, 10); // Gets the current hole number
        holeNumber++; // Increasing hole number
    }
    console.log(putts);
    console.log(shortgameshot);
    window.alert("Number of putts is "+putts+"\nNumber of short game shots is "+shortgameshot);
    putts=0;
    shortgameshot=0;
    isputts=0;
    document.getElementById('holeSelect').value = holeNumber.toString(); // Update the drop-down menu values
    clickPositions = []; // Reset location array
    updateHoleShotDisplay(); // Update the display when switching holes
    updateTotalScore();  // Update the total score when switching holes
});

document.getElementById('finishRoundButton').addEventListener('click', function() {
    console.log(document.getElementById('score').innerText);
    window.alert(document.getElementById('score').innerText);
    document.getElementById('locationInfo').innerHTML = '';
    document.getElementById('clickCount').innerText = '0';
    document.getElementById('score').innerText = 'Total Score: 0';
    clickCount = 0;
    holeScores = [];  
    clickPositions = [];  
    isFirstClick = true;  
    holeNumber = 1;  
    document.getElementById('holeSelect').value = '1';  
    updateHoleShotDisplay();  // Reset display
});

function sumFirstNItems(arr, n) {
    n = Math.min(n, arr.length);
    return arr.slice(0, n).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
}

function updateTotalScore() {
    let totalClicks = 0;
    for (let i = 0; i < holeNumber - 1; i++) {
        if (holeScores[i] !== undefined) {
            totalClicks += holeScores[i];
        }
    }
    const hole = document.getElementById('holeSelect').value;
    const totalScore = totalClicks - sumFirstNItems(par, hole-1);
    const formattedTotalScore = totalScore >= 0 ? `+${totalScore}` : totalScore;
    document.getElementById('score').innerText = `Total Score: ${formattedTotalScore}`;
}

async function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const locationInfo = document.getElementById('locationInfo');

    clickPositions.push({lat: latitude, lng: longitude});  // Storage location

    if (clickPositions.length > 1) {
        const distance = calculateDistance(clickPositions[clickPositions.length - 2], clickPositions[clickPositions.length - 1]);
        locationInfo.innerHTML += `\nShot ${clickCount}: Latitude: ${latitude}, Longitude: ${longitude}`;
    }

    const holeNumber = document.getElementById('holeSelect').value;
    const currentTime = new Date().toISOString(); // Get current time
    const currentDistance = clickPositions.length > 1 ? calculateDistance(clickPositions[clickPositions.length - 2], clickPositions[clickPositions.length - 1]).toFixed(2) : '0.00';
    
    // Wait for the server response before updating the locationInfo
    await sendLocationToServer(latitude, longitude, holeNumber, currentTime, clickCount, currentDistance);
}

function showPositionb(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const locationInfo = document.getElementById('locationInfo');
    locationInfo.innerHTML += `\nTee location: Latitude: ${latitude}, Longitude: ${longitude}`;

    clickPositions.push({lat: latitude, lng: longitude});  // Storage location
}

function calculateDistance(point1, point2) {
    const R = 6371;  // The radius of the earth in kilometers
    const lat1 = point1.lat * Math.PI / 180;
    const lat2 = point2.lat * Math.PI / 180;
    const deltaLat = (point2.lat - point1.lat) * Math.PI / 180;
    const deltaLon = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
               Math.cos(lat1) * Math.cos(lat2) *
               Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // The calculated distance is in kilometers and needs to be converted to yards
    const distanceInKm = R * c;
    const distanceInYards = distanceInKm * 3280.84; 

    return distanceInYards;
}

function showError(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById('locationInfo').innerHTML += "\nUser denied the request for Geolocation.";
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById('locationInfo').innerHTML += "\nLocation information is unavailable.";
            break;
        case error.TIMEOUT:
            document.getElementById('locationInfo').innerHTML += "\nThe request to get user location timed out.";
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById('locationInfo').innerHTML += "\nAn unknown error occurred.";
            break;
    }
}

async function sendLocationToServer(lat, lng, holeNumber, currentTime, clickCount, currentDistance) {
    fetch('http://localhost:5000/submit-location', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            holeNumber: holeNumber,
            timestamp: currentTime,
            clickCount: clickCount,
            distance: currentDistance
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        let lo = { lat: lat, lng: lng };
        let greenCenterObj = { lat: data.greencenter[1], lng: data.greencenter[0] };
        let greendistance = calculateDistance(lo, greenCenterObj); 
        const locationInfo = document.getElementById('locationInfo');
        locationInfo.innerHTML += `\nPolygon: ${data.polygon} Distance: ${(data.distance)} yards, GreenDistance: ${greendistance} yards`;
        if(par[data.hole_number-1]==4||par[data.hole_number-1]==5){
            if(data.click_count==1){
                if(data.polygon=="Fairway"){
                    locationInfo.innerHTML += `\nIt's a Fairway hit`;
                }else{
                    locationInfo.innerHTML += `\nIt's not Fairway hit`;
                }
            }
        }
        if(data.click_count==par[data.hole_number-1]-2){
            if(data.polygon=="Green"){
                locationInfo.innerHTML += `\nIt's GIR`;
            }else{
                locationInfo.innerHTML += `\nIt's not GIR`;
            }
        }
        if(data.polygon=="Green"){
            isputts=1;
            putts++;
        }
        if(greendistance<=20){
            shortgameshot++;
        }
    })
    .catch((error) => console.error('Error:', error));
}
//Fairway
function sendShotPenaltyToServer(holeNumber, shotNumber, currentTime) {
    fetch('http://localhost:5000/submit-shot-penalty', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            holeNumber: holeNumber,
            shotNumber: shotNumber,
            timestamp: currentTime,
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if(par[data.hole_number-1]==4||par[data.hole_number-1]==5){
            if(data.shot_number==1){
                locationInfo.innerHTML += `\nIt's not Fairway hit`;
            }
        }
        if(data.shot_number==par[data.hole_number-1]-2){
            locationInfo.innerHTML += `\nIt's not GIR`;
        }
    })
    .catch((error) => console.error('Error:', error));
}