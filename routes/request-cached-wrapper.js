"use strict"

var request = require('request-promise');
var moment = require('moment');
var Promise = require('promise');
var datastore = require('./datastore.js');

module.exports=function(opts){
	let lookup = datastore.get(opts.uri); //lookup if we have a cached entry

	if(lookup && moment(lookup.timestamp).add(3, 'days').isAfter()){
		console.log("cache hit: ", opts.uri);
		return new Promise(function(resolve, reject){
			delete lookup.timestamp;
			resolve(lookup.response);
		});
	}else{
		let req = request(opts);
		console.log("cache miss: ", opts.uri);
		
		//cache the response
		req.then(function(response){
			let storageObj = {timestamp: moment().valueOf(), response: response};
			datastore.set(opts.uri, storageObj);
		});

		return req;
	}
};
