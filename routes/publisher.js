const express = require('express');
const router = express.Router();
const CreatorFactory = require('../models/creatorFactory');

function checkCached(resolve, req, res, id){
    req.app.locals.db.collection('cachedpublishers').findOne({_id: id})
        .then(publisher => {
            if(publisher == null){
                resolve(false);
            }
            else{
                let reviews = req.app.locals.db.collection('reviews').find({id:id.toLocaleString()}).toArray();
                Promise.all([reviews]).then(([reviews]) => {
                    resolve(true);
                    publisher.reviews = reviews;
                    res.render('publisher', publisher);
                });
            }
        }).catch(err => resolve(false));
}

/* GET games listing. */
router.get('/', function(req, res, next) {
    let id = require('mongodb').ObjectID(req.query.id);

    new Promise(data => { new CreatorFactory('publisher', id, req, data)}).then( data => {
        res.render('publisher', data);
    });


});

module.exports = router;
