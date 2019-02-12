"use strict"

var Promise = require('promise');
var moment = require('moment');
require('moment-round');
var orbsScraper = require('./orbs-scraper.js');
const NodeCache = require("node-cache");
const orbsCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 }); /*cache entry expires every 24hrs*/

if (!String.prototype.format) {
  String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] !== 'undefined'
        ? args[number]
        : match
        ;
    });
  };
}

function dateify(dateString) {
  return moment(dateString, "YYYYMMDDHHmmss")
}

function round(date, duration, method) {
  return moment(Math[method]((+date) / (+duration)) * (+duration));
}

module.exports = {
  getBuildingCodes: function () {

    let promise = new Promise(function (resolve, reject) {
      let cacheKey = "BUILDINGS";

      let buildings = orbsCache.get(cacheKey);

      if (buildings === undefined) {
        orbsScraper.getBuildingCodes().then(function (scrappedBuildings) {
          orbsCache.set(cacheKey, scrappedBuildings);
          buildings = scrappedBuildings;
          resolve(buildings);
        });
      } else {
        resolve(buildings);
      }


    });

    return promise;
  },

  getRooms: function (buildingCode) {
    buildingCode = buildingCode.toUpperCase();

    let promise = new Promise(function (resolve, reject) {
      let cacheKey = buildingCode + "ROOMS";

      let rooms = orbsCache.get(cacheKey);

      if (rooms === undefined) {
        orbsScraper.getRooms(buildingCode).then(function (scrappedRooms) {
          orbsCache.set(cacheKey, scrappedRooms);
          rooms = scrappedRooms;
          resolve(rooms);
        });
      } else {
        resolve(rooms);
      }


    });

    return promise;
  },

  getDaySchedule: function (buildingCode, day) {
    buildingCode = buildingCode.toUpperCase();

    let dayKey = day.clone().startOf('isoWeek').format("YYYYMMDD");
    let cacheKey = dayKey;

    let promise = new Promise(function (resolve, reject) {
      //check if entry in cache
      let sched = orbsCache.get(cacheKey);

      //cache hit
      if (sched !== undefined) {

        resolve(sched.filter(function (elem) {
          return elem.buildingCode === buildingCode;
        }).map(function (elem) {
          elem.time = moment(elem.time);
          return elem;
        }).filter(function (elem) {
          return elem.time.isSame(day, 'day');
        }));

        //cache miss, use scraper and cache the result
      } else {
        orbsScraper.getWeekSchedule(day).then(function (sched) {
          console.log("cache miss");
          //serialize the time
          for (let i = 0; i < sched.length; i++) {
            sched[i].time = sched[i].time.valueOf();
          }

          //update the cache
          orbsCache.set(cacheKey, sched);

          resolve(sched.filter(function (elem) {
            return elem.buildingCode === buildingCode;
          }).map(function (elem) {
            elem.time = moment(elem.time);
            return elem;
          }).filter(function (elem) {
            return elem.time.isSame(day, 'day');
          }));

        }).catch(reject);
      }

    });

    return promise;
  },
  orderRooms: function (buildingCode, time) {
    time = time.minutes(0);

    let promise = new Promise(function (resolve, reject) {

      //get the building's day schedule (contains every room)
      Promise.all([module.exports.getDaySchedule(buildingCode, time), module.exports.getRooms(buildingCode)])
        .then(function ([sched, rooms]) {

          let hoursSched = [];

          //augment the every room in the array with the free times
          for (let i = 0; i < rooms.length; i++) {

            hoursSched = sched.filter(function (elem) {
              return elem.roomNumber === rooms[i].id;
            }).map(function (elem) {
              return elem.time.get('hour');
            });

            let currHour = time.get('hour');
            let firstFreeHour = null, firstBusyHour = null;

            //find first free hour
            while (currHour < 24) {
              if (!hoursSched.includes(currHour)) {
                firstFreeHour = currHour;
                break;
              }
              currHour++;
            }

            currHour++;

            //find the first busy hour after the firstFreeHour
            while (currHour < 24) {
              if (hoursSched.includes(currHour)) {
                firstBusyHour = currHour;
                break;
              }
              currHour++;
            }

            if (firstFreeHour === null) {
              rooms[i].freeFrom = Number.MAX_SAFE_INTEGER;
              rooms[i].freeUntil = Number.MIN_SAFE_INTEGER;
              rooms[i].waitTime = Number.MAX_SAFE_INTEGER;
              rooms[i].freeTime = Number.MIN_SAFE_INTEGER;
            } else {
              rooms[i].freeFrom = firstFreeHour;
              rooms[i].freeUntil = firstBusyHour || 0;
              rooms[i].waitTime = firstFreeHour - time.get('hour');
              if (firstBusyHour === null) {
                rooms[i].freeTime = 24 - firstFreeHour;
              } else {
                rooms[i].freeTime = firstBusyHour - firstFreeHour;
              }
            }
          }

          rooms.sort(function (a, b) {
            if (a.waitTime < b.waitTime || a.waitTime === b.waitTime && a.freeTime > b.freeTime) {
              return -1;
            } else if (a.waitTime > b.waitTime || a.waitTime === b.waitTime && a.freeTime < b.freeTime) {
              return 1;
            } else {
              return 0;
            }
          });

          resolve(rooms);

        }).catch(reject);
    });

    return promise;

  }
};
