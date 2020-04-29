const express = require('express');
const router = express.Router();
const axios = require('axios');
const {getData} = require("../models/about");

/* GET about */
router.get('/', function(req, res) {

    getData(req.app.locals.db).then((aboutData) => {
        aboutData = Object.assign(aboutData, {title: 'About', page: req.baseUrl});
        res.render('about', aboutData);
    });

});

module.exports = router;
