"use strict";

function addUnresolved(f) {
  f.unresolved = [];
  for (var i = 1; i < arguments.length; i++) {
    var arg = arguments[i];
    f.unresolved = f.unresolved.concat(arg);
  }
  return f;
}

function resolve1(a, f) {
  if (typeof(a) == 'function')
    return addUnresolved(dict => f(a(dict)), a.unresolved);
  return f(a);
}

function resolve2(a, b, f) {
  if (typeof(a) == 'function') {
    if (typeof(b) == 'function')
      return addUnresolved(dict => f(a(dict), b(dict)), a.unresolved, b.unresolved);
    return addUnresolved(dict => f(a(dict), b), a.unresolved);
  }
  if (typeof(b) == 'function')
    return addUnresolved(dict => f(a, b(dict)), b.unresolved);
  return f(a, b);
}

function resolve3(a, b, c, f) {
  if (typeof(a) == 'function') {
    if (typeof(b) == 'function') {
      if (typeof(c) == 'function')
	return addUnresolved(dict => f(a(dict), b(dict), c(dict)), a.unresolved, b.unresolved, c.unresolved);
      return addUnresolved(dict => f(a(dict), b(dict), c), a.unresolved, b.unresolved);
    }
    if (typeof(c) == 'function')
      return addUnresolved(dict => f(a(dict), b, c(dict)), a.unresolved, c.unresolved);
    return addUnresolved(dict => f(a(dict), b, c), a.unresolved);
  }
  if (typeof(b) == 'function') {
    if (typeof(c) == 'function')
      return addUnresolved(dict => f(a, b(dict), c(dict)), b.unresolved, c.unresolved);
    return addUnresolved(dict => f(a, b(dict), c), b.unresolved);
  }
  if (typeof(c) == 'function')
    return addUnresolved(dict => f(a, b, dict(c)), c.unresolved);
  return f(a, b, c);
}

function resolvePoint1(a, f) {
  return new Point(resolve1(a.x, f), resolve1(a.y, f));
}

function resolvePoint2(a, b, f) {
  return new Point(resolve2(a.x, b.x, f), resolve2(a.y, b.y, f));
}

function stringToUnresolved(s) {
  if (typeof(s) == 'string') {
    var u = a => a[s];
    u.unresolved = [s];
    u.initial = s;
    return u;
  } else {
    return s;
  }
}

class Point {
  constructor(x, y) {
    this.x = stringToUnresolved(x);
    this.y = stringToUnresolved(y);

    if (typeof(this.x) == 'function' || typeof(this.y) == 'function')
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
    return new Point(resolve3(this.x, this.y, angle, (a, b, c) => Math.cos(c) * a  - Math.sin(c) * b),
		     resolve3(this.x, this.y, angle, (a, b, c) => Math.sin(c) * a + Math.cos(c) * b));
  }

  normalize() {
    return this.divide(this.size());
  }

  dot(point) {
    return resolve2(resolve2(this.x, point.x, (a, b) => a * b),
		    resolve2(this.y, point.y, (a, b) => a * b),
		    (a, b) => a + b);
  }

  atan2() {
    return resolve2(this.x, this.y, (x, y) => Math.atan2(y, x));
  }

  angleTo(point) {
    return resolve2(point.atan2(), this.atan2(), (a, b) => a - b);
  }

  distanceTo(point) {
    return this.subtract(point).size();
  }

  size() {
    return resolve2(this.x, this.y, (x, y) => Math.sqrt(x * x + y * y));
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
    function resolveSingleValue(value) {
      if (typeof(value) == 'function') {
        var unsatisfied = [];
        for (var dep of value.unresolved) {
          if (dict[dep] == undefined)
            unsatisfied.push(dep);
        }
        if (unsatisfied.length == 0) {
          return resolveSingleValue(value(dict));
        } else {
          var v = d2 => { for (var d in dict) { d2[d] = dict[d]; } return resolveSingleValue(value(d2)); };
          v.unresolved = unsatisfied;
          return v;
        }
      } else {
        return value;
      }
    }
    var x = resolveSingleValue(this.x);
    var y = resolveSingleValue(this.y);
    return new Point(x, y);
  }

  render(offset) {
    var p = this.add(offset);
    return [p.x, -p.y];
  }
}

exports.Point = Point;
