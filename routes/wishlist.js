const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', require('connect-ensure-login').ensureLoggedIn('/'), function(req, res, next) {
    res.render('wishlist', { title: 'Wishlist' });
});

module.exports = router;
