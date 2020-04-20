const express = require('express');
const router = express.Router();
const axios = require('axios');
const app = express();
ObjectID = require('mongodb').ObjectID


function getRandomGameURL(req) {
    let games = req.app.locals.db.collection('games');
    let randNum = Math.floor(Math.random() * games.count);
    let randGame = games.find().limit(1).skip(randNum);
    return "/game?id=" + randGame._id;
}

//router.get('/', getRandomGameURL);
/* GET random game */
router.get('/', function (req, res) {
    let games = req.app.locals.db.collection('games');

    //let randNum = Math.floor(Math.random() * games.count);
    //let randGame = games.find().limit(1).skip(randNum);
    //let t = req.app.locals.db.collection('games').aggregate().toArray();
    let randGame = req.app.locals.db.collection('games').aggregate([ { $sample: { size: 1 } } ]);
    //let r = String(randGame._id);//randGame._id;
    let r2 = "5e7ab6bb6b5b29159f03e659";
    //res.redirect("/game?id=" + r);//5e7ab6bb6b5b29159f03e659");//+ randGame._id;
    req.app.locals.db.collection('games').aggregate([ { $sample: { size: 1 } } ]).toArray().then( (game) => {
        //let r = require('mongodb').ObjectID(game._id);
        let r = game._id
        r = r.toString();
            res.redirect("/game?id=" + r);
        }
    );
});

//res.render('feelingCurious', {
//             title: 'Feeling Curious',
//             page: req.baseUrl,
//             req: req,
//             games: games
//         });
//, getRandomGameURL(req, res)); //{
//     let games = req.app.locals.db.collection('games');
//     let randNum = Math.floor(Math.random() * games.count);
//     let randGame = games.find().limit(1).skip(randNum);
//     let gameUrl = "/game?id=" + randGame._id;//5e7ab6bb6b5b29159f03e659
//     app.get('/', function(req, res) {
//         res.redirect('/');
//     });
//     //res.redirect('/');
// });
//new ObjectID.createFromHexString("/game?id=ab6bb6b5b29159f03e659")
// router.get('/', function(req, res, next) {
//     let games = req.app.locals.db.collection('games');
//     let randNum = Math.floor(Math.random() * games.count);
//     let randGame = games.find().limit(1).skip(randNum);
//     let gameUrl = "/game?id=" + randGame._id;
//     res.redirect(gameUrl);
// });
//
//     app.get('/', function(req, res) {
//         //var string = encodeURIComponent('something that would break');
//         res.redirect(gameUrl);
//     });

    // http.get('*',function(req,res){
    //     res.redirect('http://exmple.com'+req.url)
    // })

    // response.writeHead(301,
    //     {Location: gameUrl}
    // );
    // response.end();


    //window.location = gameUrl;
    //router.get().replace(gameUrl);
    // window.onload = function() {
    //     // similar behavior as an HTTP redirect
    //     window.location.replace(gameUrl);
    // }
    // req.app.locals.db.collection('games').find({_id: {$in: randGame}}).toArray().then((games) => {
    //     res.render('feelingCurious', {title: 'Feeling Curious', page: req.baseUrl, games: games, gameUrl: gameUrl});
    // });
    // req.app.locals.db.collection('games').find().limit(1).skip(randNum).toArray().then((randGame) => {
    //     ('feelingCurious', {
    //         title: 'Feeling Curious',
    //         page: req.baseUrl,
    //         game: randGame
    //     });
    // });

module.exports = router;