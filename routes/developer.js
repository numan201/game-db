var express = require('express');
var router = express.Router();

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);

    req.app.locals.db.collection('developers').findOne({_id : id}, (err, developer) => {
        //Making a promise to for synchronous
        var wait = new Promise((resolve, reject) => {
            developer.games.forEach((game, i) => {
                req.app.locals.db.collection('games').findOne({id: game.id}, (err, gameFound) => {
                    game.instance = gameFound;
                    if(i == developer.games.length - 1) resolve();
                });
            });
        });
        wait.then(() => {
            console.log(developer.games);
            res.render('developer', {title: developer.name, developer: developer, games: developer.games});
        });
    });

});

module.exports = router;
