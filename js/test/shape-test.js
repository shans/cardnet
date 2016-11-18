var assert = require('assert');

var Point = require('../point.js').Point;
var Side = require('../side.js').Side;
var Shape = require('../shape.js');

var util = require('./util.js');

describe('Shape', function() {
  describe('#join()', function() {
    it('should join a tab to a longer side', function() {
      var shape = Shape.rect(20, 10, 'red');
      var tab = Shape.rect(10, 5, 'green');
      shape.join(tab, 0, 0);
      util.checkSideMatches(shape.sides[0],
	[
	  {at: new Point(0, 0), color: 'red'},
	  {at: new Point(5, 0), color: 'fold'},
	  {at: new Point(15, 0), color: 'red'},
	  {at: new Point(20, 0)}
	]);
      util.checkSideMatches(tab.sides[0],
	[
	  {at: new Point(0, 0), color: 'empty'},
	  {at: new Point(-10, 0)}
	]);
      util.checkPointsMatch(new Point(15, 0), tab.base);
    });
  });
  describe('#render()', function() {
    it('should produce a simple description of a simple shape', function() {
      var shape = Shape.rect(20, 10, 'red');
      assert.deepEqual({
	paths: {
	  p0: {type: 'line', origin: [0, -0], end: [20, -0], layer: 'red'},
	  p1: {type: 'line', origin: [20, -0], end: [20, -10], layer: 'red'},
	  p2: {type: 'line', origin: [20, -10], end: [0, -10], layer: 'red'},
	  p3: {type: 'line', origin: [0, -10], end: [0, -0], layer: 'red'}
	}
      }, shape.render());
    });
  });
});
