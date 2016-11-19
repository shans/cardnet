"use strict";

var resolve = require('./resolve.js');
var Value = resolve.Value;
var ResolvedValue = resolve.ResolvedValue;
var AlgorithmicValue = resolve.AlgorithmicValue;

function resolvePoint1(a, f) {
  return new Point(AlgorithmicValue.apply(f, a.x), AlgorithmicValue.apply(f, a.y));
}

function resolvePoint2(a, b, f) {
  return new Point(AlgorithmicValue.apply(f, a.x, b.x), AlgorithmicValue.apply(f, a.y, b.y));
}

class Point {
  constructor(x, y) {
    this.x = Value.toValue(x);
    this.y = Value.toValue(y);

    if (!(this.x instanceof ResolvedValue && this.y instanceof ResolvedValue))
      this.symbolic = true;
  }

  add(point) {
    return resolvePoint2(this, point, (a, b) => a + b);
  }

  subtract(point) {
    return resolvePoint2(this, point, (a, b) => a - b);
  }

  multiply(size) {
    return resolvePoint2(this, new Point(size, size), (a, b) => a * b);
  }

  divide(size) {
    return resolvePoint2(this, new Point(size, size), (a, b) => a / b);
  }

  rotate(angle) {
    return new Point(AlgorithmicValue.apply((a, b, c) => Math.cos(c) * a - Math.sin(c) * b, this.x, this.y, angle),
                     AlgorithmicValue.apply((a, b, c) => Math.sin(c) * a + Math.cos(c) * b, this.x, this.y, angle))
  }

  normalize() {
    return this.divide(this.size());
  }

  dot(point) {
    return AlgorithmicValue.apply((a, b) => a + b,
        AlgorithmicValue.apply((a, b) => a * b, this.x, point.x),
	AlgorithmicValue.apply((a, b) => a * b, this.y, point.y));
  }

  atan2() {
    return AlgorithmicValue.apply((x, y) => Math.atan2(y, x), this.x, this.y);
  }

  angleTo(point) {
    return AlgorithmicValue.apply((a, b) => a - b, point.atan2(), this.atan2());
  }

  distanceTo(point) {
    return this.subtract(point).size();
  }

  size() {
    return AlgorithmicValue.apply((x, y) => Math.sqrt(x * x + y * y), this.x, this.y);
  }

  clone() {
    return new Point(this.x, this.y);
  }

  _unresolvedVars(dict) {
    if (this.x.unresolved) {
      for (var u of this.x.unresolved)
        dict[u] = u;
    }
    if (this.y.unresolved)
      for (var u of this.y.unresolved)
        dict[u] = u;
  }

  resolve(dict) {
    return new Point(this.x.resolve(dict), this.y.resolve(dict));
  }

  render(offset) {
    var p = this.add(offset);
    return [p.x.value, -p.y.value];
  }
}

exports.Point = Point;
