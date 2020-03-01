var express = require('express');
var router = express.Router();

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);

    req.app.locals.db.collection('games').findOne({_id : id}, (err, game) => {
        req.app.locals.db.collection('developers').
            aggregate([{$unwind: "$games"}, {$match: { "games.id" : game.id}}, {$project: {"name": 1}}]).toArray((err, developers) => {
                req.app.locals.db.collection('publishers').
                    aggregate([{$unwind: "$games"}, {$match: { "games.id" : game.id}}, {$project: {"name": 1}}]).toArray((err, publishers) => {

                        // Reviews counts
                        let reviewsCounts = [0, 0, 0, 0, 0];
                        game.ratings.forEach((rating) => {
                            reviewsCounts[rating.id - 1] = rating.count;
                        });
                        reviewsCounts.reverse();

                        res.render('game', {title: game.name, game: game, developers: developers, publishers: publishers, reviewsCounts: JSON.stringify(reviewsCounts)});
                });
        });
    });

});

module.exports = router;
