class UniqueSet {
    constructor() {
        this.map = new Map();
        this[Symbol.iterator] = this.values;
    }
    add(item) {
        this.map.set(JSON.stringify(item), item);
    }
    values() {
        return [...this.map.values()];
    }
    delete(item) {
        return this.map.delete(JSON.stringify(item));
    }
}

module.exports = UniqueSet;