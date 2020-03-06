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

    let developerList = new UniqueSet();
    req.app.locals.db.collection('publishers').findOne({_id : id}, (err, publisher) => {
        //Making a promise to for synchronous
        let waitGame = new Promise((resolve, reject) => {
            publisher.games.forEach((game, i) => {
                req.app.locals.db.collection('games').findOne({id: game.id}, {name: 1, background_image: 1, released: 1, reviews_count: 1}, (err, gameFound) => {
                    if (gameFound == null) {
                        console.log("ENTRY FOR GAME " + publisher.games[i].name + " NOT FOUND");
                        publisher.games.splice(i, 1);
                        if (i == publisher.games.length) resolve();
                    }
                    else {
                        game.instance = gameFound;

                        let promise = new Promise(resolve1 => {
                            req.app.locals.db.collection('developers').aggregate([{ $unwind: "$games" }, { $match: { "games.id": game.instance.id } },
                            { $project: { "name": 1, games_count: 1, image_background: 1 } }]).toArray((err, developers) => {

                                developers.forEach((developer, j) => {
                                    developerList.add(developer);
                                    if (j == developers.length - 1) resolve1();
                                });
                                if (developers.length == 0) resolve1();
                            });
                        });

                        promise.then(() => {
                            if (i == publisher.games.length - 1) resolve();
                        });
                    }
                });
            });
        });

        waitGame.then(() => {
            publisher.developers = developerList.values();
            res.render('publisher', {title: publisher.name, publisher: publisher, games: publisher.games, developers: publisher.developers});
        });
    });

});

module.exports = router;
