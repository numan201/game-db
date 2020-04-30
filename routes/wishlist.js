const express = require('express');
const router = express.Router();
const {remove, notRemove} = require("../models/wishlist");

/* GET wishlist page. */
router.get('/', require('connect-ensure-login').ensureLoggedIn('/'), function(req, res, next) {

    if ('remove' in req.query) {
        remove(req).then( () => {
            res.redirect('/wishlist');
        });

    } else {
        notRemove(req, res).then( (games) => {
            res.render('wishlist', {title: 'Wishlist', page: req.baseUrl, games: games});
        });
    }

});

module.exports = router;
