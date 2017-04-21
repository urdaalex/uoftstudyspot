"use strict"

var express = require('express');
var request = require('request-promise');
var Promise = require('promise');
var cheerio = require('cheerio');
var moment = require('moment');
var buildings = require('./buildings.js');
var dist = require('./distance.js');

var router = express.Router();

// First, checks if it isn't implemented yet.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

function getBuildingCodes(){
	const options = {  
	  method: 'GET',
	  uri: "http://www.osm.utoronto.ca/bookings/f?p=200:3:1742256958421901::::P3_BLDG,P3_ROOM:,",
	  json: false,
	  jar: true
	};

	let buildingCodes = [];

	let promise = new Promise(function(resolve, reject){
		request(options).then(function(response){
			let $ = cheerio.load(response);
			let buildingCodes = [];

			$("#P3_BLDG").children().each(function(i, elem){
				let code = $(this).attr('value');
				buildingCodes[i]={id: code, name: buildings.getBuilding(code).name};
			});

			resolve(buildingCodes.slice(1)); //remove the first option, the null value
		}).catch(function(err){
			reject(err);
		});
	});

	return promise;
}

function getRooms(buildingCode){
	const options = {  
	  method: 'GET',
	  uri: "http://www.osm.utoronto.ca/bookings/f?p=200:3:1742256958421901::::P3_BLDG,P3_ROOM:{0},".format(buildingCode),
	  json: false,
	  jar: true
	};

	let rooms = [];

	let promise = new Promise(function(resolve, reject){
		request(options).then(function(response){
			let $ = cheerio.load(response);
			let rooms = [];

			$("#P3_ROOM").children().each(function(i, elem){
				rooms[i]={id: $(this).attr('value'), name: $(this).text()};
			});

			resolve(rooms.slice(1)); //remove the first option, the null value
		}).catch(function(err){
			reject(err);
		});
	});

	return promise;
}


function dateify(dateString){
	return moment(dateString, "YYYYMMDDHHmmss")
}

function getDaySchedule(buildingCode, roomNumber, day){
	return new Promise(function(resolve, reject){
		getWeekSchedule(buildingCode, roomNumber, day).then(function(sched){
			resolve(sched.filter(function(elem){
				return elem.time.isSame(day,'day');
			}));
		}).catch(function(err){
			reject(err);
		});
	});

}

function getWeekSchedule(buildingCode, roomNumber, dayOfWeek){
	const options = {  
	  method: 'GET',
	  uri: "http://www.osm.utoronto.ca/bookings/f?p=200:5:420255677273101::::P5_BLDG,P5_ROOM,P5_CALENDAR_DATE:{0},{1},{2}".format(buildingCode, roomNumber, dayOfWeek.format("YYYYMMDD")),
	  json: false,
	  jar: true
	};

	let sched = [];

	let promise = new Promise(function(resolve, reject){
		request(options).then(function(response){
			let $ = cheerio.load(response);
			
			//go over every event
			$(".apex_cal_data_grid_src").each(function(i, elem){
				sched.push({buildingCode: buildingCode,
					roomNumber: roomNumber,
					time: dateify($(this).prev().val()),
					name: $(this).text().trim(),

				});
			});

			resolve(sched);
		}).catch(function(err){
			reject(err);
		});
	});

	return promise;
}

function findFreeRoom(buildingCode, time){
	let promise = new Promise(function(resolve, reject){
		getRooms(buildingCode).then(function(rooms){
			let bestRoom = {};

			for(let i=0; i<rooms.length; i++){
				getDaySchedule(buildingCode, rooms[i].id, time).then(function(sched){
					console.log(sched);		
					resolve();			
				}).catch(reject);
			}

			
		}).catch(reject);
	});

	return promise;
}

/* GET home page. */
router.get('/', function(req, res, next) {
	//Promise.all([getR])

	findFreeRoom("AB", moment()).then(function(v){
	  	res.json(buildings.getClosestBuilding(43.660265, -79.398748));
	}).catch(function(err){
		console.log(err);
	});

	/*
	getDaySchedule("AH", "402",moment()).then(function(v){
	  	res.json(v);
	}).catch(function(err){
		console.log(err);
	});
	*/	
});

module.exports = router;
