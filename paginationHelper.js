const resultsPerPage = 20;

function getCurrentPage(req) {
    let currentPage = 1;

    if ('page' in req.query) {
        currentPage = parseInt(req.query.page);
    }

    return currentPage;
}

function skipCalc(currentPage) {
    return (currentPage - 1) * resultsPerPage;
}

function paginationObject(currentPage, count) {
    return {
        currentPage: currentPage,
        numberPages: Math.ceil(count / resultsPerPage)
    };
}



module.exports = {
    resultsPerPage,
    getCurrentPage,
    skipCalc,
    paginationObject
};

