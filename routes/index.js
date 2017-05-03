"use strict"

var Promise = require('promise');
var express = require('express');
var moment = require('moment');
require('moment-round');
var scraper = require('./ace-scraper.js');

var router = express.Router();

function orderRooms(buildingCode, time){
	time = time.round(1, 'hours');

	let promise = new Promise(function(resolve, reject){
		scraper.getRooms(buildingCode).then(function(rooms){
			
			//populate free time length, and wait time length for each room at the current time
			let augmentSchedPromises = [];
			for(let i=0; i<rooms.length; i++){
				augmentSchedPromises.push(
					scraper.getDaySchedule(buildingCode, rooms[i].id, time).then(function(sched){
						let hoursSched = sched.map(function(elem){
							return elem.time.get('hour');
						});

						let currHour = time.get('hour'); 
						let firstFreeHour = null, firstBusyHour = null;

						//find first free hour
						while(currHour < 24){
							if (!hoursSched.includes(currHour)){
								firstFreeHour = currHour;
								break;
							}
							currHour++;
						}

						currHour++;

						//find the first busy hour after the firstFreeHour
						while(currHour < 24){
							if (hoursSched.includes(currHour)){
								firstBusyHour = currHour;
								break;
							}
							currHour++;
						}

						if(firstFreeHour===null) {
							rooms[i].waitTime = Number.MAX_SAFE_INTEGER;
							rooms[i].freeTime = Number.MIN_SAFE_INTEGER;
						}else{
							rooms[i].waitTime = firstFreeHour - time.get('hour');
							if(firstBusyHour===null){
								rooms[i].freeTime = 24 - firstFreeHour;
							}else{
								rooms[i].freeTime = firstBusyHour - firstFreeHour;
							}
						}
					}).catch(reject)
				);
			}

			Promise.all(augmentSchedPromises).then(function () {
				rooms.sort(function(a, b){
					if(a.waitTime < b.waitTime || a.waitTime == b.waitTime && a.freeTime > b.freeTime){
						return -1;
					}else if(a.waitTime > b.waitTime || a.waitTime == b.waitTime && a.freeTime < b.freeTime){
						return 1;
					}else{
						return 0;
					}
				});
				resolve(rooms);
			});

		}).catch(reject);
	});

	return promise;
}

router.get('/buildings', function(req, res, next) {
	scraper.getBuildingCodes().then(function(v){
	  	res.json(v);
	}).catch(function(err){
		res.json("error");
		console.log(err);
	});
});

router.get('/buildings/:code/rooms', function(req, res, next) {
	scraper.getRooms(req.params.code).then(function(v){
	  	res.json(v);
	}).catch(function(err){
		res.json("error");
		console.log(err);
	});
});
router.get('/optimize', function(req, res, next) {
	orderRooms(req.query.code, moment().then(function(v){
	  	res.json(v);
	}).catch(function(err){
		res.json("error");
		console.log(err);
	});
});


module.exports = router;
