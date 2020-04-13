const express = require('express');
const router = express.Router();
const axios = require('axios');
const hltb = require('howlongtobeat');
const hltbService = new hltb.HowLongToBeatService();
const youtubeApiV3Search = require("youtube-api-v3-search");
const { youtubeKey, twitchKey } = require('../keys');
const stringSimilarity = require('string-similarity');

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

function getDevelopersAndPublishers(resolve, data, req){
    let developers = req.app.locals.db.collection('developers').aggregate([{$unwind: "$games"}, {$match: { "games.id" : data.game.id}}, {$project: {"name": 1}}]).toArray();
    let publishers = req.app.locals.db.collection('publishers').aggregate([{$unwind: "$games"}, {$match: {"games.id": data.game.id}}, {$project: {"name": 1}}]).toArray();

    Promise.all([developers, publishers]).then(([developers, publishers]) => {
        data.developers = developers;
        data.publishers = publishers;
        console.log("DEVS/Pubs");
        resolve(data);
    });
}

function getSteamPlayerCount(resolve, data){
    data.steamPlayerCount = 0;
    data.steamAppId = getSteamAppId(data.game);
    if(data.steamAppId == null) resolve(data);
    return axios.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + data.steamAppId)
        .then((resp) => {
                if (resp.data.response !== null) {
                    let steamPlayerCount = resp.data.response.player_count;
                    data.steamPlayerCount = steamPlayerCount.toLocaleString();
                }

                console.log("SteamPlayer");
                resolve(data);
            }
        )
        .catch(err => resolve(data));
}

function getPS4Price(resolve, data){
    data.ps4Price = null;
    return axios.get('https://store.playstation.com/store/api/chihiro/00_09_000/tumbler/US/en/99/'+ escape(data.game.name) +'?suggested_size=10')
        .then((resp) => {
            if(resp.data.links[0].playable_platform.includes("PS4™") ){
                data.ps4Price = {};
                //checking if it's on sale
                if(resp.data.links[0].default_sku.rewards.length > 0){
                    data.ps4Price.price = resp.data.links[0].default_sku.rewards[0].display_price;
                }
                else{
                    data.ps4Price.price = resp.data.links[0].default_sku.display_price;
                }
                data.ps4Price.link = 'https://store.playstation.com/en-us/product/' + resp.data.links[0].id;
            }
            console.log("PS4");
            resolve(data);
        })
        .catch(err => resolve(data));
}

function getXB1Link(resolve, data){
    data.xb1Price = null;
    return axios.get('https://www.microsoft.com/services/api/v3/suggest?market=en-us&clientId=7F27B536-CF6B-4C65-8638-A0F8CBDFCA65&sources=Iris-Products%2CDCatAll-Products%2CMicrosoft-Terms&filter=%2BClientType%3AStoreWeb&counts=1%2C5%2C5&query=' + escape(data.game.name))
        .then((resp) =>{
            let xb1NameSimilarity = 0.5;
            /*  The way that Microsoft returns search data is in multiple 'sets' for each of their store fronts
                Unfortunately these aren't slotted in any particular order so we have to check all the return values
                for the correct game, and have to ignore apps and other invalid entries manually.
                Also pricing information is not in an easily retrievable form, so that won't be given.
             */
            if(resp.data.ResultSets.length == 0) return data;
            resp.data.ResultSets.forEach((resultSet) => {
                if(resultSet.Suggests==null) return;
                resultSet.Suggests.forEach((xb) => {
                    //Want to ignore the entries for "Apps"
                    if(xb.Title == null || xb.Source == null || xb.Source == 'Apps') return;
                    let similarity = stringSimilarity.compareTwoStrings(xb.Title, data.game.name);
                    //Only save if the game names are similar and it isn't a promo for GamePass
                    if(similarity > xb1NameSimilarity && xb.Source != 'One low monthly price'){
                        xb1NameSimilarity = similarity;
                        data.xb1Price = {};
                        data.xb1Price.link = 'https:' + xb.Url;
                        //Now we have a link to the page that has the price, but not easy way to get the price.
                    }
                });
            });
            console.log("XB1");
            resolve(data);
        }).catch(err => resolve(data));
}

function getSteamPrice(resolve, data) {
    // Steam Price
    data.steamPrice = null;
    if(data.steamAppId == null) resolve(data);
    return axios.get('http://store.steampowered.com/api/appdetails?appids=' + data.steamAppId)
        .then((resp) => {
            data.steamPrice = {};
            data.steamPrice = resp.data[data.steamAppId].data.price_overview;
            data.steamPrice.link = 'http://store.steampowered.com/app/' + data.steamAppId + '/';
            console.log("steamPrice");
            resolve(data);
        })
        .catch(err => resolve(data));
}

function getSteamNews(resolve, data){
    // Steam News
    data.news = null;
    return axios.get('http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + data.steamAppId +'&count=3&maxlength=0&format=json')
        .then( (resp) => {
                if (resp.data.appnews !== null) {
                    data.news = resp.data.appnews.newsitems;
                }
            console.log("steamNews");

                resolve(data);
            }
        )
        .catch(err => resolve(data));
}

function getTwitchIntegration(resolve, data){
    // Twitch Integration
    data.twitchUsername = null;
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
                    data.twitchUsername = response.data.data[0].user_name;
                    console.log("twitch");
                    resolve(data);
                })
                .catch(err => resolve(data));
        })
        .catch(err => resolve(data));
}

