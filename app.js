var express = require('express');
var app = express();

var chicken = require('./src/js/predictionChicken')();

var port = process.env.PORT || 8080;


var teams = require('./src/json/teams.json');

var router = require('./src/js/router')();
var npcRouter = require('./src/js/npcRouter')();
var superRouter = require('./src/js/superRouter')();

//Setup express server and listen on port
app.use(express.static('public'));
app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use('/super', superRouter);
app.use('/npc', npcRouter);
app.use('/', router);

app.listen(port, function(err){
	console.log('running server on port ' + port);
});

var updateTimer = 300000
//scrape web for results and update chicken every 10,000ms
var updateChicken = function(){
	chicken.update();
	setTimeout(function(){
		updateChicken();
	}, updateTimer)
}

//Load teams into chicken instance, then call updateChicken
chicken.loadTeams(teams, updateChicken);
