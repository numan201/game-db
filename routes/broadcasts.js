var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require("fs");
const axios = require('axios');


var num_top_games = 100;

// get top 20 games
var options = { method: 'GET',
    qs: { first: num_top_games },
    headers:
        {
            'Client-ID': 'yqjk0ha999ss01nnisfcac3734ig7t' } };

var top_games_json = null;


    axios({
    method: 'get',
    url: 'https://api.twitch.tv/helix/games/top',
    params: {
        first: num_top_games
    },
    headers: {
        'Client-ID': 'yqjk0ha999ss01nnisfcac3734ig7t'
    }
})
    .catch(function(error){
        console.log(error);
    })
.then(function (response) {

    console.log(response.data);
    //top_games_json = JSON.parse(response.data);
        router.get('/', function(req, res, next) {
            var names = [];
            response.data.data.forEach((games) => {
                names.push(games.name);
            });
            console.log("names: " + names.length);
                req.app.locals.db.collection('games').find({ name: { $in: names }}).toArray((err, games) => {
                    console.log(" found. " + games.length);
                    res.render('games', { title: 'Games', games: games });
            });
        });
    });

/*request(options, function (error, response, body) {
    if (error) throw new Error(error);
    top_games_json = JSON.parse(body);
    console.log(top_games_json);
    top_games_json.data.forEach((game) => {
        console.log(game.name);
    });
});*/




/* GET games listing. */





module.exports = router;