const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");
const {searchQuery} = require("../searchHelper");

/* GET publishers listing. */
router.get('/', function(req, res, next) {

    let currentPage = getCurrentPage(req);

    let filtersCondition = {$match : {}};
    let paginationQuery = [{$skip: skipCalc(currentPage)}, {$limit: resultsPerPage} ];

    let sortQuery = [];

    if ('search' in req.query) {
        filtersCondition['$match']['$text'] = { $search : req.query.search };
        sortQuery = { $sort: { score: { $meta: "textScore" } } };
    }

    if ('numbers' in req.query) {
        let numbers = req.query.numbers;

        numbers = parseInt(numbers);
        if (numbers === 500) {
            filtersCondition['$match']['games_count'] = {$gt: numbers};
        } else {
            filtersCondition['$match']['games_count'] = {$gt: numbers, $lt: numbers + 50};
        }
    }

    if ('sorts' in req.query) {
        let type = req.query.sorts.slice(0, 3);
        let descending = req.query.sorts.slice(-3) === "Des";
        let field = '';
        if (type === 'Alp') {
            field = "name";
        } else {
            field = "games_count";
        }
        let order = descending ? -1 : 1;
        sortQuery = {$sort: {[field] : order}};
    }

    let baseQuery = [filtersCondition].concat(sortQuery);
    let paginatedQuery = baseQuery.concat(paginationQuery);

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
            publishers: publishers,
            page: req.baseUrl,
            searchQuery: searchQuery(req)
        });
    });
});

module.exports = router;
