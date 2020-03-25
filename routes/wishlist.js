const express = require('express');
const router = express.Router();

/* GET wishlist page. */
router.get('/', require('connect-ensure-login').ensureLoggedIn('/'), function(req, res, next) {

    if ('remove' in req.query) {
        let userId = require('mongodb').ObjectID(req.user._id);
        req.app.locals.db.collection('users').updateOne({_id: userId}, {$pull: {wishlist: req.query.remove}}).then((resp, err) => {
            res.redirect('/wishlist');
        });

    } else {

        let wishlist = req.user.wishlist;
        for (let i = 0; i < wishlist.length; i++) {
            wishlist[i] = require('mongodb').ObjectID(wishlist[i]);
        }

        req.app.locals.db.collection('games').find({_id: {$in: wishlist}}).toArray().then((games) => {
            res.render('wishlist', {title: 'Wishlist', games: games});
        });

    }

});

module.exports = router;
