const UniqueSet = require('../UniqueSet');

class Developer {

    constructor(id, req, promise) {
        let developerList = new UniqueSet();

        const cachePromise = new Promise(finish => this.checkCached(finish, req, id, promise))

        // Get publisher
        req.app.locals.db.collection('publishers').findOne({_id : id}).then((publisher) => {

            let gameIds = [];
            publisher.games.forEach((game) => {
                gameIds.push(game.id);
            });

            // Get games objects for publisher
            req.app.locals.db.collection('games').find({id: {$in: gameIds}}, {name: 1, background_image: 1, released: 1, reviews_count: 1}).toArray().then( (games) => {
                let gamesDevelopersPromises = [];

                // Get developers for each game
                games.forEach((game) => {
                    let gamesDevelopersPromise = req.app.locals.db.collection('developers').aggregate([{$unwind: "$games"}, {$match: {"games.id": game.id}}, {$project: {name: 1, games_count: 1, image_background: 1}}]).toArray();
                    gamesDevelopersPromises.push(gamesDevelopersPromise);
                });

                return Promise.all(gamesDevelopersPromises).then((gamesDevelopersPromises) => {
                    gamesDevelopersPromises.forEach((gamesDevelopersPromises) => {
                        gamesDevelopersPromises.forEach((developer) => {
                            developerList.add(developer);
                        })
                    });

                    return games;
                });
            }).then((games) => {
                let reviews = req.app.locals.db.collection('reviews').find({id:id.toLocaleString()}).toArray();
                return Promise.all([reviews]).then(([reviews]) => {
                    games.reviews = reviews;
                    return games;
                });
            }).then((games) => {
                cachePromise.then(cached => {
                    let developers = developerList.values();
                    let pubRender  = {title: publisher.name, page: req.baseUrl, publisher: publisher, games: games, developers: developers, reviews: games.reviews};
                    if(cached === false){
                        promise(pubRender);
                    }
                    req.app.locals.db.collection('cachedpublishers').replaceOne({_id: id}, pubRender, {upsert:true});
                    return pubRender;
                });
            });



        });


        }

    checkCached(resolve, req, id, promise){
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

                        promise(publisher);
                    });
                }
            }).catch(() => resolve(false));

    }

}

module.exports = Developer;
