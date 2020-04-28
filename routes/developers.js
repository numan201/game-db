const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");
const {searchQuery, sortBy} = require("../searchSortHelper");
const {buildSearchQuery, buildFilterQuery, buildSortQuery, buildMongoQuery} = require("../models/developersPublishersModel");

/* GET developers listing. */
router.get('/', function(req, res, next) {

    let currentPage = getCurrentPage(req);

    let filtersCondition = {$match : {}};
    let paginationQuery = [{$skip: skipCalc(currentPage)}, {$limit: resultsPerPage} ];

    let sortQuery = buildSearchQuery(filtersCondition, req);

    buildFilterQuery(filtersCondition, req, 'developers');

    sortQuery = buildSortQuery(sortQuery, req);

    let paginatedQuery = buildMongoQuery(filtersCondition, sortQuery, paginationQuery);

    let countQuery = [filtersCondition].concat( { $count: 'totalCount' });

    let developersPromise = req.app.locals.db.collection('developers').aggregate(paginatedQuery).toArray();
    let developersCountPromise = req.app.locals.db.collection('developers').aggregate(countQuery).toArray();

    Promise.all([developersPromise, developersCountPromise]).then(([developers, count]) => {
        if(count.length === 0){
            let totalCount = 0;
            count[0] = {totalcount: totalCount};
        }

        res.render('developers', {
            title: 'Developers',
            pagination: paginationObject(currentPage,  count[0].totalCount, req.query),
            searchQuery: searchQuery(req),
            sortBy: sortBy(req),
            page: req.baseUrl,
            developers: developers
        });
    });
});

module.exports = router;
