const expect  = require("chai").expect;
//const chaiHttp = require('chai-http');
const request = require("request");
const express = require('express');
const axios = require('axios');
const app = express();
const { youtubeKey, twitchKey, steamKey, newsKey, gitHubKey } = require('../keys');

const pages = ["about", "news", "games", "developers", "publishers"];
const APIs = {"News" : ["http://newsapi.org/v2/everything?q=videogames&apiKey=0ad0b0564e6e414484adf96ebb116a81", "articles", newsKey],
                "Steam" : ["http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=377160&count=3&maxlength=0&format=json", "appnews", steamKey]};
// "YouTube" : "http://somelink",
//     "GitHub" : "",
//     "Twitch" : "",
//     "GoogleOAuth" : "",
//     "News": "",

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

describe("Test Twitch API", function() {
    this.timeout(5000);
    it("Returns successfully with expected data.", function(done){
        axios({
            method: 'get',
            url: 'https://api.twitch.tv/helix/games',
            params: {name: "Fortnite"},
            headers: {'Client-ID': twitchKey}
        })
            .then((response) => {
                expect(response.data.data[0]).to.have.property("id");
                done();
            })
    });
});

describe("Test GitHub API", function() {
    this.timeout(5000);
    it("Returns sucessfully with expected data.", function(done){
        let url = "https://api.github.com/search/issues?q=repo:numan201/game-db type:issue";

        let config = {
            method: 'get',
            headers: {
                "Authorization" : 'Token ' + gitHubKey,
                "per_page" : "100"
            }

        };
        axios.get(url, config).then((response) => {
            expect(response.data).to.have.property("items");
            done();
        });
    });
});


Object.keys(APIs).forEach((API, i ) => {
    describe("Test " + API + " API.", function() {
        this.timeout(5000);
        var url = APIs[API][0];
        it("Returns successfully with expected member " + APIs[API][1], function(done){
            request(url, function(error, response, body) {
                expect(response.statusCode).to.equal(200);
                expect(JSON.parse(body)).to.have.property(APIs[API][1]);
                done();
            });
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
