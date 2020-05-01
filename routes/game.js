const express = require('express');
const router = express.Router();
const { getGameData } = require('../models/game.js');

/* GET games listing. */
router.get('/', function(req, res) {
    const promise = new Promise(data => {getGameData(data, req);});
    promise.then(data => {res.render('game', data)})
});

module.exports = router;
