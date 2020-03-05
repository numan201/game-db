const express = require('express');
const router = express.Router();
const axios = require('axios');
const { gitHubKey } = require('../keys');

let githubIdList = ["team", "possumrapture", "numan201", "johnnguyen3196", "justAlejandro", "rambisco"];


function getCommitNumbers() {
    let commitNumbers = [];
    let promises = [];

    for (let i = 0; i < githubIdList.length; i++) {
        let url = "https://api.github.com/search/commits?q=";

        if(i !== 0) {
            url += "author:" + githubIdList[i] + " ";
        }
        url += "repo:numan201/game-db author-date:2020-01-01..2020-06-01";

        let config = {
            method: 'get',
            headers: {
                "Accept" : "application/vnd.github.cloak-preview",
                "Authorization" : 'Token ' + gitHubKey
            }
        };

        let request = axios.get(url, config);
        promises.push(request);

    }

    // Wait for all requests to finish
    return axios.all(promises).then( (responses) => {
        responses.forEach ( (response, i) => {
            commitNumbers[i] = response.data.items.length;
        });

        return commitNumbers;
    });

}

function getIssuesNumbers() {
    let issueNumbers = [];
    let promises = [];

    for (let i = 0; i < githubIdList.length; i++) {
        let url = "https://api.github.com/search/issues?q=";

        if(i !== 0) {
            url += "author:" + githubIdList[i] + " ";
        }
        url += "repo:numan201/game-db type:issue";

        let config = {
            method: 'get',
            headers: {"Authorization" : 'Token ' + gitHubKey}
        };

        let request = axios.get(url, config);
        promises.push(request);

    }

    return axios.all(promises).then( (responses) => {
        responses.forEach ( (response, i) => {
            issueNumbers[i] = response.data.items.length;
        });
        return issueNumbers;
    });

}

/* GET about */
router.get('/', async function(req, res, next) {
    let issueNumbers = await getIssuesNumbers();
    let commitNumbers = await getCommitNumbers();
    let commitNumbersWithoutTeam = commitNumbers.slice(1);

    res.render('about', { title: 'About', issueNumbers: issueNumbers, commitNumbers: commitNumbers, graphCommitNumbersArray: JSON.stringify(commitNumbersWithoutTeam) });
});

module.exports = router;
