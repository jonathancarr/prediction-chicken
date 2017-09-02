var dbManager = require('./dbManager')();
var calendar = require('node-calendar');
var scrapeFixtures = require('./fixtureScraper');

//Query database and return list of games
var getTeams = function(query, callback){
	dbManager.getTeams({}, function(teams){
		//Sort based on rating
		teams.sort(function(a, b) {
			return (+b.rating || 0) - (+a.rating || 0);
		});
		//Split teams into prem and champ
		var p = [];
		var c = [];
		for(var i = 0; i < teams.length; i++){
			if(teams[i].conference === 'Premiership'){
				p.push(teams[i]);
			}else{
				c.push(teams[i]);
			}
		}
		//Assign rankings
		var prem = [];
		var champ = [];
		for(var i = 0; i < p.length; i++){
			prem.push({
				team: p[i].team,
				rating: p[i].rating,
				ranking: i+1
			});
		}
		for(var i = 0; i < c.length; i++){
			champ.push({
				team: c[i].team,
				rating: c[i].rating,
				ranking: i+1
			});
		}
		callback([prem, champ])
	});
}

//Query database and return a list of games
var getGames = function(query, callback){
	dbManager.getGames(query, function(results){
		//Sort based on date/time
		results.sort(function(a, b) {
			return (+a.year*365 + a.month*31 + a.day + a.hour/24.0|| 0) - (+b.year*365 + b.month*31 + b.day + b.hour/24 || 0);
		});
		games = [];
		for(var i = 0; i < results.length; i++){
			var r = results[i];
			var day = getDayString(calendar.weekday(r.year, r.month, r.day));
			var mon = getMonthString(r.month);
			games.push({
				home: r.home,
				away: r.away,
				time: r.time,
				date: day + " " + r.day + " " + mon,
				venue: r.venue,
				homeScore: r.homeScore,
				awayScore: r.awayScore,
				prediction: r.prediction,
				predictTeam: r.predictTeam,
				predictMargin: r.predictScore
			});
		}
		callback(games);
	});
}

var getStats = function(query, callback){
	var weeklyCorrect = {};
	var weeklyTotal = {};
	dbManager.getGames(query, function(games){
		var numGames = 0;
		var gamesCorrect = 0;
		var marginDiff = 0;
		for(var i = 0; i < games.length; i++){
			if(weeklyCorrect[games[i].week] == null){
				weeklyCorrect[games[i].week] = 0;
			}
			if(weeklyTotal[games[i].week] == null){
				weeklyTotal[games[i].week] = 0;
			}
			if(games[i].homeScore != 0 || games[i].awayScore != 0){
				weeklyTotal[games[i].week] = weeklyTotal[games[i].week] + 1;
				numGames++;
				if(parseFloat(games[i].prediction)>0){
					if(parseInt(games[i].homeScore) > parseInt(games[i].awayScore)){
						gamesCorrect++;
						weeklyCorrect[games[i].week] = weeklyCorrect[games[i].week] + 1;
					}
				}else{
					if(parseInt(games[i].homeScore) < parseInt(games[i].awayScore)){
						gamesCorrect++;
						weeklyCorrect[games[i].week] = weeklyCorrect[games[i].week] + 1;
					}
				}
				marginDiff += Math.abs(games[i].prediction - (games[i].homeScore - games[i].awayScore));
			}
		}
		var labels = [];
		var data = [];
		for(var i = 1; i <= 9; i++){
			labels.push('Week ' + i);
			if(weeklyCorrect[i] == 0){
					data.push(0);
			}else{
				data.push(Math.round(weeklyCorrect[i]/weeklyTotal[i]*1000)/10);
			}
		}
		var graph = {
			labels: labels,
			data:data
		}
		callback({
			win: Math.round(gamesCorrect/numGames*100 * 10)/10,
			margin: Math.round(marginDiff/numGames*10)/10,
			graph: graph
		});
	});
}

//Get string from day int value
var getDayString = function(day){
	var dayStrings = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
	return dayStrings[day];
}

//Get string from month int value
var getMonthString = function(i){
	var monthStrings = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return monthStrings[i];
}

//Load teams into database
var loadTeams = function(teams, callback){
	dbManager.updateTeams(teams, callback);
}

//Predict and update margins for future games
var predictMargins = function(fixtures, teams){

	console.log("... Calculating team ratings");
	//Reset all ratings
	var ratings = {};
	for(var i = 0; i < teams.length; i++){
		ratings[teams[i].team] = 1000;
	}

	//Sort fixtures by date
	fixtures.sort(function(a, b) {
		return (+a.year*365 + a.month*31 + a.day || 0) - (+b.year*365 + b.month*31 + b.day || 0);
	});

	//Values for determining rating changes. These were one calculated by running simulations
	var ratingPerPoint = 25;
	var ratingChangePerPoint = 2.5;
	var homeAdvantage = 2;

	console.log("... Predicting match outcomes");
	for(var i = 0; i < fixtures.length; i++){
		var game = fixtures[i];
		//Predict outcome based on difference in ratings
		var diff = ratings[game.home] - ratings[game.away];
		var prediction = ((diff / ratingPerPoint) + homeAdvantage);
		//Determine winning team and margin
		if(prediction > 0){
			var predictTeam = game.home;
		}else if(prediction < 0){
			var predictTeam = game.away;
		}else{
			var predictTeam = "Draw";
		}
		var predictScore = Math.abs(prediction);
		//Prevent predicting draws
		if(Math.round(prediction) == 0){
			predictScore = 1;
		}else{
			predictScore = Math.round(predictScore);
		}
		game.prediction = prediction;
		game.predictTeam = predictTeam;
		game.predictScore = predictScore;
		//If game has been completed, compare prediciton with outcome and change ratings.
		if(game.homeScore != 0 || game.awayScore != 0){
			var actualMargin = game.homeScore - game.awayScore;
			var ratingChange = ratingChangePerPoint * (actualMargin - prediction);
			ratings[game.home] = ratings[game.home] + ratingChange;
			ratings[game.away] = ratings[game.away] - ratingChange;

		}

	}
	//Round ratings
	for(var i = 0; i < teams.length; i++){
		teams[i].rating = Math.round(ratings[teams[i].team]);
	}
	//Update ratings and predictions
	dbManager.updateTeams(teams);
	dbManager.updateGames(fixtures);
}

//Update the chicken. Scrape results then predict marings.
var update = function(){
	console.log("Updating Chicken:")
	dbManager.getTeams({}, function(teams, fixturesUrls){
		var fixturesUrls = [
			{Url: 'http://www.mitre10cup.co.nz/Fixtures/Index/Itm2015', Year: 2015},
			{Url: 'http://www.mitre10cup.co.nz/Fixtures/Index/Mitre2016', Year: 2016 },
			{Url: 'http://www.mitre10cup.co.nz/Fixtures', Year: 2017}
		];
		scrapeFixtures(fixturesUrls, teams, predictMargins);
	});
}

var getPredictionChicken = function(){
	var chicken = new Object();
	chicken.getTeams = getTeams;
	chicken.getGames = getGames;
	chicken.update = update;
	chicken.predictMargins = predictMargins;
	chicken.loadTeams = loadTeams;
	chicken.getStats = getStats;
	return chicken;
}
module.exports = getPredictionChicken;
