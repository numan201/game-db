var express = require('express');
var router = express.Router();

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

    let publisherList = new UniqueSet();
    req.app.locals.db.collection('developers').findOne({_id : id}, (err, developer) => {
        //Making a promise to for synchronous
        let waitGame = new Promise((resolve, reject) => {
            developer.games.forEach((game, i) => {
                req.app.locals.db.collection('games').findOne({id: game.id}, {name: 1, background_image: 1, released: 1, reviews_count: 1}, (err, gameFound) => {
                    game.instance = gameFound;

                    let promise =  new Promise(resolve1 => {
                        req.app.locals.db.collection('publishers').aggregate([{$unwind: "$games"}, {$match: {"games.id": game.instance.id}},
                            {$project: {"name": 1, games_count : 1, image_background: 1}}]).toArray((err, publishers) => {

                            publishers.forEach((publisher, j) => {
                                publisherList.add(publisher);
                                if(j == publishers.length - 1) resolve1();
                            });
                        });
                    });

                    promise.then(() => {
                        if(i == developer.games.length - 1) resolve();
                    });
                });
            });
        });

        waitGame.then(() => {
            developer.publishers = publisherList.values();
            console.log(developer);
            res.render('developer', {title: developer.name, developer: developer, games: developer.games, publishers: developer.publishers});
        });
    });

});

module.exports = router;
