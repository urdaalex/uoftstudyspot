"use strict"

var Promise = require('promise');
var express = require('express');
var moment = require('moment');
require('moment-round');
var ace = require('./ace-api.js');

var router = express.Router();



router.get('/buildings', function(req, res, next) {
	ace.getBuildingCodes().then(function(v){
		 res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	  	res.json(v);
	}).catch(function(err){
		res.json("error");
		console.log(err);
	});
});

router.get('/buildings/:code/rooms', function(req, res, next) {
	ace.getRooms(req.params.code).then(function(v){
	  	res.json(v);
	}).catch(function(err){
		res.json("error");
		console.log(err);
	});
});

router.get('/optimize', function(req, res, next) {
	let time = undefined; 
			 res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	if(req.query.time != undefined){
		time = moment(req.query.time, "YYYY-MM-DD::HH")
	}else{
		time = moment();
	}
	ace.orderRooms(req.query.code, time).then(function(v){
	  	res.json(v);
	}).catch(function(err){
		res.json("error");
		console.log(err);
	});
});
 

module.exports = router;
