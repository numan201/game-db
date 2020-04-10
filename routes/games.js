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

        filtersQuery.push({$unwind: "$genres"}, {$match: {"genres.name": { $in : genres }}});
    }

    let paginatedQuery = filtersQuery.concat(paginationQuery);


    req.app.locals.db.collection('games').aggregate(paginatedQuery).toArray().then((games) => {
        req.app.locals.db.collection('games').aggregate(filtersQuery.concat({$count: 'count'})).toArray().then( (result) => {
            res.render('games', { title: 'Games', pagination: paginationObject(currentPage, result[0].count, req.query), games: games });
        });

    });
});

module.exports = router;
