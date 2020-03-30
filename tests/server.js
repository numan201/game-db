const expect  = require("chai").expect;
const request = require("request");
const express = require('express');
const app = express();

const pages = ["about", "news", "games", "developers", "publishers"];
//const app = require('../app');


describe("Load Splash Page", function() {
    this.timeout(5000);
    var url = "http://localhost:3000/";
    it("Returns status 200", function(done){
        request(url, function(error, response, body) {
            expect(response.statusCode).to.equal(200);
            done();
        });
    });
});

pages.forEach((page, i) => {
    describe("Load " + page + " Page", function() {
        var url = "http://localhost:3000/" + page;
        it("Returns status 200", function(done){
            request(url, function(error, response, body) {
                expect(response.statusCode).to.equal(200);
                done();
            });
        });
    });
});

const { mongoKey } = require('../keys');
let MongoClient = require('mongodb').MongoClient;

MongoClient.connect(mongoKey, {useUnifiedTopology: true}, function (err, client) {
    if (err) throw err;
    app.locals.db = client.db('game-db');

    app.locals.db.collection('games').find().limit(1).toArray().then((gamePromise) => {
        let game = gamePromise[0];
        let describeString = "Test sample game " + game.name;
        describe(describeString, function () {
            this.timeout(5000);
            var url = "http://localhost:3000/game?id=" + game._id;
            it("Returns status 200", function (done) {
                request(url, function (error, response, body) {
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });
    });
    app.locals.db.collection('publishers').find().limit(1).toArray().then((gamePromise) => {
        let game = gamePromise[0];
        let describeString = "Test sample publisher " + game.name;
        describe(describeString, function () {
            this.timeout(5000);
            var url = "http://localhost:3000/publisher?id=" + game._id;
            it("Returns status 200", function (done) {
                request(url, function (error, response, body) {
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });
    });
    app.locals.db.collection('developers').find().limit(1).toArray().then((gamePromise) => {
        let game = gamePromise[0];
        let describeString = "Test sample developer " + game.name;
        describe(describeString, function () {
            this.timeout(5000);
            var url = "http://localhost:3000/developer?id=" + game._id;
            it("Returns status 200", function (done) {
                request(url, function (error, response, body) {
                    expect(response.statusCode).to.equal(200);
                    done();
                });
            });
        });
    });
});

//get a random game and run tests??
