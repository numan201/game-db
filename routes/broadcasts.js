var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require("fs");
const axios = require('axios');


var num_top_games = 20;

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
            var gamesList = [];
            response.data.data.forEach((game) => {
                console.log(game.name);
                req.app.locals.db.collection('games').find({name: game.name}).toArray((err, games) => {
                    console.log(games.length + " " + gamesList.length);
                   gamesList = gamesList.concat(games);
            });
        });
            res.render('games', { title: 'Games', games: gamesList });
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