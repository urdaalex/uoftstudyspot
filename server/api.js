"use strict"

var Promise = require('promise');
var express = require('express');
var moment = require('moment');
require('moment-round');
var ace = require('./ace-api.js'); //utsg scraper
var orbs = require('./orbs-api.js'); //utm scraper

var router = express.Router();

router.get('/ping', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.json("ok");
});

router.get('/buildings', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let campus = undefined;
  if (req.query.campus != undefined) {
    campus = req.query.campus.toUpperCase();
  } else {
    campus = "UTSG";
  }

  let campusSource = undefined;
  
  switch (campus) {
    case "UTM":
      campusSource = orbs;
      break;
    case "UTSG":
      campusSource = ace;
      break;
  }
  
  campusSource.getBuildingCodes().then(function (v) {
    res.json(v);
  }).catch(function (err) {
    res.json("error");
    console.log(err);
  });

});

router.get('/buildings/:code/rooms', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let campus = undefined;
  if (req.query.campus != undefined) {
    campus = req.query.campus.toUpperCase();
  } else {
    campus = "UTSG";
  }

  let campusSource = undefined;

  switch (campus) {
    case "UTM":
      campusSource = orbs;
      break;
    case "UTSG":
      campusSource = ace;
      break;
  }

  campusSource.getRooms(req.params.code).then(function (v) {
    res.json(v);
  }).catch(function (err) {
    res.json("error");
    console.log(err);
  });
});

router.get('/optimize', function (req, res, next) {
  let time = undefined;
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  let campus = undefined;
  if (req.query.campus != undefined) {
    campus = req.query.campus.toUpperCase();
  } else {
    campus = "UTSG";
  }

  let campusSource = undefined;

  switch (campus) {
    case "UTM":
      campusSource = orbs;
      break;
    case "UTSG":
      campusSource = ace;
      break;
  }

  if (req.query.time != undefined) {
    time = moment(req.query.time, "YYYY-MM-DD::HH")
  } else {
    time = moment();
  }
  campusSource.orderRooms(req.query.code, time).then(function (v) {
    res.json(v);
  }).catch(function (err) {
    res.json("error");
    console.log(err);
  });
});


module.exports = router;
