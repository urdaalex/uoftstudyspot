"use strict"

var Promise = require('promise');
var cheerio = require('cheerio');
var moment = require('moment');
require('moment-round');
var url = require('url');
const csvParse = require('csv-parse');
const csvTransform = require('stream-transform');
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
      method: 'POST',
      uri: "http://registrar.utm.utoronto.ca/booking/Bookresources.pl",
      json: false,
      form: {
        typeResource: "Room",
      },
    };

    let buildingCodes = [];

    let promise = new Promise(function (resolve, reject) {
      request(options).then(function (response) {
        let $ = cheerio.load(response);
        let buildingCodes = [];

        $("#BuildingR").children().each(function (i, elem) {
          let code = $(this).attr('value');
          let name = $(this).text().trim();
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
      method: 'POST',
      uri: "http://registrar.utm.utoronto.ca/booking/Bookresources.pl",
      json: false,
      form: {
        typeResource: "Room",
        BuildingR: buildingCode
      },
    };

    let rooms = [];

    let promise = new Promise(function (resolve, reject) {
      request(options).then(function (response) {
        let $ = cheerio.load(response);
        let rooms = [];

        $("#room_group").children().each(function (i, elem) {
          rooms[i] = { id: $(this).attr('value').split(" ").slice(1).join(" ").trim(), name: $(this).text().trim() };
        });

        resolve(rooms.slice(1)); //remove the first option, the null value
      }).catch(function (err) {
        reject(err);
      });
    });

    return promise;
  },

  getWeekSchedule: function (dayOfWeek) {
    let startDate = dayOfWeek.clone().startOf('isoWeek'); //use the same day for every day in the week, for caching purposes

    const options = {
      method: 'POST',
      uri: "http://registrar.utm.utoronto.ca/booking/allbookings.pl",
      json: false,
      form: {
        BuildReport: "All",
        dateRepFrom: startDate.format("MM/DD/YYYY"),
        //dateRepTo: startDate.clone().add(2, "days").format("MM/DD/YYYY"),
        dateRepTo: startDate.clone().add(6, "days").format("MM/DD/YYYY"),
      }
    };

    let sched = [];

    let promise = new Promise(function (resolve, reject) {
      request(options).then(function (response) {
        let $ = cheerio.load(response);
        let csvLocation = url.resolve(options.uri, $("a[href^=fetch]").attr("href"))

        let parser = new csvParse({
          skip_empty_lines: true,
          columns: true,
        });

        parser.on('readable', function () {
          let record;
          let event;
          let timesToInsert;

          while (record = parser.read()) {
            event = {
              buildingCode: record.Room.split(" ")[0],
              roomNumber: record.Room.split(" ")[1],
              name: record["Event Title"],
              time: moment(record.Date + " " + record["Start Time"], "MMM DD, YYYY hh:mm a").minutes(0)
            };

            timesToInsert = Math.ceil(parseFloat(record.Duration.split(" ")[0])); //sometimes duration is decimal (eg. 1.5 hrs). We round up.
            for (let i = 0; i < timesToInsert; i++) {
              sched.push(event),
                event = Object.assign({}, event);
              event.time = event.time.clone(); //"deep" copy for i>1 inserts
              event.time.add(1, "hour");
            }
          }
        });

        parser.on('end', function () {
          resolve(sched);
        });

        //start the parser
        request(csvLocation).pipe(parser);
      }).catch(function (err) {
        reject(err);
      });
    });

    return promise;
  }
};
