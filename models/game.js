const axios = require('axios');
const hltb = require('howlongtobeat');
const hltbService = new hltb.HowLongToBeatService();
const youtubeApiV3Search = require("youtube-api-v3-search");
const { youtubeKey, twitchKey, steamKey } = require('../keys');
const stringSimilarity = require('string-similarity');


function getSteamAppId(stores) {
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

function getSteamPlayerCount(resolve, steamAppId){
    if(steamAppId == null) resolve({key:'steamPlayerCount', value:0});
    axios.get('https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=' + steamAppId)
        .then((resp) => {
                if (resp.data.response !== null) {
                    let steamPlayerCount = resp.data.response.player_count;
                    resolve({key:'steamPlayerCount', value:steamPlayerCount.toLocaleString()});
                }
                else{
                    resolve({key:'steamPlayerCount', value:0});
                }
            }
        )
        .catch(() => resolve({key:'steamPlayerCount', value:0}));
}

function getPS4Price(resolve, name){
    let ps4Price = {key:'ps4Price', value: null};
    axios.get('https://store.playstation.com/store/api/chihiro/00_09_000/tumbler/US/en/99/'+ escape(name) +'?suggested_size=10')
        .then((resp) => {
            if(resp.data.links[0].playable_platform.includes("PS4™") ){
                ps4Price.value = {};
                //checking if it's on sale
                if(resp.data.links[0].default_sku.rewards.length > 0){
                    ps4Price.value.price = resp.data.links[0].default_sku.rewards[0].display_price;
                }
                else{
                    ps4Price.value.price = resp.data.links[0].default_sku.display_price;
                }
                ps4Price.value.publisherFallback = resp.data.links[0].provider_name;
                ps4Price.value.link = 'https://store.playstation.com/en-us/product/' + resp.data.links[0].id;
            }
            resolve(ps4Price);
        })
        .catch(() => resolve(ps4Price));
}

function getXB1Link(resolve, name){
    let xb1Price = {key:'xb1Price', value:null};
    return axios.get('https://www.microsoft.com/services/api/v3/suggest?market=en-us&clientId=7F27B536-CF6B-4C65-8638-A0F8CBDFCA65&sources=Iris-Products%2CDCatAll-Products%2CMicrosoft-Terms&filter=%2BClientType%3AStoreWeb&counts=1%2C5%2C5&query=' + escape(name))
        .then((resp) =>{
            let xb1NameSimilarity = 0.5;
            if(resp.data.ResultSets.length == 0) resolve(xb1Price);
            resp.data.ResultSets.forEach((resultSet) => {
                if(resultSet.Suggests==null) resolve(xb1Price);
                resultSet.Suggests.forEach((xb) => {
                    //Want to ignore the entries for "Apps"
                    if(xb.Title == null || xb.Source != 'Games') return;
                    let similarity = stringSimilarity.compareTwoStrings(xb.Title.toLowerCase(), name.toLowerCase());
                    //Only save if the game names are similar and it isn't a promo for GamePass
                    if(similarity > xb1NameSimilarity && xb.Source != 'One low monthly price'){
                        xb1NameSimilarity = similarity;
                        xb1Price.value = {};
                        xb1Price.value.link = 'https:' + xb.Url;
                        //Now we have a link to the page that has the price, but not easy way to get the price.
                    }
                });
            });
            resolve(xb1Price);
        }).catch(() => resolve(xb1Price));
}

function getSteamPrice(resolve, steamAppId) {
    // Steam Price
    let steamPrice = {key:'steamPrice', value:null};
    if(steamAppId == null) resolve(steamPrice);
    return axios.get('http://store.steampowered.com/api/appdetails?appids=' + steamAppId)
        .then((resp) => {
            steamPrice.value = {};
            if(resp.data[steamAppId].data.is_free == true){
                steamPrice.value.final_formatted = "Free";
            }
            else{
                steamPrice.value = resp.data[steamAppId].data.price_overview;
            }
            steamPrice.value.developers = resp.data[data.steamAppId].data.developers;
            steamPrice.value.publishers = resp.data[data.steamAppId].data.publishers;
            steamPrice.value.link = 'http://store.steampowered.com/app/' + steamAppId + '/';
            resolve(steamPrice);
        })
        .catch(() => {resolve(steamPrice);});
}

function getSteamNews(resolve, steamAppId, name, req) {
    // Steam News
    let news = {key:'news', value:null};
    if (steamAppId == null) resolve(data);
    req.app.locals.db.collection('cachednews').find({ game_name : {$eq: name}}).toArray().then(articles => {
        if(articles.length === 0) {
            return axios.get('http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + steamAppId + '&count=3&maxlength=0&format=json')
                .then((resp) => {
                        if (resp.data.appnews !== null) {
                            news.value = resp.data.appnews.newsitems;
                            resp.data.appnews.newsitems.forEach(newsitem => {
                                newsitem.game_name = name;
                                newsitem.createdAt = new Date();
                            });
                            req.app.locals.db.collection('cachednews').insertMany(resp.data.appnews.newsitems);
                        }
                        resolve(news);
                    }
                )
                .catch(() => resolve(news));
        }
        else{
            news.value = articles;
            resolve(news);
        }
    });
}

function getTwitchIntegration(resolve, name){
    // Twitch Integration
    let twitchUsername = {key:'twitchUsername', value:null};
    return axios({
        method: 'get',
        url: 'https://api.twitch.tv/helix/games',
        params: {name: name},
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
                    twitchUsername.value = response.data.data[0].user_name;
                    resolve(twitchUsername);
                })
                .catch(() => resolve(twitchUsername));
        })
        .catch(() => resolve(twitchUsername));
}

