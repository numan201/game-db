const express = require('express');
const router = express.Router();
const axios = require('axios');
const { newsKey } = require('../keys');
const { getIndexData } = require('../models/index');

/* GET home page. */
router.get('/', function(req, res, next) {
  const promise = new Promise(data => {getIndexData(req, res, data);});
  promise.then(data => {
    res.render('index', {
      title: data.title,
      page: data.page,
      new_releases: data.new_releases,
      news: data.news,
      top_rated_switch: data.top_rated_switch,
      top_rated_pc: data.top_rated_pc,
      top_rated_ps4: data.top_rated_ps4,
      top_rated_xbone: data.top_rated_xbone
    });
  })

});

module.exports = router;
