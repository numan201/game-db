const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");

/* GET developers listing. */
router.get('/', function(req, res, next) {

    let currentPage = getCurrentPage(req);

    req.app.locals.db.collection('developers').find().sort({games_count: -1}).skip(skipCalc(currentPage)).limit(resultsPerPage).toArray().then((developers) => {
        req.app.locals.db.collection('developers').countDocuments().then((count) => {
            res.render('developers', {title: 'Developers', pagination: paginationObject(currentPage, count), developers: developers});
        });
    });
});

module.exports = router;
