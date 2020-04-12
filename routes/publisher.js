const express = require('express');
const router = express.Router();

class UniqueSet {
    constructor() {
        this.map = new Map();
        this[Symbol.iterator] = this.values;
    }
    add(item) {
        this.map.set(JSON.stringify(item), item);
    }
    values() {
        return this.map.values();
    }
    delete(item) {
        return this.map.delete(JSON.stringify(item));
    }
}

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);
    let reviews = null;

    let developerList = new UniqueSet();

    // Get publisher
    req.app.locals.db.collection('publishers').findOne({_id : id}).then((publisher) => {

        let gameIds = [];
        publisher.games.forEach((game) => {
            gameIds.push(game.id);
        });

        // Get games objects for publisher
        req.app.locals.db.collection('games').find({id: {$in: gameIds}}, {name: 1, background_image: 1, released: 1, reviews_count: 1}).toArray().then( (games) => {
            let gamesDevelopersPromises = [];

            // Get developers for each game
            games.forEach((game) => {
                let gamesDevelopersPromise = req.app.locals.db.collection('developers').aggregate([{$unwind: "$games"}, {$match: {"games.id": game.id}}, {$project: {name: 1, games_count: 1, image_background: 1}}]).toArray();
                gamesDevelopersPromises.push(gamesDevelopersPromise);
            });

            return Promise.all(gamesDevelopersPromises).then((gamesDevelopersPromises) => {
                gamesDevelopersPromises.forEach((gamesDevelopersPromises) => {
                    gamesDevelopersPromises.forEach((developer) => {
                        developerList.add(developer);
                    })
                });

                return games;
            });
            let reviewPromise = new Promise(resolve2 => {
                req.app.locals.db.collection('reviews').find({id:id.toLocaleString()}).toArray().then((result) => {
                    reviews = result;
                    resolve2();
                });
            });

        }).then((games) => {
            let developers = developerList.values();
            res.render('publisher', {title: publisher.name, publisher: publisher, games: games, developers: developers, reviews: reviews});
        });



    });

});

module.exports = router;
