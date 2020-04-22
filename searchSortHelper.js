function searchQuery(req) {
    let searchQuery = '';

    if ('search' in req.query) searchQuery = req.query.search;

    return searchQuery;
}

function sortBy(req) {
    let sortBy = '';

    if ('sorts' in req.query) sortBy = req.query.sorts;

    return sortBy;
}


module.exports = {
    searchQuery,
    sortBy
};
