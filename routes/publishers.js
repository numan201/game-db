const express = require('express');
const router = express.Router();

/* GET publishers listing. */
router.get('/', function(req, res, next) {
    req.app.locals.db.collection('publishers').find().limit(20).toArray((err, publishers) => {
        res.render('publishers', { title: 'Publishers', publishers: publishers });
    });
});

module.exports = router;