function getHLTB(resolve, name){
    // How Long to Beat
    let hltb = {key:'hltb', value:null};
    return hltbService.search(name).then(result => {
        hltb.value = {};

        if (result.length === 0) {
            hltb.value.exists = false;
        } else {
            hltb.value.exists = result[0].similarity > 0.5;
            hltb.value.id = result[0].id;
            hltb.value.main = result[0].gameplayMain;
            hltb.value.mainExtra = result[0].gameplayMainExtra;
            hltb.value.completionist = result[0].gameplayCompletionist;
            if(hltb.value.main == 0 && hltb.value.mainExtra == 0 && hltb.value.completionist == 0) hltb.value.exists = false;
        }
        resolve(hltb);
    })
        .catch(() => resolve(hltb));
}

function getYoutube(resolve, name){
    let videos = {key: 'videos', value:[]};

    let options = {
        q: name,
        part: 'snippet',
        type:' video'
    };

    return youtubeApiV3Search(youtubeKey, options)
        .then((response) => {
            response.items.forEach((item) => {
                videos.value.push(item.id.videoId);
            });
            resolve(videos);
        })
        .catch(() => resolve(videos));
}

function getReviews(resolve, req, id) {
    let reviews = req.app.locals.db.collection('reviews').find({id:id.toLocaleString()}).toArray();
    return Promise.all([reviews]).then(([reviews]) => {
        let reviewReturn = {key: 'reviews', value: reviews};
        resolve(reviewReturn);
    });
}

function getWishlist(resolve, game_id, req){
    // Wishlist functionality
    if (req.user) {
        let userId = require('mongodb').ObjectID(req.user._id);
        if ('addWishlist' in req.query) {
            req.app.locals.db.collection('users').updateOne({_id: userId}, {$addToSet: {wishlist: game_id.toString()}}).then( () => {
                //res.redirect('/game?id=' + req.query.id);
                resolve({key: 'userHasInWishlist', value: true});
            });
        } else if ('removeWishlist' in req.query) {
            req.app.locals.db.collection('users').updateOne({_id: userId}, {$pull: {wishlist: game_id.toString()}}).then( () => {
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

function getSteamAchievements(resolve, steamAppId){
    let achievements = { key: 'achievements', value: null};
    if(steamAppId == null){ resolve(achievements); }
    axios.get("http://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=" + steamKey + "&appid=" + steamAppId).then((resp) => {
        achievements.value = resp.data.game.availableGameStats.achievements;
        resolve(achievements);
    })
        .catch(() => { resolve(achievements);});
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
                    new Promise(resolve => getWishlist(resolve, id, req)),
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
        }).catch(() => resolve(false));
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

            data.steamAppId = getSteamAppId(data.game.stores);

            const name = data.game.name;
            const gameId = data.game.id;
            const steamAppId = data.steamAppId;
            const uniqueId = data._id;
            const ratings = data.game.ratings;

            const hiddenPromises = [
                new Promise(resolve => getSteamAchievements(resolve, steamAppId, req)),
                new Promise(resolve => getWishlist(resolve, uniqueId, req)),
                new Promise(resolve => getReviewsCounts(resolve, ratings)),
                new Promise(resolve => getReviews(resolve, req, id)),
                new Promise(resolve => getPublishers(resolve, gameId, req)),
                new Promise(resolve => getDevelopers(resolve, gameId, req)),
                new Promise(resolve => getSteamPlayerCount(resolve, steamAppId)),
                new Promise(resolve => getPS4Price(resolve, name)),
                new Promise(resolve => getXB1Link(resolve, name)),
                new Promise(resolve => getSteamNews(resolve, steamAppId, name, req)),
                new Promise(resolve => getSteamPrice(resolve, steamAppId)),
                new Promise(resolve => getTwitchIntegration(resolve, name)),
                new Promise(resolve => getHLTB(resolve, name)),
                new Promise(resolve => getYoutube(resolve, name))];
            Promise.all(hiddenPromises).then(output => {
                let game = data;
                output.forEach(entry => {
                    if(game.hasOwnProperty(entry.key)) throw "You're trying to overwrite data";
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

}

module.exports = { getGameData };
