const axios = require('axios');
const express = require('express');
const router = express.Router();

/* GET games listing. */
router.get('/', function(req, res, next) {
    var news = [];
    var steamGames = [];
    req.app.locals.db.collection('games').find().limit(20).toArray((err, games) => {
        games.forEach((game) => {
            let steamAppId = null;
            for(let store of game.stores){
                if(store.store.name === "Steam"){
                    steamGames.push(game);
                    let steamURLParts = store.url_en.split('/');
                    steamAppId = steamURLParts[steamURLParts.indexOf('app') + 1];
                    break;
                }
            }

            axios.get('http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + steamAppId +'&count=1&maxlength=300&format=json')
                .then(function (resp) {
                    if (resp.data.appnews.newsitems[0] !== null) {
                        news.push(resp.data.appnews.newsitems[0]);
                    }
                }
            );
        });
        res.render('news', { title: 'news', news: news, steamGames: steamGames});
    });
});

module.exports = router;