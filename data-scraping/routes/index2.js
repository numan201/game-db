const express = require('express');
const router = express.Router();
const axios = require('axios');


const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};



function re(nextURL, db) {
    if (nextURL === null) return;

    axios.get(nextURL)
        .then(function (response) {
            db.collection('publishers').insertMany(response.data.results);
            console.log("Loaded: " + nextURL)

            re(response.data.next);
        })
        .catch(function (error) {
            console.log("********RAWG RETYRING*************");
            sleep(10000).then( () => re(nextURL));
        });

}


/* GET home page. */
router.get('/', function(req, res, next) {
    let db = req.app.locals.db('game-db');
    let nextURL = 'https://api.rawg.io/api/publishers?page_size=200000000000000000000';
    re(nextURL, db);

    res.render('index', { title: 'RAAWG Game API' });
});


module.exports = router;
