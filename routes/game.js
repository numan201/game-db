const {twitchKey} =  require("../keys");
var express = require('express');
var router = express.Router();
var youtubeApiV3Search = require("youtube-api-v3-search");
const axios = require('axios');
const { youtubeKey } = require('../keys');

var youtubeApiV3Search = require("youtube-api-v3-search");

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);
    let username;

    req.app.locals.db.collection('games').findOne({_id : id}, (err, game) => {
        req.app.locals.db.collection('developers').
            aggregate([{$unwind: "$games"}, {$match: { "games.id" : game.id}}, {$project: {"name": 1}}]).toArray((err, developers) => {
                req.app.locals.db.collection('publishers').
                    aggregate([{$unwind: "$games"}, {$match: { "games.id" : game.id}}, {$project: {"name": 1}}]).toArray((err, publishers) => {

                    axios({ //request number 1. get game id.
                        method: 'get',
                        url: "https://api.twitch.tv/helix/games",
                        params: {
                            name: game.name
                        },
                        headers: {
                            'Client-ID': twitchKey
                        }
                    })
                        .then(function (response) {
                           let game_id = response.data.data[0].id;
                            console.log("RESPOOOOOOONSE: " + JSON.stringify(game_id)); // JSON.stringify(response.data)


                            axios({ //request 2. get top streamer from game id.
                                method: 'get',
                                url: "https://api.twitch.tv/helix/streams",
                                params: {
                                    game_id: game_id,
                                    first: 1 //only top stream
                                },
                                headers: {
                                    'Client-ID': twitchKey
                                }
                            })
                                .then(function (response) {
                                    let resp = response.data.data;
                                    username = resp[0]["user_name"];
                                    console.log("RESPOOOOOOONSE: " + JSON.stringify(username)); // JSON.stringify(response.data)

                                })
                                .catch(function (error) {
                                    console.log(error);
                                })
                                .then(function (response) {
                                    // always executed
                                });
                        })
                        .catch(function (error) {
                            console.log(error);
                        })
                        .then(function (response) {
                            // always executed
                        });
                    // Reviews counts
                        let reviewsCounts = [0, 0, 0, 0, 0];
                        game.ratings.forEach((rating) => {
                            reviewsCounts[rating.id - 1] = rating.count;
                        });
                        reviewsCounts.reverse();

                        options = {
                            q:game.name,
                            part:'snippet',
                            type:'video'
                        };
                        let result = youtubeApiV3Search(youtubeKey, options, (err, response) => {
                            let videos = [];
                            //console.log(response);
                            response.items.forEach((item) =>{
                                videos.push(item.id.videoId);
                            })
                            res.render('game', {username: username, title: game.name, game: game, developers: developers, publishers: publishers, reviewsCounts: JSON.stringify(reviewsCounts), videos: videos});
                        });

                });
        });
    });

});


module.exports = router;
