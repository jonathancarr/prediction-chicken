var mongodb = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/predictionChicken';

//Query database for games
var getGames = function(query, func){
	mongodb.connect(url, function(err, db){
		var collection = db.collection('fixtures');
		var result = collection.find(query).toArray(function(err, results){
			func(results);
			db.close();
		});
	});
}

//Query database for teams
var getTeams = function(query, func){
	mongodb.connect(url, function(err, db){
		var collection = db.collection('teams');
		var result = collection.find(query).toArray(function(err, results){
			func(results);
			db.close();
		});
	});
}

//Update the teams within the database
var updateTeams = function(teams, callback){
	console.log("... Updating team ratings");
	mongodb.connect(url, function(err, db){
		var collection = db.collection('teams');
		collection.removeMany({}, function(){
			collection.insertMany(teams, callback);
			db.close();
		})
	});
}

//Update the games within the database
var updateGames = function(fixtures){
	console.log("... Updating predictions")
	mongodb.connect(url, function(err, db){
		var collection = db.collection('fixtures');
		collection.remove({}, function(){
			collection.insertMany(fixtures, function(){
				console.log("... Done");
				db.close();
			});
		});
	});
}


var getDbManager = function(){
	var dbManager = new Object();
	dbManager.getTeams = getTeams;
	dbManager.getGames = getGames;
	dbManager.updateTeams = updateTeams;
	dbManager.updateGames = updateGames;
	return dbManager;
}
module.exports = getDbManager;
