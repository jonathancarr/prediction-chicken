var dbManager = require('./dbManager')();
var calendar = require('node-calendar');
var scrapeFixtures = require('./fixtureScraper');

var nextWeek = -1;

//Query database and return list of games
var getTeams = function(query, callback){
	dbManager.getTeams({}, function(teams){
		//Sort based on rating
		teams.sort(function(a, b) {
			return (+b.rating || 0) - (+a.rating || 0);
		});
		//Split teams into prem and champ
		var n = [];
		var a = [];
		var s = [];
		for(var i = 0; i < teams.length; i++){
			if(teams[i].conference === 'New Zealand'){
				n.push(teams[i]);
			}else if(teams[i].conference === 'Australia'){
				a.push(teams[i]);
			}else if(teams[i].conference === 'South Africa'){
				s.push(teams[i]);
			}
		}
		//Assign rankings
		var nz = [];
		var aus = [];
		var sa = [];
		for(var i = 0; i < n.length; i++){
			nz.push({
				team: n[i].team,
				rating: n[i].rating,
				ranking: i+1,
				colour: n[i].colour,
				history: n[i].weeklyRatings
			});
		}
		for(var i = 0; i < a.length; i++){
			aus.push({
				team: a[i].team,
				rating: a[i].rating,
				ranking: i+1,
				colour: a[i].colour,
				history: a[i].weeklyRatings
			});
		}
		for(var i = 0; i < s.length; i++){
			sa.push({
				team: s[i].team,
				rating: s[i].rating,
				ranking: i+1,
				colour: s[i].colour,
				history: s[i].weeklyRatings
			});
		}
		callback([nz, aus, sa])
	});
}

//Query database and return a list of games
var getGames = function(query, callback){
	dbManager.getGames(query, function(results){
		console.log(results);

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
		for(var i = 1; i <= 19; i++){
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
		if(numGames == 0){
			callback(
				{
					win: 0,
					margin: 0,
					graph: graph
				}
			)
		}else{
			callback({
				win: Math.round(gamesCorrect/numGames*100 * 10)/10,
				margin: Math.round(marginDiff/numGames*10)/10,
				graph: graph
			});
		}
	});
}

var getNextWeek = function(){
	return currWeek;
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

function getCountry(team, teams){
	for(var i = 0; i < teams.length; i++){
		if(team == teams[i].team){
			return teams[i].country;
		}
	}
}

var getNextWeek = function(){
	return nextWeek;
}

//Predict and update margins for future games
var predictMargins = function(fixtures, teams){



	console.log("... Calculating team ratings");
	//Reset all ratings
	var ratings = {};
	var ratingHistory = {};
	for(var i = 0; i < teams.length; i++){
		ratings[teams[i].team] = 1000;
		ratingHistory[teams[i].team] = [];
	}



	//Sort fixtures by date
	fixtures.sort(function(a, b) {
		return (+a.year*365 + a.month*31 + a.day || 0) - (+b.year*365 + b.month*31 + b.day || 0);
	});

	//Values for determining rating changes. These were one calculated by running simulations
	var ratingPerPoint = 25;
	var ratingChangePerPoint = 1.2;
	var homeAdvantage = 3.5;
	var diffCountry = 1;

	// console.log("... Predicting match outcomes");
	for(var i = 0; i < fixtures.length; i++){
		var game = fixtures[i];
		//Predict outcome based on difference in ratings
		var diff = ratings[game.home] - ratings[game.away];
		var prediction = ((diff / ratingPerPoint) + homeAdvantage);
		if(getCountry(game.away, teams) != getCountry(game.home, teams)){
			prediction += diffCountry;
		}
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
			currWeek = game.week;

			var actualMargin = game.homeScore - game.awayScore;
			var ratingChange = ratingChangePerPoint * (actualMargin - prediction);
			ratings[game.home] = ratings[game.home] + ratingChange;
			ratings[game.away] = ratings[game.away] - ratingChange;
			if(game.year != 2018){
				ratingHistory[game.home][0] = ratings[game.home];
				ratingHistory[game.away][0] = ratings[game.away];
			}else{
				ratingHistory[game.home][game.week] = ratings[game.home];
				ratingHistory[game.away][game.week] = ratings[game.away];
			}
		}else{
			console.log("No results yet! " + game.week)
			if(nextWeek == -1){
				console.log(game.week)
				nextWeek = game.week;
			}
		}
	}
	//Round ratings
	for(var i = 0; i < teams.length; i++){
		teams[i].rating = Math.round(ratings[teams[i].team]);
		var weeklyRating = [];
		for(var j = 0; j < ratingHistory[teams[i].team].length; j++){
			if(!(ratingHistory[teams[i].team][j])){
				weeklyRating.push(weeklyRating[weeklyRating.length-1]);
			}else{
				weeklyRating.push(Math.round(ratingHistory[teams[i].team][j]));
			}
		}
		teams[i].weeklyRatings = weeklyRating;
	}

	//Update ratings and predictions
	dbManager.updateTeams(teams);
	dbManager.updateGames(fixtures);
}

//Update the chicken. Scrape results then predict marings.
var update = function(){
	console.log("Updating Chicken:")
	dbManager.getTeams({}, function(teams){
		var fixturesUrl = "http://www.superxv.com/fixtures/";
		var resultsUrls = [
			{Url: 'http://www.superxv.com/results/2018-super-rugby-results/'},
			{Url: 'http://www.superxv.com/results/2017-super-rugby-results/'},
			{Url: 'http://www.superxv.com/results/2016-super-rugby-results/'},
			{Url: 'http://www.superxv.com/results/2015-super-rugby-results/'},
			{Url: 'http://www.superxv.com/results/2014-super-rugby-results/'},
			{Url: 'http://www.superxv.com/results/2013-super-rugby-results/'},
		];
		scrapeFixtures(fixturesUrl, resultsUrls, teams, predictMargins);
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
	chicken.getNextWeek = getNextWeek;
	return chicken;
}
module.exports = getPredictionChicken;
