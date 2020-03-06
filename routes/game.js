const express = require('express');
const router = express.Router();
const axios = require('axios');
const youtubeApiV3Search = require("youtube-api-v3-search");
const { youtubeKey, twitchKey } = require('../keys');

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);
    let username;

    req.app.locals.db.collection('games').findOne({_id : id}, (err, game) => {
        req.app.locals.db.collection('developers').
            aggregate([{$unwind: "$games"}, {$match: { "games.id" : game.id}}, {$project: {"name": 1}}]).toArray((err, developers) => {
                req.app.locals.db.collection('publishers').
                    aggregate([{$unwind: "$games"}, {$match: { "games.id" : game.id}}, {$project: {"name": 1}}]).toArray((err, publishers) => {

                    axios({
                        method: 'get',
                        url: "https://api.twitch.tv/helix/games",
                        params: { name: game.name},
                        headers: { 'Client-ID': twitchKey}
                    })
                    .then(function (response) {
                       let game_id = response.data.data[0].id;

                       axios({ //request 2. get top streamer from game id.
                            method: 'get',
                            url: "https://api.twitch.tv/helix/streams",
                            params: {
                                game_id: game_id,
                                first: 1 // only top stream
                            },
                            headers: {
                                'Client-ID': twitchKey
                            }
                        })
                        .then(function (response) {
                            let resp = response.data.data;
                            username = resp[0]["user_name"];
                        });
                    });

                    // Reviews counts
                    let reviewsCounts = [0, 0, 0, 0, 0];
                    game.ratings.forEach((rating) => {
                        reviewsCounts[rating.id - 1] = rating.count;
                    });
                    reviewsCounts.reverse();

                    let options = {
                        q: game.name,
                        part: 'snippet',
                        type:' video'
                    };
                    youtubeApiV3Search(youtubeKey, options, (err, response) => {
                        let videos = [];
                        response.items.forEach((item) =>{
                            videos.push(item.id.videoId);
                        });
                        res.render('game', {username: username, title: game.name, game: game, developers: developers, publishers: publishers, reviewsCounts: JSON.stringify(reviewsCounts), videos: videos});
                    });

            });
        });
    });

});


module.exports = router;
