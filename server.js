const express = require('express');
const bodyParser= require('body-parser');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const fetch = require("node-fetch");
const fs = require('fs');

//MongoDB Connection String
const uri = "mongodb://matthewbailey:magicseaweed@msw-shard-00-00-5nsdy.mongodb.net:27017,msw-shard-00-01-5nsdy.mongodb.net:27017,msw-shard-00-02-5nsdy.mongodb.net:27017/test?ssl=true&replicaSet=msw-shard-0&authSource=admin&retryWrites=true"


//Some variables
var db;
var jsonArr = []; //my JSON object
let result = new Array();
let dataFrame = new Array();
var latLong = new Array();
latLong[0] = 50.2839; // MSW Latitude
latLong[1] = -3.7775; // MSW Longitude



app.use(bodyParser.urlencoded({extended: true}));
app.use('/Scripts', express.static(__dirname +'/Scripts'));
app.use('/css', express.static(__dirname + '/css'));
app.set('view engine', 'ejs'); // Set view engine to EJS


//Fetch latest data from NDBC
fetch('http://www.ndbc.noaa.gov/data/latest_obs/latest_obs.txt')
    .then(res => res.text())
    //.then(body => console.log(body))
    .then(function(res){
    	var text1 = res;
    	process_response(text1); //Process the NDBC data from .txt to json format

    	MongoOn(); //Connect and upload to mongoDB after data retreived 
    })



//Connect to mongoDB, delete old documents in collection, insert new data
function MongoOn(){
	MongoClient.connect(uri, { useNewUrlParser: true }, (err, client) => {
  		if (err) return console.log(err)
  		db = client.db('magic') // database name

  	    db.collection('seaweed').drop({}, function(err) {
      		if (err) throw err;
      		console.log("Collection deleted");
    	});
  
    	db.collection('seaweed').insertMany(jsonArr, function(err, res) {
    		if(err) throw err;
    		console.log("Most recent data inserted. Database ready");
  		});

  		db.collection('seaweed').createIndex( { 'location' : "2dsphere" } )
	})

	//Listen on localhost:3000
  	app.listen(3000, () => {
    	console.log('listening on 3000')
  	})
}

// Handlers here:

//READ (RETRIEVE) - GET
app.get('/', (req, res) => {
	var cursor = db.collection('seaweed').find(
   		{
   		location : {
        	$near: {
           		$geometry: {
              		type : "Point",
              		coordinates : [ parseFloat(latLong[1]), parseFloat(latLong[0]) ]
           		},
           		//$minDistance: 1000,
           		$maxDistance: 160934 //100 Miles in M
        	}
    	},
     	date: {$gt: new Date(Date.now() - 3*60*60 * 1000)}
    }).toArray(function(err, results) {
  		//console.log(latLong)
  		//console.log(results)
  		//console.log(new Date(Date.now() - 3*60*60 * 1000))

  		// Send EJS file and results
 		res.render(__dirname + '/index.ejs', {seaweed: results, other: {status: true, latitude1: latLong[0], longitude1: latLong[1]} })
  		console.log("index.ejs and results sent")
	})
})


//CREATE - POST
app.post('/input', (req, res) => {
	var obj = req.body; //Take form input
	latLong[0] = obj["lat"];
	latLong[1] = obj["long"];

    res.redirect('/') //Redirect back to main page
})


//Process NDBC import
function process_response(text){

	//Removes all 'next line' commands from text
	text = text.replace(/(\r\n|\n|\r)/gm," ")
	var output = String(text);
	stringSplit(output);
}


function stringSplit(str){
	//Splits the string into an array of its components
	var res = str.split(" ");
	var j = 0;

	for(var i = 0; i < res.length; i++){
		if(res[i]!==""){
			//Remove all blank elements of array
			result[j] = res[i];

				//console.log(result[j])

			//Change all MM's to the universally recognised "-"
			if(result[j]=="MM"){
				result[j] = "-";
				//console.log(result)
			}
			j++
		}		
	}
	createDataframe();
}


function createDataframe(){
	//Get column positions of all 'important' information
	noCols = result.indexOf("#text");
	noRows = result.length/noCols;
	stationPos = result.indexOf("#STN");
	latPos = result.indexOf("LAT");
	lonPos = result.indexOf("LON");
	yearPos = result.indexOf("YYYY");
	monthPos = yearPos + 1;
	dayPos = result.indexOf("DD");
	hourPos = result.indexOf("hh");
	minutePos = result.indexOf("mm");
	windDirPos = result.indexOf("WDIR");
	windSpeedPos = result.indexOf("WSPD");
	waveHeightPos = result.indexOf("WVHT");
	averagePerPos = result.indexOf("APD");
	airTempPos = result.indexOf("ATMP");
	waterTempPos = result.indexOf("WTMP");
		
	//Removes first 2 rows (Headings and units) and separates each station
	var j = 0;
	for(var i = 2; i<noRows; i++){
		dataFrame[j] = result.slice(i*noCols,(i+1)*noCols);
		j++
	}

	//Account for the 2 deleted rows
	noRows = noRows-2;

	for (var i = 0; i < noRows; i++) {

		var d = new Date(dataFrame[i][yearPos],dataFrame[i][monthPos],dataFrame[i][dayPos],dataFrame[i][hourPos],dataFrame[i][minutePos]);
		var nDate = d.toISOString();
		//console.log(n);

	    jsonArr.push({
        	_id: dataFrame[i][stationPos],

        	'location' : {
        		type: "Point",
        		coordinates: [parseFloat(dataFrame[i][lonPos]), parseFloat(dataFrame[i][latPos])]
        	},

        	date: new Date(dataFrame[i][yearPos],dataFrame[i][monthPos]-1,dataFrame[i][dayPos],dataFrame[i][hourPos],dataFrame[i][minutePos]),

        	windDir: dataFrame[i][windDirPos],

        	windSpeed: dataFrame[i][windSpeedPos],

        	waveHeight: dataFrame[i][waveHeightPos],

        	averagePer: dataFrame[i][averagePerPos],

        	airTemp: dataFrame[i][airTempPos],

        	waterTemp: dataFrame[i][waterTempPos]
    	});
	}
}