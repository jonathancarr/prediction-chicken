var scraper = require('table-scraper');

//Start the scraping process on the first URL
var scrapeFixtures = function(fixturesUrls, allTeams, callback){
	scrapeFixture(fixturesUrls, 0, [], allTeams, callback);
}

//Scrape fixtures from a URL then call on the next. Calls callback if there are no more URLs.
var scrapeFixture = function(fixturesUrls, i, fixtures, allTeams, callback){
	console.log("... Gathering results from " + fixturesUrls[i].Url)
	scraper.get(fixturesUrls[i].Url, "next").then(function(tableData) {
		var year = fixturesUrls[i].Year;
		for(var j = 0; j < tableData.length; j++){
			var gameTable = tableData[j];
			var week = 0;
			for(var k = 0; k < gameTable.length; k++){
				if(gameTable[k].Date.startsWith("Week") || gameTable[k].Date.startsWith("Semi Finals") || gameTable[k].Date.startsWith("Finals") || gameTable[k].Date.startsWith("2015 ITM")){
					if(gameTable[k].Date === "Week 10 - Semi"){
						week = 10;
					}else if(gameTable[k].Date === "Week 11 - Final"){
						week = 11;
					}else{
						week = parseInt(gameTable[k].Date.charAt(gameTable[k].Date.length - 1));
					}
				}else{
					var day = gameTable[k].Date.substring(0,2);
					var month = getMonth(gameTable[k].Date.substring(3));
					var teams = gameTable[k].Game.split(" v ");
					if(teams[0].startsWith("Prem") || teams[0].startsWith("Cham") | teams[0].startsWith("Final")){
						teams[0] = teams[0].split(" - ")[1];
					}
					var home = teams[0].split(" (RS)")[0];
					if(typeof teams[1] != 'undefined'){
						var away = teams[1].split(" (RS)")[0];
					}
					if(home === "Counties Man"){
						home = "Counties Manukau";
					}
					if(away === "Counties Man"){
						away = "Counties Manukau";
					}
					if(home === "Hawke's Bay"){
						home = "Hawke’s Bay";
					}
					if(away === "Hawke's Bay"){
						away = "Hawke’s Bay";
					}
					if(away === "North harbour"){
						away = "North Harbour";
					}
					if(home === "CHAMPIONSHIP FINAL: Wellington"){
						home = "Wellington"
					}
					if(home === "PREMIERSHIP FINAL: Canterbury"){
						home = "Canterbury"
					}
					var venueArray = gameTable[k].Venue.split(", ");
					if(venueArray.length == 1){
						var venue = gameTable[k].Venue;
					}else{
						var venue = venueArray[venueArray.length-1];
					}
					var time = gameTable[k]['Time (NZ)'];
					var hour = time.split(":")[0];
					var result = gameTable[k].Result.split("-");
					var homeScore = result[0];
					var awayScore = result[1];
					if(!home.startsWith("Mitre")){
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
							venue: venue
						});
					}
				}
			}
		}
		if(i < fixturesUrls.length - 1){
			scrapeFixture(fixturesUrls, i + 1, fixtures, allTeams, callback);
		}else{
			callback(fixtures, allTeams);
		}

	});
}

//Return int value for given month string.
var getMonth = function(month){
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	for(var i = 0; i < months.length; i++){
		if(month === months[i]){
			return i + 1;
		}
	}
	return 0;
}

module.exports = scrapeFixtures;
