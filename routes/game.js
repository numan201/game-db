const express = require('express');
const router = express.Router();
const axios = require('axios');
const hltb = require('howlongtobeat');
const hltbService = new hltb.HowLongToBeatService();
const youtubeApiV3Search = require("youtube-api-v3-search");
const { youtubeKey, twitchKey } = require('../keys');

function getSteamAppId(game) {
    let steamAppId = null;

    for (let store of game.stores) {
        if (store.store.name === "Steam") {
            let steamURLParts = store.url_en.split('/');
            steamAppId = steamURLParts[steamURLParts.indexOf('app') + 1];
            break;
        }
    }

    return steamAppId;
}

function getReviewsCounts(game) {
    let reviewsCounts = [0, 0, 0, 0, 0];

    game.ratings.forEach((rating) => reviewsCounts[rating.id - 1] = rating.count);
    reviewsCounts.reverse();

    return JSON.stringify(reviewsCounts);
}

/* GET games listing. */
router.get('/', (req, res) => {
    let id = require('mongodb').ObjectID(req.query.id);

    // Get Game
    req.app.locals.db.collection('games').findOne({_id : id})
        .then( (game) => {
            // Wishlist functionality

            let userHasInWishlist = req.user && req.user.wishlist.includes(game._id.toString());

            if (req.user) {
                let userId = require('mongodb').ObjectID(req.user._id);

                if ('addWishlist' in req.query) {
                    req.app.locals.db.collection('users').updateOne({_id: userId}, {$addToSet: {wishlist: game._id.toString()}}).then( (result) => {
                        res.redirect('/game?id=' + req.query.id);
                    });
                    return;

                } else if ('removeWishlist' in req.query) {
                    req.app.locals.db.collection('users').updateOne({_id: userId}, {$pull: {wishlist: game._id.toString()}}).then( (result) => {
                        res.redirect('/game?id=' + req.query.id);
                    });
                    return;
                }

            }

            let reviewsCounts = getReviewsCounts(game);

            return {title: game.name, game, reviewsCounts: reviewsCounts, userHasInWishlist: userHasInWishlist};

        }).then( (data) => {
        // Developers and publishers

        let developers = req.app.locals.db.collection('developers').aggregate([{$unwind: "$games"}, {$match: { "games.id" : data.game.id}}, {$project: {"name": 1}}]).toArray();
        let publishers = req.app.locals.db.collection('publishers').aggregate([{$unwind: "$games"}, {$match: {"games.id": data.game.id}}, {$project: {"name": 1}}]).toArray();

        return Promise.all([developers, publishers]).then(([developers, publishers]) => {
            data.developers = developers;
            data.publishers = publishers;
            return data;
        });

    })
        .then ((data) => {
            // Steam Player Count

            data.steamPlayerCount = 0;
            data.steamAppId = getSteamAppId(data.game);

            return axios.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + data.steamAppId)
                .then((resp) => {
                        if (resp.data.response !== null) {
                            let steamPlayerCount = resp.data.response.player_count;
                            data.steamPlayerCount = steamPlayerCount.toLocaleString();
                        }

                        return data;
                    }
                )
                .catch(err => data);

        }).then( (data) => {
        // Steam News

        return axios.get('http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + data.steamAppId +'&count=5&maxlength=0&format=json')
            .then( (resp) => {
                    if (resp.data.appnews !== null) {
                        data.news = resp.data.appnews.newsitems;
                    }

                    return data;
                }
            )
            .catch(err => data);

    }).then( (data) => {
        // Twitch Integration

        return axios({
            method: 'get',
            url: 'https://api.twitch.tv/helix/games',
            params: {name: data.game.name},
            headers: {'Client-ID': twitchKey}
        })
            .then((response) => {
                let gameId = response.data.data[0].id;

                // Get top streamer from game id
                return axios({
                    method: 'get',
                    url: "https://api.twitch.tv/helix/streams",
                    params: {
                        game_id: gameId,
                        first: 1
                    },
                    headers: {'Client-ID': twitchKey}
                })
                    .then((response) => {
                        data.username = response.data.data[0].user_name;
                        return data;
                    })
                    .catch(err => data);
            })
            .catch(err => data);

    }).then((data) => {
        // How Long to Beat

        return hltbService.search(data.game.name).then(result => {
            data.hltb = {};

            if (result.length === 0) {
                data.hltb.exists = false;
            } else {
                data.hltb.exists = result[0].similarity > 0.8;
                data.hltb.id = result[0].id;
                data.hltb.main = result[0].gameplayMain;
                data.hltb.mainExtra = result[0].gameplayMainExtra;
                data.hltb.completionist = result[0].gameplayCompletionist;
            }

            return data;
        })
            .catch(err => data);

    }).then( (data) => {
        data.videos = [];

        let options = {
            q: data.game.name,
            part: 'snippet',
            type:' video'
        };

        return youtubeApiV3Search(youtubeKey, options)
            .then((response) => {
                response.items.forEach((item) => {
                    data.videos.push(item.id.videoId);
                });

                return data;
            })
            .catch(err => data);

    }).then(data => {
        res.render('game', data)
    });

});


module.exports = router;
