var express = require('express');

var chicken = require('./predictionChicken')()

var router = express.Router();
var route = function(nav){

	//Redirect '/' path to '/week'
	router.route('/').get(function(req, res){
		res.redirect('/week');
	});

	//Render team ratings page when '/route'
	router.route('/ratings').get(function(req, res){
		chicken.getTeams({}, function(teams){
			res.render('ratingsView', {
				title: 'Team Ratings',
				nav: nav,
				prem: teams[0],
				cham: teams[1]
			});
		});
	});

	//Render team ratings page when '/premiership'
	router.route('/premiership').get(function(req, res){
		chicken.getTeams({}, function(teams){
			console.log(teams[0][0].colour);
			res.render('premView', {
				title: 'Team Ratings',
				nav: nav,
				prem: teams[0],
				datasets: [{
		      label: "Cantebury",
		      data: [1000, 1200, 1200, 1100, 1200, 1500, 1200, 1200, 1040],
		      fill: false,
		      backgroundColor : '#c11111',
		      pointBackgroundColor: '#c11111',
		      pointHoverBackgroundColor: '#c11111',
		      borderColor: '#c11111',
		      pointBorderColor: '#c11111',
		      pointHoverBorderColor: '#c11111'
		    },
		    {
		      label: "Taranaki",
		      data: [1000, 1100, 1100, 1500, 1200, 1100, 1250, 1200, 1140],
		      fill: false,
		      backgroundColor : '#f2ea09',
		      pointBackgroundColor: '#f2ea09',
		      pointHoverBackgroundColor: '#f2ea09',
		      borderColor: '#f2ea09',
		      pointBorderColor: '#f2ea09',
		      pointHoverBorderColor: '#f2ea09',
		      backgroundColor: "#f2ea09"
		    }]
			});
			var jsdom = require('jsdom');
		});
	});

	//Render team ratings page when '/championship'
	router.route('/championship').get(function(req, res){
		chicken.getTeams({}, function(teams){
			res.render('champView', {
				title: 'Team Ratings',
				nav: nav,
				cham: teams[1]
			});
		});
	});

	router.route('/stats').get(function(req, res){
		chicken.getStats({year: 2017}, function(stats){
			res.render('statsView', {
				title: 'Statistics',
				nav: nav,
				win: stats.win,
				margin: stats.margin,
				graph: stats.graph
			});
		});

	});

	//Redirect /week to current week
	router.route('/week').get(function(req, res){
		week = getCurWeek();
		res.redirect('/week/' + week);
	});

	//Render weekly games page for given week
	router.route('/week/:id').get(function(req, res){
		var week = parseInt(req.params.id);
		chicken.getGames({week: week, year: 2017}, function(games){
			res.render('weekView', {
				title: 'Week ' + week,
				week: week,
				weeks: 10,
				games: games,
				nav: nav
			});
		});

	});

	return router
}

//Get number corresponding to the current week in the Mitre 10 Cup 2017
var getCurWeek = function(){
	var date = new Date();
	var day = date.getDate();
	var month = date.getMonth() + 1;
	if(month < 8){return 1;}
	if(month == 8){
		if(day <= 20){ return 1;}
		if(day <= 27){ return 2;}
		return 3;
	}else if(month == 9){
		if(day <= 3){return 3;}
		if(day <= 10){return 4;}
		if(day <= 17){return 5;}
		if(day <= 24){return 6;}
		return 7;
	}else if(month == 10){
		if(day <= 1){return 7;}
		if(day <= 8){return 8;}
		if(day <= 15){return 9;}
	}
	return 9;
}

module.exports = route;
