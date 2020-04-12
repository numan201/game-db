const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");

/* GET publishers listing. */
router.get('/', function(req, res, next) {

    let currentPage = getCurrentPage(req);

    req.app.locals.db.collection('publishers').find().sort({games_count: -1}).skip(skipCalc(currentPage)).limit(resultsPerPage).toArray().then((publishers) => {
        req.app.locals.db.collection('publishers').countDocuments().then((count) => {
            res.render('publishers', {title: 'Publishers', pagination: paginationObject(currentPage, count, req.query), publishers: publishers});
        });
    });
});

module.exports = router;
