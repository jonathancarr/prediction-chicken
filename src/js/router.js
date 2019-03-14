var express = require('express');

var chicken = require('./predictionChicken')()

var router = express.Router();
var route = function(nav){

	//Redirect '/' path to '/week'
	router.route('/').get(function(req, res){
		res.redirect('/super');
	});

	return router
}

module.exports = route;
