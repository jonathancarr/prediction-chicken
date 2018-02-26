var express = require('express');

var chicken = require('./predictionChicken')()

var router = express.Router();
var route = function(nav){

	//Redirect '/' path to '/week'
	router.route('/').get(function(req, res){
		res.redirect('/week');
	});

	//Render team ratings page when '/route'
	router.route('/teams').get(function(req, res){
		chicken.getTeams({}, function(teams){
			res.render('ratingsView', {
				title: 'Team Ratings',
				nav: nav,
				prem: teams[0],
				cham: teams[1]
			});
		});
	});

	//Render team ratings page when '/nz'
	router.route('/nz').get(function(req, res){
		chicken.getTeams({}, function(teams){
			res.render('nzView', {
				title: 'Team Ratings',
				nav: nav,
				nz: teams[0]
			});
			var jsdom = require('jsdom');
		});
	});

	//Render team ratings page when '/aus'
	router.route('/aus').get(function(req, res){
		chicken.getTeams({}, function(teams){
			res.render('ausView', {
				title: 'Team Ratings',
				nav: nav,
				aus: teams[1]
			});
			var jsdom = require('jsdom');
		});
	});

	//Render team ratings page when '/sa'
	router.route('/sa').get(function(req, res){
		chicken.getTeams({}, function(teams){
			res.render('saView', {
				title: 'Team Ratings',
				nav: nav,
				sa: teams[2]
			});
			var jsdom = require('jsdom');
		});
	});


	router.route('/stats').get(function(req, res){
		chicken.getStats({year: 2018}, function(stats){
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
		week = chicken.getNextWeek();
		res.redirect('/week/' + week);
	});

	//Render weekly games page for given week
	router.route('/week/:id').get(function(req, res){
		var week = parseInt(req.params.id);
		chicken.getGames({week: week, year: 2018}, function(games){
			res.render('weekView', {
				title: 'Week ' + week,
				week: week,
				weeks: 19,
				games: games,
				nav: nav
			});
		});

	});

	return router
}

module.exports = route;
