const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    let URL = "/";
    let id;
    if('gameId' in req.body){
        id = req.body.gameId;
        URL = URL + "game?id=" + id;
    } else if('developerId' in req.body){
        id = req.body.developerId;
        URL = URL + "developer?id=" + id;
    } else if('publisherId' in req.body){
        id = req.body.publisherId;
        URL = URL + "publisher?id=" + id;
    }
    var time = Date.now();
    if(!('userratings' in req.body)){
        res.redirect(URL);
    }
    let newReview = {
        id: id,
        title: req.body.title,
        review: req.body.review,
        rating: req.body.userratings,
        username: req.user.displayName,
        userpicture: req.user.picture,
        time: time
    };
    req.app.locals.db.collection('reviews').insertOne(newReview);
    res.redirect(URL);
});

module.exports = router;