const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");

/* GET games listing. */
router.get('/', function(req, res, next) {
    let currentPage = getCurrentPage(req);

    req.app.locals.db.collection('games').find().skip(skipCalc(currentPage)).limit(resultsPerPage).toArray().then((games) => {

        req.app.locals.db.collection('games').countDocuments().then( (count) => {
            res.render('games', { title: 'Games', pagination: paginationObject(currentPage, count), games: games });
        });

    });
});

module.exports = router;
