const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");
const {searchQuery} = require("../searchHelper");


/* GET games listing. */
router.get('/', function(req, res, next) {
    let currentPage = getCurrentPage(req);

    let filtersCondition = {$match : {}};
    let paginationQuery = [{$skip: skipCalc(currentPage)}, {$limit: resultsPerPage} ];
    let sortQuery = [];

    if ('search' in req.query && req.query.search.trim() !== '') {
        filtersCondition['$match']['$text'] = { $search : req.query.search };
        sortQuery = { $sort: { score: { $meta: "textScore" } } };
    }

    if ('genres' in req.query) {
        let genres = req.query.genres;
        if (!Array.isArray(req.query.genres)) {
            genres = [req.query.genres];
        }

        filtersCondition['$match']['genres.name'] = { $in : genres };
    }

    if ('platforms' in req.query) {
        let platforms = req.query.platforms;
        if (!Array.isArray(req.query.platforms)) {
            platforms = [req.query.platforms];
        }

        filtersCondition['$match']['platforms.platform.name'] = { $in : platforms };
    }

    let star = 0;
    if ('star' in req.query) {
        let stars = req.query.star;
        star = stars.slice(-1).parseInt();
    }
    if (star !== 0) {
        filtersCondition['$match']['rating_top'] = { $eq : star };
    }

    if ('sorts' in req.query) {
        let type = req.query.sorts.slice(0, 3);
        let descending = req.query.sorts.slice(-3) === "Des";
        let field = '';
        switch (type) {
            case "Alp":
                field = "name";
                break;
            case "Rat":
                field = "rating";
                break;
            case "Rel":
                field = "released";
        }

        let order = descending ? -1 : 1;

        sortQuery = {$sort: {[field] : order}};
    }

    let baseQuery = [filtersCondition].concat(sortQuery);
    let paginatedQuery = baseQuery.concat(paginationQuery);

    let countQuery = [filtersCondition].concat( { $count: 'totalCount' });

    let gamesPromise = req.app.locals.db.collection('games').aggregate(paginatedQuery).toArray();
    let gamesCountPromise = req.app.locals.db.collection('games').aggregate(countQuery).toArray();

    Promise.all([gamesPromise, gamesCountPromise]).then(([games, count]) => {
        res.render('games', {
            title: 'Games',
            pagination: paginationObject(currentPage,  count[0].totalCount, req.query),
            searchQuery: searchQuery(req),
            page: req.baseUrl,
            games: games
        });
    });


});

module.exports = router;
