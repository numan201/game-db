const express = require('express');
const router = express.Router();

router.get('/review', (req, res) => {
    let gameURL = "/game?id=" + req.body.gameId;
    let newReview = {
        accountId: req.body.userId,
        gameId: req.body.gameId,
        title: req.body.title,
        review: req.body.review,
        rating: req.body.userratings
    };
    app.locals.db.collection('reviews').insertOne(newReview);
    res.redirect(gameURL);
});

module.exports = router;