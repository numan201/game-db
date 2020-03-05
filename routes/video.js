var request = require('request');
var express = require('express');
var router = express.Router();
var fs = require("fs");

const g_id = "33214";
const u_id = '60056333';
const num_streams = 1;

// getting game-id comes from needing exact string of game...
// returns user_name which can be used later to make embedded video as Channel option

var options = { method: 'GET',
    url: 'https://api.twitch.tv/helix/streams',
    qs: { game_id: g_id, first: num_streams },
    headers:
        {
            'Client-ID': 'yqjk0ha999ss01nnisfcac3734ig7t' } };

var options2 = { method: 'GET',
    url: 'https://api.twitch.tv/kraken/streams',
    qs : { game: g_id, limit: num_streams },
    headers:
        {
            'Client-ID': 'yqjk0ha999ss01nnisfcac3734ig7t' } };

request(options, function (error, response, body) {
    if (error) throw new Error(error);
    fs.writeFile('./result.csv', body, { flag: 'w' }, function(err) {
        if (err)
            return console.error(err);
        fs.readFile('./result.csv', 'utf-8', function (err, data) {
            if (err)
                return console.error(err);
            console.log(JSON.parse(data));
        });
    });
});

