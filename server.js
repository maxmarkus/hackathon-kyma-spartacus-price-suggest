const priceSuggest = require('./priceSuggest');
const priceSuggestEmail = require('./priceSuggestEmail');
const getPriceSuggestions = require('./getPriceSuggestions');
const priceDropNotify = require('./priceDropNotify');

// BASE SETUP
// =============================================================================

// call the packages we need
var express = require('express');        // call express
var app = express();                 // define our app using express
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.post('/', function (req, res) {
  priceSuggest({ data: req.body}).then((lambdaRes) => {
    res.json(lambdaRes);
  })
});

router.post('/suggestemail', function (req, res) {
  priceSuggestEmail({ data: req.body}).then((lambdaRes) => {
    res.json(lambdaRes);
  })
});

router.post('/suggestions', function (req, res) {
  getPriceSuggestions({ data: req.body}).then((lambdaRes) => {
    res.json(lambdaRes);
  })
});

router.post('/priceupdated', function (req, res) {
  priceDropNotify({ data: req.body}).then((lambdaRes) => {
    res.json(lambdaRes);
  });
});

router.post('/priceupdated', function (req, res) {
});
// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);