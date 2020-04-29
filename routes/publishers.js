const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");
const {searchQuery, sortBy} = require("../searchSortHelper");
const {buildSearchQuery, buildFilterQuery, buildSortQuery, buildMongoQuery} = require("../models/developersPublishers");

/* GET publishers listing. */
router.get('/', function(req, res, next) {

    let currentPage = getCurrentPage(req);

    let filtersCondition = {$match : {}};
    let paginationQuery = [{$skip: skipCalc(currentPage)}, {$limit: resultsPerPage} ];

    let sortQuery = buildSearchQuery(filtersCondition, req);

    buildFilterQuery(filtersCondition, req, 'publishers');

    sortQuery = buildSortQuery(sortQuery, req);

    let paginatedQuery = buildMongoQuery(filtersCondition, sortQuery, paginationQuery);

    let countQuery = [filtersCondition].concat( { $count: 'totalCount' });

    let publishersPromise = req.app.locals.db.collection('publishers').aggregate(paginatedQuery).toArray();
    let publishersCountPromise = req.app.locals.db.collection('publishers').aggregate(countQuery).toArray();

    Promise.all([publishersPromise, publishersCountPromise]).then(([publishers, count]) => {
        if(count.length === 0){
            let totalCount = 0;
            count[0] = {totalcount: totalCount};
        }
        res.render('publishers', {
            title: 'Publishers',
            pagination: paginationObject(currentPage,  count[0].totalCount, req.query),
            searchQuery: searchQuery(req),
            sortBy: sortBy(req),
            page: req.baseUrl,
            publishers: publishers
        });
    });
});

module.exports = router;
