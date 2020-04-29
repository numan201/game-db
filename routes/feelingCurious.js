const express = require('express');
const router = express.Router();
const {getData} = require("../models/feelingCurious");

/* GET random game */
router.get('/', function (req, res) {

    getData(req.app.locals.db).then( (gameId) => {
        res.redirect("/game?id=" + gameId);
    });

});

module.exports = router;
