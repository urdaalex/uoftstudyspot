"use strict"

var Promise = require('promise');
var moment = require('moment');
require('moment-round');
var aceScraper = require('./ace-scraper.js');
const NodeCache = require( "node-cache" );
const aceCache = new NodeCache( { stdTTL: 7200, checkperiod: 3600 } );

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

function dateify(dateString){
	return moment(dateString, "YYYYMMDDHHmmss")
}

module.exports={
	getBuildingCodes: function (){

		let promise = new Promise(function(resolve, reject){
			let cacheKey = "BUILDINGS";

			let buildings = aceCache.get(cacheKey);

			if (buildings == undefined){
				aceScraper.getBuildingCodes().then(function(scrappedBuildings){
					aceCache.set(cacheKey, scrappedBuildings);
					buildings = scrappedBuildings;
					resolve(buildings);
				});
			}else{
				resolve(buildings);
			}

			
		});

		return promise;
	},

	getRooms: function (buildingCode){

		let promise = new Promise(function(resolve, reject){
			let cacheKey = buildingCode + "ROOMS";

			let rooms = aceCache.get(cacheKey);

			if(rooms == undefined){
				aceScraper.getRooms(buildingCode).then(function(scrappedRooms){
					aceCache.set(cacheKey, scrappedRooms);
					rooms=scrappedRooms;
					resolve(rooms);
				});
			}else{
				resolve(rooms);
			}


		});

		return promise;
	},

	getDaySchedule: function (buildingCode, roomNumber, day){
		
		let dayKey = day.clone().startOf('isoWeek').format("YYYYMMDD");
		let cacheKey = buildingCode + roomNumber + dayKey;

		let promise = new Promise(function(resolve, reject){
			//check if entry in cache
			let sched = aceCache.get(cacheKey);
			
			//cache hit
			if (sched != undefined){
				console.log("hit");
				//deserialize the time
				for(let i=0; i<sched.length; i++){
					sched[i].time = moment(sched[i].time);
				}

				resolve(sched.filter(function(elem){
					return elem.time.isSame(day, 'day');
				}));

			//cache miss, use scraper and cache the result
			}else{
				console.log("miss");

				aceScraper.getWeekSchedule(buildingCode, roomNumber, day).then(function(sched){
					
					//serialize the time
					for(let i=0; i<sched.length; i++){
						sched[i].time = sched[i].time.valueOf();
					}

					//update the cache
					aceCache.set(cacheKey, sched);

					//deserialize the time
					for(let i=0; i<sched.length; i++){
						sched[i].time = moment(sched[i].time);
					}

					resolve(sched.filter(function(elem){
						return elem.time.isSame(day, 'day');
					}));

				}).catch(reject);
			}

		});

		return promise;
	}
};
