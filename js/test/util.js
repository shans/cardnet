"use strict";

var assert = require('assert');

var resolve = require('../resolve.js');

exports.isclose = function(a, b) {
  if (a == b)
    return true;
  return Math.abs(a-b) < Math.max(1e-09 * Math.max(Math.abs(a), Math.abs(b)), 1e-09);
}

exports.checkPointsMatch = function(expected, actual) {
  assert.equal(actual.x.constructor, resolve.ResolvedValue);
  assert.equal(actual.y.constructor, resolve.ResolvedValue);
  assert.ok(exports.isclose(expected.x.value, actual.x.value), `x: actual ${actual.x.value} != expected ${expected.x}`);
  assert.ok(exports.isclose(expected.y.value, actual.y.value), `y: actual ${actual.y.value} != expected ${expected.y}`);
}

exports.checkSideMatches = function(side, points) {
  exports.checkPointsMatch(points[0].at, side.start);
  assert.equal(points.length - 1, side.parts.length, 'there are the correct number of parts');
  for (var i = 0; i < side.parts.length; i++) {
    exports.checkPointsMatch(points[i].at, side.parts[i].start);
    exports.checkPointsMatch(points[i + 1].at, side.parts[i].end);
    assert.equal(points[i].color, side.parts[i].color);
  }
}

exports.assertSetsEqual = function(a, b) {
  assert.equal(a.length, b.length);
  for (let item of a)
    assert(b.has(item));
}

exports.assertResolved = function(v, value) {
  assert.equal(v.constructor, resolve.ResolvedValue);
  assert.equal(v.value, value);
  exports.assertSetsEqual(v.unresolved, new Set());
}

exports.assertReference = function(v, reference) {
  assert.equal(v.constructor, resolve.ReferenceValue);
  assert.equal(v.reference, reference);
  exports.assertSetsEqual(v.unresolved, new Set([reference]));
}

exports.assertAlgorithmic = function(v, unresolved) {
  assert.equal(v.constructor, resolve.AlgorithmicValue);
  exports.assertSetsEqual(v.unresolved, new Set(unresolved));
}

