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

    let publisherList = new UniqueSet();
    req.app.locals.db.collection('developers').findOne({_id : id}, (err, developer) => {
        let waitGame = new Promise(resolve => {
            developer.games.forEach((game, i, object) => {
                req.app.locals.db.collection('games').findOne({id: game.id}, {name: 1, background_image: 1, released: 1, reviews_count: 1}, (err, gameFound) => {
                    if (gameFound == null) {
                        console.log("ENTRY FOR GAME " + developer.games[i].name + " NOT FOUND");
                        developer.games.splice(i, 1);
                        if (i == developer.games.length) resolve();
                    }
                    else {
                        game.instance = gameFound;

                        let promise = new Promise(resolve1 => {
                            req.app.locals.db.collection('publishers').aggregate([{ $unwind: "$games" }, { $match: { "games.id": game.instance.id } },
                            { $project: { "name": 1, games_count: 1, image_background: 1 } }]).toArray((err, publishers) => {

                                publishers.forEach((publisher, j) => {
                                    publisherList.add(publisher);
                                    if (j == publishers.length - 1) resolve1();
                                });
                                if (publishers.length == 0) resolve1();
                            });
                        });

                        promise.catch(() => {
                            console.log("ERROR REQUESTING PUBLISHERS WITH DEVELOPER " + developer.name);// + " AND GAME " + gameFound.name);
                        });

                        promise.then(() => {
                            if (i == developer.games.length - 1) resolve();
                        });
                    }
                });
            });
        });

        waitGame.then(() => {
            developer.publishers = publisherList.values();
            res.render('developer', {title: developer.name, developer: developer, games: developer.games, publishers: developer.publishers});
        });
    });

});

module.exports = router;
