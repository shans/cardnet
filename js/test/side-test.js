var assert = require('assert');

var Point = require('../point.js').Point;
var Side = require('../side.js').Side;

var util = require('./util.js');

describe('Side', function() {
  describe('#segment()', function() {
    it('should segment a simple side cleanly', function() {
      var side = new Side(new Point(10, 10), new Point(20, 10), "red");
      side.segment(3, 6, "green");
      util.checkSideMatches(side,
	[
	  {at: new Point(10, 10), color: 'red'}, 
	  {at: new Point(13, 10), color: 'green'},
	  {at: new Point(16, 10), color: 'red'},
	  {at: new Point(20, 10)}
	]);
    });
    it('should not generate a degenerate part at the start', function() {
      var side = new Side(new Point(10, 10), new Point(20, 10), "red");
      side.segment(0, 6, "green");
      util.checkSideMatches(side,
	[
	  {at: new Point(10, 10), color: 'green'},
	  {at: new Point(16, 10), color: 'red'},
	  {at: new Point(20, 10)}
	]);
    });
    it('should not generate a degenerate part at the end', function() {
      var side = new Side(new Point(10, 10), new Point(20, 10), "red");
      side.segment(3, 10, "green");
      util.checkSideMatches(side,
	[
	  {at: new Point(10, 10), color: 'red'},
	  {at: new Point(13, 10), color: 'green'},
	  {at: new Point(20, 10)}
	]);
    });
    it('should not generate degenerate parts at both ends', function() {
      var side = new Side(new Point(10, 10), new Point(20, 10), "red");
      side.segment(0, 10, "green");
      util.checkSideMatches(side,
	[
	  {at: new Point(10, 10), color: 'green'},
	  {at: new Point(20, 10)}
	]);
    });
    it('should cope with symbolic points', function() {
      var side = new Side(new Point(0, 0), new Point('width', 0), 'red');
      side.segment(2, 5, 'green');
      assert(side.symbolic);
      util.checkSideMatches(side.resolve({width: 10}),
	[
	  {at: new Point(0, 0), color: 'red'},
	  {at: new Point(2, 0), color: 'green'},
	  {at: new Point(5, 0), color: 'red'},
	  {at: new Point(10, 0)}
	]);
      util.checkSideMatches(side.resolve({width: 5}),
	[
	  {at: new Point(0, 0), color: 'red'},
	  {at: new Point(2, 0), color: 'green'},
	  {at: new Point(5, 0)}
	]);
    });
  });
});
