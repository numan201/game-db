const axios = require('axios');
const express = require('express');
const router = express.Router();

/* GET games listing. */
router.get('/', function(req, res, next) {
    let news = [];
    let steamGames = [];

    req.app.locals.db.collection('games').find().limit(20).toArray((err, games) => {
        let promises = [];

        games.forEach((game) => {
            let steamAppId = null;
            for (let store of game.stores){
                if (store.store.name === "Steam"){
                    steamGames.push(game);
                    let steamURLParts = store.url_en.split('/');
                    steamAppId = steamURLParts[steamURLParts.indexOf('app') + 1];
                    break;
                }
            }

            let promise = axios.get('http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=' + steamAppId +'&count=1&maxlength=300&format=json');
            promises.push(promise);

        });

        // Wait for every promise and then process each
        axios.all(promises).then( (responses) => {
            responses.forEach((response, i) => {
                if (response.data.appnews.newsitems[0] !== null) {
                    news.push(response.data.appnews.newsitems[0]);
                }
            });

            res.render('news', { title: 'news', news: news, steamGames: steamGames});

        });


    });
});

module.exports = router;
