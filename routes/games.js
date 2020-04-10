const express = require('express');
const router = express.Router();
const {getCurrentPage, paginationObject, skipCalc, resultsPerPage} = require("../paginationHelper");

/* GET games listing. */
router.get('/', function(req, res, next) {
    let currentPage = getCurrentPage(req);


    let query = [{$unwind: "$genres"}, {$skip: skipCalc(currentPage)}, {$limit: resultsPerPage}];

    if ('genres' in req.query) {
        let genres = req.query.genres;
        if (!Array.isArray(req.query.genres)) {
            genres = [req.query.genres];
        }

        query.push({$match: {"genres.name": { $in : genres }}});
    }

    req.app.locals.db.collection('games').aggregate(query).toArray().then((games) => {
        req.app.locals.db.collection('games').countDocuments().then( (count) => {
            res.render('games', { title: 'Games', pagination: paginationObject(currentPage, count), games: games });
        });

    });
});

module.exports = router;
