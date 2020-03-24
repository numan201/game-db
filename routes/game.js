const express = require('express');
const router = express.Router();
const axios = require('axios');
const hltb = require('howlongtobeat');
const hltbService = new hltb.HowLongToBeatService();
const youtubeApiV3Search = require("youtube-api-v3-search");
const { youtubeKey, twitchKey } = require('../keys');

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);
    let username;

    req.app.locals.db.collection('games').findOne({_id : id}, (err, game) => {

        // Wishlist functionality
        if (req.user) {
            let userId = require('mongodb').ObjectID(req.user._id);

            if ('addWishlist' in req.query) {
                req.app.locals.db.collection('users').updateOne({_id: userId}, {$addToSet: {wishlist: game._id.toString()}}, (err, response) => {
                    if (err) throw err;
                    res.redirect('/game?id=' + req.query.id);
                });
                return;

            } else if ('removeWishlist' in req.query) {
                req.app.locals.db.collection('users').updateOne({_id: userId}, {$pull: {wishlist: game._id.toString()}}, (err, response) => {
                    if (err) throw err;
                    res.redirect('/game?id=' + req.query.id);
                });
                return;

            }

        }

        let userHasInWishlist = req.user && req.user.wishlist.includes(game._id.toString());

        req.app.locals.db.collection('developers').
        aggregate([{$unwind: "$games"}, {$match: { "games.id" : game.id}}, {$project: {"name": 1}}]).toArray((err, developers) => {
            req.app.locals.db.collection('publishers').
            aggregate([{$unwind: "$games"}, {$match: { "games.id" : game.id}}, {$project: {"name": 1}}]).toArray((err, publishers) => {

                // Steam Player Count
                let playerCount = 0;
                let steamAppId = null;

                for (let store of game.stores) {
                    if (store.store.name == "Steam") {
                        let steamURLParts = store.url_en.split('/');
                        steamAppId = steamURLParts[steamURLParts.indexOf('app') + 1];
                        break;
                    }
                }
                axios.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + steamAppId)
                    .then(function (resp) {
                            if (resp.data.response !== null) {
                                playerCount = resp.data.response.player_count;
                                game.steamPlayerCount = playerCount.toLocaleString();
                            }
                        }
                    );

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

                // How long to beat
                let hltbPromise = new Promise(resolve => {
                    hltbService.search(game.name).then(result => {
                        game.hltb = {};
                        if(result.length == 0){
                            game.hltb.exists = false;
                        }
                        else{
                            game.hltb.exists = result[0].similarity > 0.8;
                            game.hltb.id = result[0].id;
                            game.hltb.main = result[0].gameplayMain;
                            game.hltb.mainExtra = result[0].gameplayMainExtra;
                            game.hltb.completionist = result[0].gameplayCompletionist;
                        }
                        resolve();
                    }).catch(e => resolve());
                });

                let options = {
                    q: game.name,
                    part: 'snippet',
                    type:' video'
                };

                youtubeApiV3Search(youtubeKey, options, (err, response) => {
                    let videos = [];

                    if (err == null) {
                        response.items.forEach((item) => {
                            videos.push(item.id.videoId);
                        });
                    }

                    hltbPromise.then(() => {
                        res.render('game', { username: username, title: game.name, game: game, developers: developers, publishers: publishers, reviewsCounts: JSON.stringify(reviewsCounts), videos: videos, userHasInWishlist: userHasInWishlist });
                    });

                });

            });
        });
    });

});


module.exports = router;
