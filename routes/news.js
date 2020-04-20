const axios = require('axios');
const express = require('express');
const router = express.Router();
const { newsKey } = require('../keys');

/* GET games listing. */
router.get('/', function(req, res, next) {
    req.app.locals.db.collection('cachednews').find({ news_page : { $exists : 1 } }).count().then(articles_count => {
        console.log("Articles count : " + articles_count);
        if(articles_count === 0){
            return axios({
                method: 'get',
                url: 'http://newsapi.org/v2/everything',
                params: {q: "videogames", pageSize: 20, ApiKey: newsKey},
            })
                .then((response) => {
                    response.data.articles.forEach(article => {
                        article.news_page = true;
                        article.createdAt = new Date();
                    });
                    req.app.locals.db.collection('cachednews').insertMany(response.data.articles);
                    res.render('news', {
                        title: 'News',
                        news: response.data.articles,
                    });
                })
                .catch(err => news);
        }
        else{
            req.app.locals.db.collection('cachednews').find({ news_page : { $exists : 1 } }).toArray().then(articles => {
                res.render('news', {
                    title: 'News',
                    news: articles,
                });
            })
                .catch(err => news);
        }
    });
});
//res.render('news', { title: 'News', news: news, steamGames: steamGames});
module.exports = router;
