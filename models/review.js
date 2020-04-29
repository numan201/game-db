function findId(req){
    let id;
    if('gameId' in req.body){
        id = req.body.gameId;
    } else if('developerId' in req.body){
        id = req.body.developerId;
    } else if('publisherId' in req.body){
        id = req.body.publisherId;
    }
    return id;
}

function buildURL(id, req){
    let URL = "/";
    if('gameId' in req.body){
        URL = URL + "game?id=" + id;
    } else if('developerId' in req.body){
        URL = URL + "developer?id=" + id;
    } else if('publisherId' in req.body){
        URL = URL + "publisher?id=" + id;
    }
    return URL;
}

function buildReview(id, req){
    var time = Date.now();
    let newReview = {
        id: id,
        title: req.body.title,
        review: req.body.review,
        rating: req.body.userratings,
        username: req.user.displayName,
        userpicture: req.user.picture,
        time: time
    };
    req.app.locals.db.collection('reviews').insertOne(newReview);
}

module.exports = {
    findId,
    buildURL,
    buildReview
};