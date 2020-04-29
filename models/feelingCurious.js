function getData(db) {

    return db.collection('games').aggregate([{$sample: {size: 1}}]).toArray().then((game) => {
        return game[0]._id.toString()
    });

}

module.exports = {
    getData
};


