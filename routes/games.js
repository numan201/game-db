const express = require('express');
const router = express.Router();

/* GET games listing. */
router.get('/', function(req, res, next) {
    req.app.locals.db.collection('games').find().limit(20).toArray().then((games) => {
        res.render('games', { title: 'Games', games: games });
    });
});

module.exports = router;
