const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");

/* GET publishers listing. */
router.get('/', function(req, res, next) {

    let currentPage = getCurrentPage(req);

    let filtersCondition = {$match : {}};
    let paginationQuery = [{$skip: skipCalc(currentPage)}, {$limit: resultsPerPage} ];

    if('numbers' in req.query) {
        let numbers = req.query.numbers;

        numbers = parseInt(numbers);
        if (numbers === 500) {
            filtersCondition['$match']['games_count'] = {$gt: numbers};
        } else {
            filtersCondition['$match']['games_count'] = {$gt: numbers, $lt: numbers + 50};
        }
    }

    let paginatedQuery = [filtersCondition].concat(paginationQuery);
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
            publishers: publishers
        });
    });
});

module.exports = router;
