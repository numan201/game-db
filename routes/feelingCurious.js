const express = require('express');
const router = express.Router();

/* GET random game */
router.get('/', function (req, res) {
    req.app.locals.db.collection('games').aggregate([ { $sample: { size: 1 } } ]).toArray().then( (game) => {
        let gameId = game[0]._id.toString()
        res.redirect("/game?id=" + gameId);
    });
});

module.exports = router;
