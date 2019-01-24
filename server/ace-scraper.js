"use strict"

var Promise = require('promise');
var cheerio = require('cheerio');
var moment = require('moment');
require('moment-round');
var request = require('request-promise');
var buildings = require('./buildings.js');

if (!String.prototype.format) {
  String.prototype.format = function () {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function (match, number) {
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
        ;
    });
  };
}

module.exports = {
  getBuildingCodes: function () {
    const options = {
      method: 'GET',
      uri: "https://www.ace.utoronto.ca/webapp/f?p=200:1:::::",
      json: false,
      jar: true
    };

    let buildingCodes = [];

    let promise = new Promise(function (resolve, reject) {
      request(options).then(function (response) {
        let $ = cheerio.load(response);
        let buildingCodes = [];

        $("#P1_BLDG").children().each(function (i, elem) {
          let code = $(this).attr('value');
          let name = $(this).text().split(" ").slice(1).join(" ").trim();
          buildingCodes[i] = { id: code, name: name };
        });

        resolve(buildingCodes.slice(1)); //remove the first option, the null value
      }).catch(function (err) {
        reject(err);
      });
    });

    return promise;
  },

  getRooms: function (buildingCode) {
    const options = {
      method: 'GET',
      uri: "https://www.ace.utoronto.ca/webapp/f?p=200:1:::::P1_BLDG:{0}"
        .format(buildingCode),
      json: false,
      jar: true
    };

    let rooms = [];

    let promise = new Promise(function (resolve, reject) {
      request(options).then(function (response) {
        let $ = cheerio.load(response);
        let rooms = [];

        $("#P1_ROOM").children().each(function (i, elem) {
          rooms[i] = { id: $(this).attr('value'), name: $(this).text().trim() };
        });

        resolve(rooms.slice(1)); //remove the first option, the null value
      }).catch(function (err) {
        reject(err);
      });
    });

    return promise;
  },

  getWeekSchedule: function (buildingCode, roomNumber, dayOfWeek) {
    let startDate = dayOfWeek.clone().startOf('isoWeek'); //use the same day for every day in the week, for caching purposes

    const options = {
      method: 'GET',
      uri: "https://www.ace.utoronto.ca/webapp/f?p=200:1:::::P1_BLDG,P1_ROOM,P1_CALENDAR_DATE:{0},{1},{2}"
        .format(buildingCode, roomNumber, startDate.format("YYYYMMDD")),
      json: false,
      jar: true
    };

    let sched = [];

    let promise = new Promise(function (resolve, reject) {
      request(options).then(function (body) {

        //needed to call calendar API
        let ajaxIdentifier = body.match("apex.widget.cssCalendar(.*)}\\)")[1].match("ajaxIdentifier\":\"(.*)\"}")[1];

        const calendarApiOptions = {
          method: 'POST',
          uri: 'https://www.ace.utoronto.ca/webapp/wwv_flow.ajax',
          jar: true,
          form: {
            p_flow_id: 200,
            p_flow_step_id: 1,
            p_instance: 0,
            p_request: "PLUGIN={0}".format(ajaxIdentifier),
            x01: "GET",
            x02: startDate.format("YYYYMMDD"),
            x03: startDate.add(7, 'days').format("YYYYMMDD")
          }
        };

        request(calendarApiOptions).then(function (body) {
          let responseSched = JSON.parse(body);

          for (let i = 0; i < responseSched.length; i++) {
            let currentTimeSpot = responseSched[i];
            let currentTime = moment(currentTimeSpot.start);
            let endTime = moment(currentTimeSpot.end).minute(0);

            while (!currentTime.isSame(endTime, 'hour')) {
              sched.push({
                buildingCode: buildingCode,
                roomNumber: roomNumber,
                time: currentTime.clone(),
                name: currentTimeSpot.title
              });
              currentTime.add(1, 'hour');
            }
          }

          resolve(sched);

        }).catch(function (err) {
          reject(err);
        });
      });

    });
    return promise;
  }
};
