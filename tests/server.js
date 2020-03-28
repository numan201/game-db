const expect  = require("chai").expect;
const request = require("request");

const pages = ["about", "news", "games", "developers", "publishers"];

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
