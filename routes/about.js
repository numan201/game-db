const express = require('express');
const router = express.Router();
const axios = require('axios');
const { gitHubKey } = require('../keys');

let githubIdList = ["team", "possumrapture", "numan201", "johnnguyen3196", "JustAlejandro", "rambisco", "Numan Habib"];

function getIssuesNumbers() {
    let issueNumbers = Array(6).fill(0);
    let promises = [];

    let url = "https://api.github.com/search/issues?q=repo:numan201/game-db type:issue";

    let config = {
        method: 'get',
        headers: {
            "Authorization" : 'Token ' + gitHubKey,
            "per_page" : "100"
        }

    };

    let request = axios.get(url, config);
    promises.push(request);

    return axios.all(promises).then( (responses) => {
        responses.forEach ( (response, i) => {
            issueNumbers[i] = response.data.items.length;

            response.data.items.forEach((item) => {
                for(let j = 0; j < item.assignees.length; j++) {
                    let issueAssignee = item.assignees[j].login;
                    if(githubIdList.includes(issueAssignee)) {
                        let assigneeIndex = githubIdList.indexOf(issueAssignee);
                        issueNumbers[assigneeIndex] ++;
                    }
                }
            });
        });
        return issueNumbers;
    });
}


function getCommitNumbers() {
    let commitNumbers = [];
    let promises = [];

    let today = new Date();
    let date = today.getFullYear() + "-";

    if((today.getMonth()+1) < 11)
        date += "0" +(today.getMonth()+1) + "-";
    else
        date += (today.getMonth()+1);

    if(today.getDate() < 10)
        date += "0" + today.getDate();
    else date += today.getDate();

    for (let i = 0; i < githubIdList.length; i++) {
        let url = "https://api.github.com/search/commits?q=";

        if(i !== 0) {
            url += "author:" + githubIdList[i] + " ";
        }

        url += "repo:numan201/game-db author-date:2020-01-01.." + date;

        let config = {
            method: 'get',
            headers: {
                "Accept" : "application/vnd.github.cloak-preview",
                "Authorization" : 'Token ' + gitHubKey,
                "per_page" : "100"
            }
        };

        let request = axios.get(url, config);
        promises.push(request);
    }

    // Wait for all requests to finish
    return axios.all(promises).then( (responses) => {
        responses.forEach ((response, i) => {
            //Need to have this check because Numan committed under 2 names
            if(i === 6)
                commitNumbers[commitNumbers.indexOf("numan201")] += response.data.total_count;
            else
                commitNumbers[i] = response.data.total_count;
        });

        return commitNumbers;
    });

}

/* GET about */
router.get('/', function(req, res, next) {

    req.app.locals.db.collection('cache').findOne({name: 'github'}).then(async (github) => {
        let issueNumbers = github.issueNumbers;
        let commitNumbers = github.commitNumbers;
        let commitNumbersWithoutTeam = github.commitNumbersWithoutTeam;

        const TWELVE_HOURS = 12 * 1000 * 60 * 60;
        const timeElapsed = new Date() - github.updated;

        // Time to refresh (after 12 hours)
        if (timeElapsed >= TWELVE_HOURS) {
            issueNumbers = await getIssuesNumbers();
            commitNumbers = await getCommitNumbers();
            commitNumbersWithoutTeam = commitNumbers.slice(1);

            await req.app.locals.db.collection('cache').updateOne({name: 'github'}, {$set: {updated: new Date(), issueNumbers: issueNumbers, commitNumbers: commitNumbers, commitNumbersWithoutTeam: commitNumbersWithoutTeam}});
        }

        res.render('about', { title: 'About', page: req.baseUrl, issueNumbers: issueNumbers, commitNumbers: commitNumbers, graphCommitNumbersArray: JSON.stringify(commitNumbersWithoutTeam) });

    });

});

module.exports = router;
