const express = require('express');
const router = express.Router();
let new_releases = [];
let top_rated_switch = [];
let top_rated_ps4 = [];
let top_rated_pc = [];
let top_rated_xbone = [];
const games_per_platform = 5;
const news_expiration_hours = 24;
const axios = require('axios');
const { newsKey } = require('../keys');

function addGameToPlatform(game){
  game.platforms.forEach((platform, i) => {
    let PC = platform.platform.name.localeCompare("PC");
    let PS4 = platform.platform.name.localeCompare("PlayStation 4");
    let Switch = platform.platform.name.localeCompare("Nintendo Switch");
    let xbone = platform.platform.name.localeCompare("Xbox One");
    if (PC == 0) {
      if(top_rated_pc.length < games_per_platform) top_rated_pc.push(game);
    }
    if (PS4 == 0) {
      if(top_rated_ps4.length < games_per_platform) top_rated_ps4.push(game);
    }
    if (Switch == 0) {
      if(top_rated_switch.length < games_per_platform) top_rated_switch.push(game);
    }
    if (xbone == 0) {
      if(top_rated_xbone.length < games_per_platform) top_rated_xbone.push(game);
    }
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  req.app.locals.db.collection('games').find().limit(250).sort({released: -1}).collation({ //limit is 200 to account for all the games released after current date
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
          addGameToPlatform(game);
        });
    })
      .then(news => {
        req.app.locals.db.collection('cachednews').createIndex( { "createdAt": 1 }, { expireAfterSeconds: 3600 * news_expiration_hours } );
        req.app.locals.db.collection('cachednews').find({ front_page : { $exists : 1 } }).count().then(articles_count => {
          console.log("Articles count : " + articles_count);
          if(articles_count === 0){
            return axios({
              method: 'get',
              url: 'http://newsapi.org/v2/everything',
              params: {q: "videogames", pageSize: 10, ApiKey: newsKey},
            })
                .then((response) => {
                  response.data.articles.forEach(article => {
                    article.front_page = true;
                    article.createdAt = new Date();
                  });
                  req.app.locals.db.collection('cachednews').insertMany(response.data.articles);
                  res.render('index', {
                    title: 'Home',
                    new_releases: new_releases,
                    news: response.data.articles,
                    top_rated_switch: top_rated_switch,
                    top_rated_pc: top_rated_pc,
                    top_rated_ps4: top_rated_ps4,
                    top_rated_xbone: top_rated_xbone
                  });
                })
                .catch(err => news);
          }
          else{
            req.app.locals.db.collection('cachednews').find({ front_page : { $exists : 1 } }).toArray().then(articles => {
              res.render('index', {
                title: 'Home',
                page: req.baseUrl,
                new_releases: new_releases,
                news: articles,
                top_rated_switch: top_rated_switch,
                top_rated_pc: top_rated_pc,
                top_rated_ps4: top_rated_ps4,
                top_rated_xbone: top_rated_xbone
              });
            })
                .catch(err => news);
          }
        });
      });
  });
});

module.exports = router;
