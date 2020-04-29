function buildSearchQuery(filtersCondition, req){
    let sortQuery = [];

    if ('search' in req.query && req.query.search.trim() !== '') {
        filtersCondition['$match']['$text'] = { $search : req.query.search };
        sortQuery = { $sort: { score: { $meta: "textScore" } } };
    }
    return sortQuery;
}

function buildFilterQuery(filtersCondition, req, type){
    let max;
    if(type === 'developers'){
        max = 200;
    } else {
        max = 500;
    }
    if ('numbers' in req.query) {
        let numbers = req.query.numbers;

        numbers = parseInt(numbers);
        if (numbers === max) {
            filtersCondition['$match']['games_count'] = {$gt: numbers};
        } else {
            filtersCondition['$match']['games_count'] = {$gt: numbers, $lt: numbers + 50};
        }
    }
}

function buildSortQuery(sortQuery, req){
    if ('sorts' in req.query && req.query.sorts.trim() !== '') {
        if(req.query.sorts !== 'Relevance') {
            let type = req.query.sorts.slice(0, 3);
            let descending = req.query.sorts.slice(-3) === "Des";
            let field = '';
            if (type === 'Alp') {
                field = "name";
            } else {
                field = "games_count";
            }
            let order = descending ? -1 : 1;
            sortQuery = {$sort: {[field]: order}};
        }
    }
    return sortQuery;
}

function buildMongoQuery(filtersCondition, sortQuery, paginationQuery){
    let baseQuery = [filtersCondition].concat(sortQuery);
    return baseQuery.concat(paginationQuery);
}

module.exports = {
    buildSearchQuery,
    buildFilterQuery,
    buildSortQuery,
    buildMongoQuery
};