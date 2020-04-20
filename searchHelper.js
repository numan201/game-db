function searchQuery(req) {
    let searchQuery = '';

    if ('search' in req.query) searchQuery = req.query.search;

    return searchQuery;
}

module.exports = {
    searchQuery
};
