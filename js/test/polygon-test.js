var assert = require('chai').assert;

var Polygon = require('../polygon.js').Polygon;

var util = require('./util.js');

let extractPoints = polygon => polygon.sides.map(a => [a.start.x, a.start.y, a.end.x, a.end.y].map(a => a.value));
let deepApproxEqual = (points, correct, delta) => points.map((list, i) => list.map((a, j) => assert.closeTo(a, correct[i][j], delta)));

describe('Polygon', function() {
  describe('#constructor()', function() {
    it('should make a triangle', function() {
      var polygon = new Polygon(3, 10, 'red');
      deepApproxEqual(extractPoints(polygon), [[0, 0, 10, 0], [10, 0, 5, 8.66], [5, 8.66, 0, 0]], 0.001);
    });
    it('should make a square', function() {
      var polygon = new Polygon(4, 20, 'red');
      deepApproxEqual(extractPoints(polygon), [[0, 0, 20, 0], [20, 0, 20, 20], [20, 20, 0, 20], [0, 20, 0, 0]], 0.001);      
    })
  });
});