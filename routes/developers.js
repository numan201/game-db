const express = require('express');
const router = express.Router();

/* GET developers listing. */
router.get('/', function(req, res, next) {
    req.app.locals.db.collection('developers').find().limit(20).toArray().then((developers) => {
        res.render('developers', { title: 'Developers', developers: developers });
    });
});

module.exports = router;
