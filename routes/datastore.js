"use strict"

var hash = require('string-hash');
var jsonfile = require('jsonfile');
var basePath = "./webcache/";

module.exports={
	set: function(key, obj){
		jsonfile.writeFileSync(basePath + hash(key), obj);
	},
	get: function(key){
		try{
			return jsonfile.readFileSync(basePath + hash(key));
		}
		catch(err){
			return null;
		}
	}

};
