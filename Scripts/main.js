var latLong = new Array();

//Handle geolocation
let latText = document.getElementById("latitude");
let longText = document.getElementById("longitude");


function getLocation(){
	//Get location if possible and showPosition()
	if (navigator.geolocation) {
    	navigator.geolocation.getCurrentPosition(showPosition);
  	} 
  	else{
  		//Display an error if not supported
    	swal("Geolocation is not supported by this browser.","Sorry","error");
  	}
}


function showPosition(position){
    let lat = position.coords.latitude;
    let long = position.coords.longitude;

    //2 decimal places to display above button
    latText.innerText = lat.toFixed(3);
    longText.innerText = long.toFixed(3);

    //Find observations near location
    latLong[0] = lat;
 	latLong[1] = long;
}

//Deal with error alerts in form
function submitter() {
	//On button click take value and find observations from form input
 	latLong[0] = document.getElementById("lat").value;
 	latLong[1] = document.getElementById("lon").value;

 		//Write latlng in 'your location' section
	let lat1 = parseFloat(latLong[0]);
    let long1 = parseFloat(latLong[1]);

    //Error messages if not in range or NaN
 	if(latLong[0]< -90 || latLong[0] > 90 || latLong[1]< -180 || latLong[1] > 180){
 		swal("Input Not In Range","-90 < Latitude < 90 AND -180 < Longitude < 180", "error",{button:"My Bad",})
 	}
 	else if(isNaN(lat1) || isNaN(long1)){
 		swal("Input Must Be A Number","-90 < Latitude < 90 AND -180 < Longitude < 180", "error",{button:"My Bad",})
 	}
}

// Scroll to the top of the page
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

console.log("Weather and wave data visualiser - Matthew Bailey")