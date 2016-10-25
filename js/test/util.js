var assert = require('assert');

exports.isclose = function(a, b) {
  if (a == b)
    return true;
  return Math.abs(a-b) < Math.max(1e-09 * Math.max(Math.abs(a), Math.abs(b)), 1e-09);
}

exports.checkPointsMatch = function(expected, actual) {
  assert.ok(exports.isclose(expected.x, actual.x), `x: actual ${actual.x} != expected ${expected.x}`);
  assert.ok(exports.isclose(expected.y, actual.y), `y: actual ${actual.y} != expected ${expected.y}`);
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
