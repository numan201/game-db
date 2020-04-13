const axios = require('axios');
const express = require('express');
const router = express.Router();
const { newsKey } = require('../keys');

/* GET games listing. */
router.get('/', function(req, res, next) {

    axios({
        method: 'get',
        url: 'http://newsapi.org/v2/everything',
        params: {q: "videogames", pageSize: 20, ApiKey: newsKey},
    }).then((response) => {
        res.render('news', {title: 'News', news: response.data.articles})
    });

});
//res.render('news', { title: 'News', news: news, steamGames: steamGames});
module.exports = router;
