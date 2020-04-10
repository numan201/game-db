const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");

/* GET games listing. */
router.get('/', function(req, res, next) {
    let currentPage = getCurrentPage(req);

    let filtersQuery = [];
    let paginationQuery = [{$skip: skipCalc(currentPage)}, {$limit: resultsPerPage} ];

    if ('genres' in req.query) {
        let genres = req.query.genres;
        if (!Array.isArray(req.query.genres)) {
            genres = [req.query.genres];
        }

        filtersQuery.push({$match: {'genres.name': { $in : genres }}});
    }

    let paginatedQuery = filtersQuery.concat(paginationQuery);
    let countQuery = filtersQuery.concat( { $count: 'totalCount' });

    let gamesPromise = req.app.locals.db.collection('games').aggregate(paginatedQuery).toArray();
    let gamesCountPromise = req.app.locals.db.collection('games').aggregate(countQuery).toArray();

    Promise.all([gamesPromise, gamesCountPromise]).then(([games, count]) => {
        res.render('games', {
            title: 'Games',
            pagination: paginationObject(currentPage,  count[0].totalCount, req.query),
            games: games
        });
    });


});

module.exports = router;
