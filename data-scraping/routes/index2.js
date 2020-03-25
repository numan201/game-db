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
            db.collection('developers2').insertMany(response.data.results);
            console.log("Loaded: " + nextURL)

            re(response.data.next, db);
        })
        .catch(function (error) {
            console.log("********RAWG RETYRING*************" + nextURL);
            sleep(10000).then( () => re(nextURL, db));
        });

}


/* GET home page. */
router.get('/', function(req, res, next) {
    let db = req.app.locals.db;
    let nextURL = 'https://api.rawg.io/api/developers?page_size=400000000000000000000000000';
    re(nextURL, db);

    res.render('index', { title: 'RAAWG Game API' });
});


module.exports = router;
