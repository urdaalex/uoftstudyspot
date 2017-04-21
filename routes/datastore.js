"use strict"

var jsonfile = require('jsonfile');
var basePath = "./webcache/";

module.exports={
	set: function(key, obj){
		jsonfile.writeFile(basePath + key, obj);
	},
	get: function(obj){
		
	}

};
