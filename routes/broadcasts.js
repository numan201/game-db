const express = require('express');
const router = express.Router();
const axios = require('axios');

let num_top_games = 100;

// get top 20 games
let options = { method: 'GET',
    qs: { first: num_top_games },
    headers:
        {
            'Client-ID': 'yqjk0ha999ss01nnisfcac3734ig7t' } };

let topGamesJson = null;

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
            let names = [];
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


module.exports = router;
