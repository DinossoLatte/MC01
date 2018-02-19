'use strict';

var url = require('url');

var Manos = require('./ManosService');

module.exports.hand = function hand (req, res, next) {
  Manos.hand(req.swagger.params, res, next);
};
