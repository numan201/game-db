const Developer = require('../models/Developer');
const Publisher = require('../models/Publisher');

class CreatorFactory {

    constructor(type, id, req, promise) {
        if (type === "developer") {
            return new Developer(id, req, promise);
        } else if (type === "publisher") {
            return new Publisher(id, req, promise);
        } else {
            throw new Error('Invalid Type');
        }
    }
}

module.exports = CreatorFactory;
