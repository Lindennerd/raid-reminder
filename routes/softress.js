var express = require('express');
var controller = require('../controller/softress.controller');
var router = express.Router();

router.get('/calendar', controller.calendar);
router.post('/register', controller.register);

module.exports = router;