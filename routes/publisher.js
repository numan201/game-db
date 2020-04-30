const express = require('express');
const router = express.Router();
const CreatorFactory = require('../models/creatorFactory');

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);

    new Promise(data => { new CreatorFactory('publisher', id, req, data)}).then( data => {
        res.render('publisher', data);
    });


});

module.exports = router;
