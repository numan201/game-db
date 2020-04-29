const axios = require('axios');
const express = require('express');
const router = express.Router();
const { newsKey } = require('../keys');
const {getNews} = require('../models/news');

/* GET games listing. */
router.get('/', function(req, res, next) {
    const promise = new Promise(resolve => {getNews(resolve, req);});
    promise.then(articles => {
        res.render('news', {
            title: 'News',
            news: articles,
            page: req.baseUrl
        });
    });
});
module.exports = router;
