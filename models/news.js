const axios = require('axios');
const express = require('express');
const { newsKey } = require('../keys');

function getNews(resolve, req){
    req.app.locals.db.collection('cachednews').find({ news_page : { $exists : 1 } }).count().then(articles_count => {
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
                    resolve(response.data.articles);
                })
                .catch(err => news);
        }
        else{
            req.app.locals.db.collection('cachednews').find({ news_page : { $exists : 1 } }).toArray().then(articles => {
                resolve(articles);
            })
                .catch(err => news);
        }
    });
}
module.exports = {
    getNews
};