function getHLTB(resolve, data){
    // How Long to Beat

    return hltbService.search(data.game.name).then(result => {
        data.hltb = {};

        if (result.length === 0) {
            data.hltb.exists = false;
        } else {
            data.hltb.exists = result[0].similarity > 0.5;
            data.hltb.id = result[0].id;
            data.hltb.main = result[0].gameplayMain;
            data.hltb.mainExtra = result[0].gameplayMainExtra;
            data.hltb.completionist = result[0].gameplayCompletionist;
        }

        console.log("HLTB");
        resolve(data);
    })
        .catch(err => resolve(data));
}

function getYoutube(resolve, data){
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
            console.log("Youtube");

            resolve(data);
        })
        .catch(err => resolve(data));
}

function getReviews(resolve, data, req, id){
    let reviews = req.app.locals.db.collection('reviews').find({gameId:id.toLocaleString()}).toArray();
    return Promise.all([reviews]).then(([reviews]) => {
        data.reviews = reviews;
        console.log("Reviews");
        resolve(data);
    });
}

/* GET games listing. */
router.get('/', function(req, res) {
    let id = require('mongodb').ObjectID(req.query.id);

    // Get Game
    /*
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

        })
        .then( (data) => {
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

    })
    .then((data) =>{
        // Steam Price
        data.steamPrice = null;
        if(data.steamAppId == null) return data;
        return axios.get('http://store.steampowered.com/api/appdetails?appids=' + data.steamAppId)
            .then((resp) => {
                data.steamPrice = {};
                data.steamPrice = resp.data[data.steamAppId].data.price_overview;
                data.steamPrice.link = 'http://store.steampowered.com/app/' + data.steamAppId + '/';
                return data;
            })
            .catch(err => data);
    })
    .then((data) => {
        data.ps4Price = null;
        return axios.get('https://store.playstation.com/store/api/chihiro/00_09_000/tumbler/US/en/99/'+ escape(data.game.name) +'?suggested_size=10')
            .then((resp) => {
                if(resp.data.links[0].playable_platform.includes("PS4™") ){
                    data.ps4Price = {};
                    //checking if it's on sale
                    if(resp.data.links[0].default_sku.rewards.length > 0){
                        data.ps4Price.price = resp.data.links[0].default_sku.rewards[0].display_price;
                    }
                    else{
                        data.ps4Price.price = resp.data.links[0].default_sku.display_price;
                    }
                    data.ps4Price.link = 'https://store.playstation.com/en-us/product/' + resp.data.links[0].id;
                }
                return data;
            })
            .catch(err => data)
    })
    .then((data) => {
        data.xb1Price = null;
        return axios.get('https://www.microsoft.com/services/api/v3/suggest?market=en-us&clientId=7F27B536-CF6B-4C65-8638-A0F8CBDFCA65&sources=Iris-Products%2CDCatAll-Products%2CMicrosoft-Terms&filter=%2BClientType%3AStoreWeb&counts=1%2C5%2C5&query=' + escape(data.game.name))
            .then((resp) =>{
                let xb1NameSimilarity = 0.5;
                if(resp.data.ResultSets.length == 0) return data;
                resp.data.ResultSets.forEach((resultSet) => {
                    if(resultSet.Suggests==null) return;
                    resultSet.Suggests.forEach((xb) => {
                        //Want to ignore the entries for "Apps"
                        if(xb.Title == null || xb.Source == null || xb.Source == 'Apps') return;
                        let similarity = stringSimilarity.compareTwoStrings(xb.Title, data.game.name);
                        //Only save if the game names are similar and it isn't a promo for GamePass
                        if(similarity > xb1NameSimilarity && xb.Source != 'One low monthly price'){
                            xb1NameSimilarity = similarity;
                            data.xb1Price = {};
                            data.xb1Price.link = 'https:' + xb.Url;
                            //Now we have a link to the page that has the price, but not easy way to get the price.
                        }
                    });
                });
                return data;
            })
    })
    .then( (data) => {
        // Steam News
        data.news = null;
        return axios.get('http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + data.steamAppId +'&count=3&maxlength=0&format=json')
            .then( (resp) => {
                    if (resp.data.appnews !== null) {
                        data.news = resp.data.appnews.newsitems;
                    }

                    return data;
                }
            )
            .catch(err => data);

    })
    .then( (data) => {
        // Twitch Integration
        data.twitchUsername = null;
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
                        data.twitchUsername = response.data.data[0].user_name;
                        return data;
                    })
                    .catch(err => data);
            })
            .catch(err => data);

    })
    .then((data) => {
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

    })
    .then( (data) => {
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

    })
    .then(data => {
        let reviews = req.app.locals.db.collection('reviews').find({gameId:id.toLocaleString()}).toArray();
        return Promise.all([reviews]).then(([reviews]) => {
            data.reviews = reviews;
            return data;
        });
    })
    .then(data => {
    });*/


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

        }).then(data => {
            //Here make everything Promises
            const promises = [
                new Promise(resolve => getDevelopersAndPublishers(resolve, data, req)),
                new Promise(resolve => getSteamPlayerCount(resolve, data)),
                new Promise(resolve => getPS4Price(resolve, data)),
                new Promise(resolve => getXB1Link(resolve, data)),
                new Promise(resolve => getSteamNews(resolve, data)),
                new Promise(resolve => getTwitchIntegration(resolve, data)),
                new Promise(resolve => getHLTB(resolve, data)),
                new Promise(resolve => getYoutube(resolve, data)),
                new Promise(resolve => getReviews(resolve, data, req, id)),
                new Promise(resolve => getSteamPrice(resolve, data, req, id))
            ];
            Promise.all(promises).then(out => {
                let game = Object.assign({}, ...out);
                console.log(game);
                res.render('game', game);
                return data;
            })
    });
});

module.exports = router;
