const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");

/* GET games listing. */
router.get('/', function(req, res, next) {
    let currentPage = getCurrentPage(req);

    let filtersCondition = {$match : {}};
    let paginationQuery = [{$skip: skipCalc(currentPage)}, {$limit: resultsPerPage} ];
    let sortQuery = null;

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
    if('star'in req.query) {
        let stars = req.query.star;
        star = stars.slice(-1).parseInt();
    }
    if(star !== 0){
        filtersCondition['$match']['rating_top'] = { $eq : star };
    }

    if('sorts' in req.query){
        let sorts = req.query.sorts;
        let descending = req.query.descending;
        if(descending === '')
            descending = true;
        let field = '';
        switch(sorts){
            case "Alphabetical":
                field = "name";
                break;
            case "Ratings":
                field = "rating";
                break;
            case "Release Date":
                field = "released";
        }
        let order = descending ? -1 : 1;
        sortQuery = {$sort: {field : order}};
    }


    let paginatedQuery = [filtersCondition].concat(paginationQuery);
    if(sortQuery !== null){
        paginatedQuery.push(sortQuery);
    }
    let countQuery = [filtersCondition].concat( { $count: 'totalCount' });

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
