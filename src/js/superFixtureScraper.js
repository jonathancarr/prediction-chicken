var scraper = require('table-scraper');

//Start the scraping process on the first URL
var scrapeSuperFixtures = function(fixturesUrl, resultsUrls, allTeams, callback){
	scrapeResults(resultsUrls, 0, [], allTeams, callback, fixturesUrl);
}

//Scrape fixtures from a URL then call on the next. Calls callback if there are no more URLs.
var scrapeResults = function(resultsUrls, i, fixtures, allTeams, callback, fixturesUrl){
	console.log("... Gathering results from " + resultsUrls[i].Url)
	scraper.get(resultsUrls[i].Url, "next").then(function(tableData) {
		for(var t = 0; t < tableData.length; t++ ){
			for(var row = 1; row < tableData[t].length; row++){
				if(tableData[t][row][0] == "Bye" || tableData[t][row][0] == "Bye :" || tableData[t][row][0] == "Not playing"){
					continue;
				}
				var home = tableData[t][row][0].trim();
				home = getTeamName(home, allTeams);
				var homeScore = tableData[t][row][1].trim();
				if(homeScore == "." || homeScore == "" || homeScore == " "){
					homeScore = 0;
				}
				if(homeScore != "-"){
					homeScore = parseInt(homeScore);
				}
				var away = tableData[t][row][3].trim();
				away = getTeamName(away, allTeams);
				var awayScore = tableData[t][row][4].trim();
				if(awayScore == "." || awayScore == "" || awayScore == " "){
					awayScore = 0;
				}
				if(awayScore != "-"){
					awayScore = parseInt(awayScore);
				}
				var date = tableData[t][row][5].trim();
				var dateSplit = date.split("/");
				var day = parseInt(dateSplit[0]);
				var month = parseInt(dateSplit[1]);
				var year = parseInt("20" + dateSplit[2]);
				var week = 0;
				var venue = "unknown";
				var time = 0;
				var hour = 0;
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
					tournament: "super"
				});
			}
		}
		if(i < resultsUrls.length - 1){
			scrapeResults(resultsUrls, i + 1, fixtures, allTeams, callback, fixturesUrl);
		}else{
			scrapeFixture(fixturesUrl, fixtures, allTeams, callback);
		}
	});
}

var week = 0;

function scrapeFixture(fixturesUrl, fixtures, allTeams, callback){
	console.log("... Gathering fixtures from " + fixturesUrl)
	scraper.get(fixturesUrl).then(function(tableData) {
		console.log(JSON.stringify(tableData, null, 2))
		for(var i = 0; i < tableData[0].length; i++){
			if(tableData[0][i][0].startsWith("ROUND")){
				week = parseInt(tableData[0][i][0].split(" ")[1]);
				console.log("Week " + week)
				continue;
			}
			if(tableData[0][i][0].startsWith("Super Rugby Qualifiers")){
				week = 20;
				console.log('WEEK', week)
				continue;
			}

			if(tableData[0][i][0].startsWith("Super Rugby Semi Finals")){
				week = 21;
				console.log('WEEK', week)
				continue;
			}
			if(tableData[0][i][0].startsWith("Super Rugby Final")){
				week = 22;
				console.log('WEEK', week)
				continue;
			}
			if(tableData[0][i][0].startsWith("Day & Date") || tableData[0][i][0].startsWith("Bye")){
				continue;
			}

			var home = tableData[0][i][1];
			home = getTeamName(home, allTeams);
			var away = tableData[0][i][2];
			away = getTeamName(away, allTeams);
			var venue = tableData[0][i][3];
			console.log(tableData[0][i])
			venue = venue.replace("\n", " ");
			var homeScore = 0;
			var awayScore = 0;
			if(week < 20){
				var date = tableData[0][i][0];
				var datesplit = date.split(" ");
				var dayop
				var day = parseInt(datesplit[1])
				var month = getMonth(datesplit[2])
				var year = 2019;
				var datetime = tableData[0][i][6];
				var datetimesplit = datetime.split(" ")
				if(datetimesplit.length > 2){
					var day = parseInt(datetimesplit[1])
					console.log(datetimesplit)
					var month = getMonth(datetimesplit[2])
					var time = datetimesplit[3];
					var timesplit = time.split(":");
					var hour = parseInt(timesplit[0]);
				}else{
					var time = datetimesplit[0];
					var timesplit = time.split(":");
					var hour = parseInt(timesplit[0]);
				}
			}else{
				var day = parseInt(tableData[0][i][0].split(" ")[1])
				var month = getMonth(tableData[0][i][0].split(" ")[2])
			}
			if(week == 20){
				console.log(day + " " + month + " " + year + " " + time + " " + hour)
			}
			var loaded = false;
			// console.log(datetime + ";" + home + ";vs;" + away + ";" + venue)
			for(var j = 0; j < fixtures.length; j++){
				//Warning: The following line is a disgusting hack
				if(fixtures[j].year == year && fixtures[j].home == home && fixtures[j].away == away && (fixtures[j].day == 31 || fixtures[j].home == "Sharks" || fixtures[j].home == "Jaguares" || fixtures[j].month == month)){

					loaded = true;
					fixtures[j].month = month;
					fixtures[j].day = day;
					fixtures[j].venue = venue;
					fixtures[j].time = time;
					fixtures[j].hour = hour;
					fixtures[j].week = week;
				}
			}
			if(!loaded){
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
					tournament: "super"
				});
			}
		}
		console.log(fixtures)
		callback(fixtures, allTeams);
	});
}

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
	console.log(month)
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

module.exports = scrapeSuperFixtures;
