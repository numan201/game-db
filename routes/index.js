const express = require('express');
const router = express.Router();
let new_releases = [];
let top_rated = [];
const axios = require('axios');
const { youtubeKey, newsKey } = require('../keys');

/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.db.collection('games').find().limit(200).sort({released: -1}).collation({ //limit is 200 to account for all the games released after current date
    locale: "en_US",
    numericOrdering: true
  }).toArray().then(newest => {
    let current_date = new Date();

    newest.forEach((game, i) => {
      let game_date = new Date(game.released);
      if (new_releases.length < 10) { //only wanna show most recent 10
        if (game_date.getTime() < current_date.getTime()){
          new_releases.push(game);
        }
      }
    });
  }).then(not_sure => {
    req.app.locals.db.collection('games').find().limit(100).sort({metacritic: -1}).toArray().then(top_rated_promise => {
      top_rated_promise.forEach((game, i) => {
        top_rated.push(game);
      });
    })
      .then(news => {

        return axios({
          method: 'get',
          url: 'http://newsapi.org/v2/everything',
          params: {q: "videogames", pageSize: 10, ApiKey: newsKey},
        })
            .then((response) => {
              res.render('index', {
                title: 'Home',
                new_releases: new_releases,
                news: response.data.articles,
                top_rated: top_rated
              });
            })
            .catch(err => news);
      });
  });
});

module.exports = router;