var assert = require('assert');
var util = require('./util.js');

var Point = require('../point.js').Point;

describe('Point', function() {
  describe('#add()', function() {
    it('should return the sum of self and the point provided', function() {
      var p = new Point(4, 5);
      var q = p.add(new Point(6, 2));
      assert.equal(10, q.x);
      assert.equal(7, q.y);
    });
    it('should not modify self', function() {
      var p = new Point(4, 5);
      var q = p.add(new Point(6, 2));
      assert.equal(4, p.x);
      assert.equal(5, p.y);
    });
    it('should deal with symbolic constants', function() {
      var p = new Point("width", "height");
      var q = p.add(new Point(2, 2));
      assert.equal(10, q.x({width: 8, height: 4}));
      assert.equal(6, q.y({width: 8, height: 4}));
    });
  });
  describe('#subtract()', function() {
    it('should return the difference between self and the point provided', function() {
      var p = new Point(4, 5);
      var q = p.subtract(new Point(6, 2));
      assert.equal(-2, q.x);
      assert.equal(3, q.y);
    });
    it('should not modify self', function() {
      var p = new Point(4, 5);
      var q = p.subtract(new Point(6, 2));
      assert.equal(4, p.x);
      assert.equal(5, p.y);
    });
  });
  describe('#distanceTo()', function() {
    it('should return 0 if called on itself', function() {
      var p = new Point(4, 5);
      assert.equal(0, p.distanceTo(p));
    });
    it('should return the distance between self and the point provided', function() {
      var p = new Point(4, 5);
      var q = new Point(8, 2);
      assert.equal(5, p.distanceTo(q));
      assert.equal(5, q.distanceTo(p));
    });
  }); 
  describe('#angleTo()', function() {
    it('should generate an angle that lets the from point be mapped to the direction of the to point by rotation', function() {
      var points = [new Point(0, 10), new Point(10, 0), new Point(0, -10), new Point(-10, 0), new Point(5, 5), new Point(-5, 5),
		    new Point(5, -5), new Point(-5, -5)];
      for (var from of points)
	for (var to of points)
	  util.checkPointsMatch(to.normalize(), from.rotate(from.angleTo(to)).normalize());
    });
  });
});
