const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");

/* GET developers listing. */
router.get('/', function(req, res, next) {

    let currentPage = getCurrentPage(req);

    let filtersCondition = {$match : {}};
    let paginationQuery = [{$skip: skipCalc(currentPage)}, {$limit: resultsPerPage} ];

    if('numbers' in req.query) {
        let numbers = req.query.numbers;

        numbers = parseInt(numbers);
        if (numbers === 200) {
            filtersCondition['$match']['games_count'] = {$gt: numbers};
        } else {
            filtersCondition['$match']['games_count'] = {$gt: numbers, $lt: numbers + 50};
        }
    }

    let paginatedQuery = [filtersCondition].concat(paginationQuery);
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
            developers: developers
        });
    });
});

module.exports = router;
