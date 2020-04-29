const axios = require('axios');
const hltb = require('howlongtobeat');
const hltbService = new hltb.HowLongToBeatService();
const youtubeApiV3Search = require("youtube-api-v3-search");
const { youtubeKey, twitchKey, steamKey } = require('../keys');
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

function getSteamAppIdModded(stores) {
    let steamAppId = null;

    for (let store of stores) {
        if (store.store.name === "Steam") {
            let steamURLParts = store.url_en.split('/');
            steamAppId = steamURLParts[steamURLParts.indexOf('app') + 1];
            break;
        }
    }

    return steamAppId;
}

function getReviewsCounts(resolve, ratings) {
    let reviewsCounts = [0, 0, 0, 0, 0];

    ratings.forEach((rating) => reviewsCounts[rating.id - 1] = rating.count);
    reviewsCounts.reverse();

    let reviewsCountsReturn = {key:'reviewsCounts', value:JSON.stringify(reviewsCounts)};
    resolve(reviewsCountsReturn);
}

function getDevelopers(resolve, id, req){
    let developers = req.app.locals.db.collection('developers').aggregate([{$unwind: "$games"}, {$match: { "games.id" : id}}, {$project: {"name": 1}}]).toArray();
    Promise.all([developers]).then(([developers]) => {
        resolve({key:'developers', value:developers});
    });
}

function getPublishers(resolve, id, req){
    let publishers = req.app.locals.db.collection('publishers').aggregate([{$unwind: "$games"}, {$match: {"games.id": id}}, {$project: {"name": 1}}]).toArray();
    Promise.all([publishers]).then(([publishers]) => {
        resolve({key:'publishers', value:publishers});
    })
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
                data.ps4Price.publisherFallback = resp.data.links[0].provider_name;
                data.ps4Price.link = 'https://store.playstation.com/en-us/product/' + resp.data.links[0].id;
            }
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
            if(resp.data.ResultSets.length == 0) resolve(data);
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
            resolve(data);
        }).catch(err => resolve(data));
}

function getSteamPrice(resolve, data) {
    // Steam Price
    data.steamPrice = null;
    data.steamAppId = getSteamAppId(data.game);
    if(data.steamAppId == null) resolve(data);
    return axios.get('http://store.steampowered.com/api/appdetails?appids=' + data.steamAppId)
        .then((resp) => {
            data.steamPrice = {};
            if(resp.data[data.steamAppId].data.is_free == true){
                data.steamPrice.final_formatted = "Free";
            }
            else{
                data.steamPrice = resp.data[data.steamAppId].data.price_overview;
            }
            data.steamPrice.developers = resp.data[data.steamAppId].data.developers;
            data.steamPrice.publishers = resp.data[data.steamAppId].data.publishers;
            data.steamPrice.link = 'http://store.steampowered.com/app/' + data.steamAppId + '/';
            resolve(data);
        })
        .catch(err => {resolve(data);});
}

function getSteamNews(resolve, data, req) {
    // Steam News
    data.news = null;
    data.steamAppId = getSteamAppId(data.game);
    if (data.steamAppId == null) resolve(data);
    req.app.locals.db.collection('cachednews').find({ game_name : {$eq: data.game.name}}).toArray().then(articles => {
        if(articles.length === 0) {
            return axios.get('http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + data.steamAppId + '&count=3&maxlength=0&format=json')
                .then((resp) => {
                        if (resp.data.appnews !== null) {
                            data.news = resp.data.appnews.newsitems;
                            resp.data.appnews.newsitems.forEach(newsitem => {
                                newsitem.game_name = data.game.name;
                                newsitem.createdAt = new Date();
                            });
                            req.app.locals.db.collection('cachednews').insertMany(resp.data.appnews.newsitems);
                        }
                        resolve(data);
                    }
                )
                .catch(err => resolve(data));
        }
        else{
            data.news = articles;
            resolve(data);
        }
    });
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
                    resolve(data);
                })
                .catch(err => resolve(data));
        })
        .catch(err => resolve(data));
}

function getHLTB(resolve, data){
    // How Long to Beat
    data.hltb = null;
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
            if(data.hltb.main == 0 && data.hltb.mainExtra == 0 && data.hltb.completionist == 0) data.hltb.exists = false;
        }
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
            resolve(data);
        })
        .catch(err => resolve(data));
}

function getReviews(resolve, req, id) {
    let reviews = req.app.locals.db.collection('reviews').find({id:id.toLocaleString()}).toArray();
    return Promise.all([reviews]).then(([reviews]) => {
        let reviewReturn = {key: 'reviews', value: reviews};
        resolve(reviewReturn);
    });
}

