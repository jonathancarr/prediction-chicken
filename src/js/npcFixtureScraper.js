var scraper = require('table-scraper');
// var moment = require('moment');

//Start the scraping process on the first URL
var scrapeFixtures = function(resultsUrls, allTeams, callback){
	scrapeResults(resultsUrls, 0, [], allTeams, callback);
}

//Scrape fixtures from a URL then call on the next. Calls callback if there are no more URLs.
var scrapeResults = function(resultsUrls, i, fixtures, allTeams, callback){
	console.log("... Gathering results from " + resultsUrls[i].Url)
	scraper.get(resultsUrls[i].Url).then(function(tableData) {
		var year = resultsUrls[i].Year;
		var week = 1;
		for(var t = 0; t < tableData.length; t++ ){
			for(var row = 1; row < tableData[t].length; row++){
				var game = tableData[t][row];
				// console.log(game)
				if(game.Date.startsWith("Week")){
					week = parseInt(game.Date.split(" ")[1]);
					continue;
				}else if(game.Date.startsWith("Semi")){
					week = 10;
					continue;
				}else if(game.Date.startsWith("Finals")){
					week = 11;
					continue;
				}
				//Split home and away teams from 'Home v Away'
				var teams = game.Game;
				var home = teams.split(" v ")[0];
				var away = teams.split(" v ")[1];
				//Game rows can start with "FINAL: "
				if(home.indexOf(":") !== -1) home = home.split(": ")[1]
				//Game rows can end with " (RS)"
				away = away.split(" (")[0];
				home = getTeamName(home, allTeams);
				away = getTeamName(away, allTeams);

				var time = game["Time (NZ)"];
				if(time == "") time = "7:35pm";
				var hour = parseInt(time.split(":")[0]);
				var min = parseInt(time.split(":")[1].split(" ")[0])

				var venue = game.Venue;

				var scores = game.Result;
				var homeScore = parseInt(scores.split("-")[0]);
				var awayScore = parseInt(scores.split("-")[1]);

				var date = game.Date;
				var day = date.split(" ")[0];
				var month = getMonth(date.split(" ")[1])

				fixtures.push({
					day: day,
					month: month,
					year: year,
					week: week,
					time: time,
					hour: hour,
					home: home,
					away: away,
					homeScore: homeScore,
					awayScore: awayScore,
					venue: venue,
					tournament: "NPC"
				});
			}
		}
		if(i < resultsUrls.length - 1){
			scrapeResults(resultsUrls, i + 1, fixtures, allTeams, callback);
		}else{
			callback(fixtures, allTeams);
		}
	});
}

var week = 0;


function getTeamName(team, allTeams){
	for(var i = 0; i < allTeams.length; i++){
		if(team == allTeams[i].team){
			return allTeams[i].team;
		}
		for(var j = 0; j < allTeams[i].alias.length; j++){
			if(team == allTeams[i].alias[j]){
				return allTeams[i].team;
			}
		}
	}
	console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
	console.log("Unknown Team: " + team)
	console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
	return null;
}

//R rn int value for given month string.
var getMonth = function(month){
	if(month == "Mat"){
		return 3;
	}
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	for(var i = 0; i < months.length; i++){
		if(month.startsWith(months[i])){
			return i + 1;
		}
	}
	return 0;
}

module.exports = scrapeFixtures;
