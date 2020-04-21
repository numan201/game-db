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
        return [...this.map.values()];
    }
    delete(item) {
        return this.map.delete(JSON.stringify(item));
    }
}

function checkCached(resolve, req, res, id){
    req.app.locals.db.collection('cacheddevelopers').findOne({_id: id})
        .then(developer => {
            if(developer == null){
                resolve(false);
            }
            else{
                res.render('developer', developer);
                resolve(true);
            }
        }).catch(err => resolve(false));
}

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);
    let publisherList = new UniqueSet();

    const cachePromise = new Promise(finish => checkCached(finish, req, res, id))

    // Get developer
    req.app.locals.db.collection('developers').findOne({_id : id}).then((developer) => {

        let gameIds = [];
        developer.games.forEach((game) => {
            gameIds.push(game.id);
        });

        // Get games objects for developer
        req.app.locals.db.collection('games').find({id: {$in: gameIds}}, {name: 1, background_image: 1, released: 1, reviews_count: 1}).toArray().then( (games) => {
            let gamesPublishersPromises = [];

            // Get publishers for each game
            games.forEach((game) => {
                let gamePublishersPromise = req.app.locals.db.collection('publishers').aggregate([{$unwind: "$games"}, {$match: {"games.id": game.id}}, {$project: {name: 1, games_count: 1, image_background: 1}}]).toArray();
                gamesPublishersPromises.push(gamePublishersPromise);
            });

            return Promise.all(gamesPublishersPromises).then((gamesPublishersPromises) => {
                gamesPublishersPromises.forEach((gamePublishersPromise) => {
                    gamePublishersPromise.forEach((publisher) => {
                        publisherList.add(publisher);
                    })
                });

                return games;
            });

        }).then((games) => {
            let reviews = req.app.locals.db.collection('reviews').find({id:id.toLocaleString()}).toArray();
            return Promise.all([reviews]).then(([reviews]) => {
                games.reviews = reviews;
                return games;
            });
        }).then((games) => {
            cachePromise.then(cached => {
                let publishers = publisherList.values();
                let devRender  = {title: developer.name, page: req.baseUrl, developer: developer, games: games, publishers: publishers, reviews: games.reviews};
                if(cached == false){
                    res.render('developer', devRender);
                }
                req.app.locals.db.collection('cacheddevelopers').replaceOne({_id: id}, devRender, {upsert:true});
                return devRender;
            });
        });
    });

});

module.exports = router;
