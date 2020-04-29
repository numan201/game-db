function remove(req) {
    let userId = require('mongodb').ObjectID(req.user._id);
    req.app.locals.db.collection('users').updateOne({_id: userId}, {$pull: {wishlist: req.query.remove}});
}

function notRemove(req, res) {
    let wishlist = req.user.wishlist;
    for (let i = 0; i < wishlist.length; i++) {
        wishlist[i] = require('mongodb').ObjectID(wishlist[i]);
    }

    return req.app.locals.db.collection('games').find({_id: {$in: wishlist}}).toArray();
}

module.exports = {
    remove,
    notRemove
};