"use strict"

var Promise = require('promise');
var cheerio = require('cheerio');
var moment = require('moment');
require('moment-round');
var request = require('./request-cached-wrapper.js');
var buildings = require('./buildings.js');


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
	},

	getRooms: function (buildingCode){
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
					rooms[i]={id: $(this).attr('value'), name: $(this).text().trim()};
				});

				resolve(rooms.slice(1)); //remove the first option, the null value
			}).catch(function(err){
				reject(err);
			});
		});

		return promise;
	},

	getWeekSchedule: function (buildingCode, roomNumber, dayOfWeek){
		const options = {  
		  method: 'GET',
		  uri: "http://www.osm.utoronto.ca/bookings/f?p=200:5:420255677273101::::P5_BLDG,P5_ROOM,P5_CALENDAR_DATE:{0},{1},{2}"
		  	.format(buildingCode, roomNumber, dayOfWeek.clone().startOf('isoWeek').format("YYYYMMDD")), //use the same day for every day in the week, for caching purposes
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
	},

	getDaySchedule: function (buildingCode, roomNumber, day){
		let context = this;
		return new Promise(function(resolve, reject){
			context.getWeekSchedule(buildingCode, roomNumber, day).then(function(sched){
				resolve(sched.filter(function(elem){
					return elem.time.isSame(day,'day');
				}));
			}).catch(function(err){
				reject(err);
			});
		});

	}

};
