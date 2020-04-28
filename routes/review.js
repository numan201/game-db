const express = require('express');
const router = express.Router();
const {findId, buildURL, buildReview} = require("../models/modelreviews");

router.post('/', (req, res) => {
    let id = findId(req);
    let URL = buildURL(id, req);
    if(!('userratings' in req.body)){
        res.redirect(URL);
    }
    buildReview(id, req);
    res.redirect(URL);
});

module.exports = router;