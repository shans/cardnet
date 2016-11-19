var assert = require('assert');
var util = require('./util.js');

var Point = require('../point.js').Point;

describe('Point', function() {
  describe('#add()', function() {
    it('should return the sum of self and the point provided', function() {
      var p = new Point(4, 5);
      var q = p.add(new Point(6, 2));
      util.assertResolved(q.x, 10);
      util.assertResolved(q.y, 7);
    });
    it('should not modify self', function() {
      var p = new Point(4, 5);
      var q = p.add(new Point(6, 2));
      util.assertResolved(p.x, 4);
      util.assertResolved(p.y, 5);
    });
    it('should deal with symbolic constants', function() {
      var p = new Point("width", "height");
      var q = p.add(new Point(2, 2));
      util.assertResolved(q.x.resolve({width: 8, height: 4}), 10);
      util.assertResolved(q.y.resolve({width: 8, height: 4}), 6);
    });
  });
  describe('#subtract()', function() {
    it('should return the difference between self and the point provided', function() {
      var p = new Point(4, 5);
      var q = p.subtract(new Point(6, 2));
      util.assertResolved(q.x, -2);
      util.assertResolved(q.y, 3);
    });
    it('should not modify self', function() {
      var p = new Point(4, 5);
      var q = p.subtract(new Point(6, 2));
      util.assertResolved(p.x, 4);
      util.assertResolved(p.y, 5);
    });
  });
  describe('#distanceTo()', function() {
    it('should return 0 if called on itself', function() {
      var p = new Point(4, 5);
      util.assertResolved(p.distanceTo(p), 0);
    });
    it('should return the distance between self and the point provided', function() {
      var p = new Point(4, 5);
      var q = new Point(8, 2);
      util.assertResolved(p.distanceTo(q), 5);
      util.assertResolved(q.distanceTo(p), 5);
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
