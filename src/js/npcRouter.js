var express = require('express');
var chicken = require('./predictionChicken')()

//Navbar for header
var nav = [{
		Link: '/npc/week',
		Text: 'Match Predictions'
	},
	{
		Text: 'Team Ratings',
		Dropdown: [{
			Text: 'Championship',
			Link: '/npc/champ'
		},
		{
			Text: 'Premiership',
			Link: '/npc/prem'
		}]
	},
	{
		Text: 'Statistics',
		Link: '/npc/stats'
	}
];

var router = express.Router();
var route = function(){

	//Redirect '/' path to '/week'
	router.route('/').get(function(req, res){
		res.redirect('/npc/week');
	});

	//Render team ratings page when '/champ'
	router.route('/champ').get(function(req, res){
		chicken.getTeams({tournament: "NPC", conference: "Championship"}, function(teams){
			res.render('teamsView', {
				title: 'Championship',
				nav: nav,
				teams: teams
			});
		});
	});

	//Render team ratings page when '/prem'
	router.route('/prem').get(function(req, res){
		chicken.getTeams({tournament: "NPC", conference: "Premiership"}, function(teams){
			res.render('teamsView', {
				title: 'Premiership',
				nav: nav,
				teams: teams
			});
		});
	});


	router.route('/stats').get(function(req, res){
		chicken.getStats({year: 2018, tournament: "NPC"}, function(stats){
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
		res.redirect('/npc/week/' + week);
	});

	//Render weekly games page for given week
	router.route('/week/:id').get(function(req, res){
		var week = parseInt(req.params.id);
		chicken.getGames({week: week, year: 2018, tournament: "NPC"}, function(games){
			res.render('weekView', {
				title: 'Week ' + week,
				week: week,
				weeks: 11,
				playoffs: [{week: 10, label: "Semi Finals"}, {week: 11, label: "Finals"}],
				games: games,
				nav: nav
			});
		});

	});

	return router
}

module.exports = route;