function getWishlist(resolve, game_id, req, res){
    // Wishlist functionality
    if (req.user) {
        let userId = require('mongodb').ObjectID(req.user._id);
        if ('addWishlist' in req.query) {
            req.app.locals.db.collection('users').updateOne({_id: userId}, {$addToSet: {wishlist: game_id.toString()}}).then( (result) => {
                //res.redirect('/game?id=' + req.query.id);
                resolve({key: 'userHasInWishlist', value: true});
            });
        } else if ('removeWishlist' in req.query) {
            req.app.locals.db.collection('users').updateOne({_id: userId}, {$pull: {wishlist: game_id.toString()}}).then( (result) => {
                //res.redirect('/game?id=' + req.query.id);
                resolve({key: 'userHasInWishlist', value: false});
            });
        } else {
            resolve({key: 'userHasInWishlist', value: req.user.wishlist.includes(game_id.toString())});
        }
    }
    else{
        resolve({key: 'userHasInWishlist', value: false});
    }
}

function getSteamAchievements(resolve, stores, req, res){
    let achievements = { key: 'achievements', value: null};
    let steamAppId = getSteamAppIdModded(stores);
    if(steamAppId == null){ resolve(achievements); }
    axios.get("http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=" + steamKey + "&appid=" + steamAppId).then((resp) => {
        achievements.value = resp.data.game.availableGameStats.achievements;
        resolve(achievements);
    })
        .catch(err => { resolve(achievements);});
}

//checks if the game is cached, returns 0 if we're up to date, 1 if cache is too old and 2 if game isn't cached
function checkCached(promise, resolve, req, res, id){
    req.app.locals.db.collection('cachedgames').findOne({_id: id})
        .then(game => {
            if(game == null){
                resolve(false);
            }
            else{
                const promises = [
                    new Promise(resolve => getWishlist(resolve, id, req, res)),
                    new Promise(resolve => getReviews(resolve, req, id))
                ];
                Promise.all(promises).then( output => {
                    output.forEach(entry => {
                        game[entry.key] = entry.value;
                    });
                    promise(game);
                });
                resolve(true);
            }
        }).catch(err => resolve(false));
}

/* GET games listing. */
function getGameData(promise, req, res) {
    let id = require('mongodb').ObjectID(req.query.id);
    // Get Game
    const cachePromise = new Promise(finish => checkCached(promise, finish, req, res, id))

    //Used for adjusting the cache timing
    //req.app.locals.db.collection('cachedgames').createIndex({"date": 1}, {expireAfterSeconds: 60 * 5});
    req.app.locals.db.collection('games').findOne({_id : id})
        .then(game => {
            let data = {title: game.name, game, page: req.baseUrl};
            data._id = id;
            //Allowing Concurrency in our page load
            const hiddenPromises = [
                new Promise(resolve => getSteamAchievements(resolve, data.game.stores, req, id)),
                new Promise(resolve => getWishlist(resolve, data._id, req, res)),
                new Promise(resolve => getReviewsCounts(resolve, data.game.ratings)),
                new Promise(resolve => getReviews(resolve, req, id)),
                new Promise(resolve => getPublishers(resolve, data.game.id, req)),
                new Promise(resolve => getDevelopers(resolve, data.game.id, req))];
            const promises = [
                new Promise(resolve => getSteamPlayerCount(resolve, data)),
                new Promise(resolve => getPS4Price(resolve, data)),
                new Promise(resolve => getXB1Link(resolve, data)),
                new Promise(resolve => getSteamNews(resolve, data, req)),
                new Promise(resolve => getTwitchIntegration(resolve, data)),
                new Promise(resolve => getHLTB(resolve, data)),
                new Promise(resolve => getYoutube(resolve, data)),
                new Promise(resolve => getSteamPrice(resolve, data, req, id))
            ];
            Promise.all(promises).then(out => {
                //Out is actually an array of all the promises output, so here we merge them
                let game = Object.assign({}, ...out);
                Promise.all(hiddenPromises).then(output => {
                    output.forEach(entry => {
                        game[entry.key] = entry.value;
                    });
                    game.date = new Date();
                    cachePromise.then(cached => {
                        if(cached == false){
                            promise(game);
                        }
                        req.app.locals.db.collection('cachedgames').replaceOne({_id: id}, game, {upsert:true});
                    });
                    return data;
                });

            });
        });

};

module.exports = { getGameData };