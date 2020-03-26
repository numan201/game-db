const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    let gameURL = "/game?id=" + req.body.gameId;
    var time = Date.now();
    let newReview = {
        gameId: req.body.gameId,
        title: req.body.title,
        review: req.body.review,
        rating: req.body.userratings,
        username: req.user.displayName,
        userpicture: req.user.picture,
        time: time
    };
    req.app.locals.db.collection('reviews').insertOne(newReview);
    res.redirect(gameURL);
});

module.exports = router;