"use strict";

(function() {

var Point = require("./point.js").Point;
var Side = require("./side.js").Side;

class Shape {
  constructor(id) {
    this.id = id;
    this._lastPoint = new Point(0, 0);
    this.sides = [];
    this.base = new Point(0, 0);
    this.children = [];
    this.inverted = false;
    this.symbolic = false;
    this.resolve = function() { return this; };
  }
  
  appendSide(point, color) {
    if (point.symbolic) {
      this.symbolic = true;
      this.resolve = this._resolve;
    }
    this.sides.push(new Side(this._lastPoint, point, color));
    this._lastPoint = point;
  }

  // TODO: use sets here.
  unresolvedVars() {
    var result = {};
    this._unresolvedVars(result);
    return result;
  }

  _unresolvedVars(dict) {
    for (var side of this.sides)
      side._unresolvedVars(dict);
    for (var child of this.children)
      child._unresolvedVars(dict);
  }

  _resolve(dict, rules, partials) {
    var shape = new Shape(this.id);
    var matched = [];
    shape.inverted = this.inverted;

    partials = partials || {'descendant': [], 'child': []};
    var newPartials = {'descendant': [], 'child': []};

    /* apply rules from partials and construct new partials */
    for (var combinator in partials) {
      for (var rule of partials[combinator]) {
        if (rule.matches(this))
          matched.push(rule);
        var partial = rule.partiallyMatches(this);
        if (partial)
          newPartials[partial.combinator.id].push(partial.rule);
      }
    }

    /* update new partials with carried over partials */
    newPartials.descendant = newPartials.descendant.concat(partials.descendant);
    partials = newPartials;

    /* apply global rules and construct new partials */
    for (var rule of rules) {
      if (rule.matches(this))
        matched.push(rule);
      var partial = rule.partiallyMatches(this);
      if (partial)
        partials[partial.combinator.id].push(partial.rule);
    }

    matched.sort((a, b) => {
      for (var i = 0; i < a.priority.length; i++) {
        if (a.priority[i] > b.priority[i])
          return 1;
        if (a.priority[i] < b.priority[i])
          return -1;
      }
      return 0;
    });

    /* write properties from matched rules */
    for (rule of matched)
      dict = rule.apply(dict);

    /* apply styles from the node resolver */
    if (this.resolver) {
      var localStyles = this.resolver(this);
      for (var property in localStyles)
        dict[property] = localStyles[property];
    }


    for (var side of this.sides)
      shape.sides.push(side.resolve(dict));
    for (var child of this.children) {
      if (child._parentSide !== undefined)
        dict['<parent>'] = shape.sides[child._parentSide].length;
      shape.children.push(child.resolve(dict, rules, partials));
    }
    return shape;
  }

  close(color) {
    this.appendSide(new Point(0, 0), color);
  }

  rotate(angle) {
    this.base = this.base.rotate(angle);
    for (var side of this.sides)
      side.rotate(angle);
    for (var child of this.children)
      child.rotate(angle);
  }

  invert() {
    this.inverted = !this.inverted;
    for (var side of this.sides)
      side.invert();
    for (var child of this.children)
      child.invert();
  }

  join(shape, thisSide, shapeSide, offset, joinColor) {
    offset = offset || 0;
    this.children.push(shape);
    shape.parent = this;
    shape.sideToParent = shapeSide;
    shape.parentSide = thisSide;
    var cid = this.children.length - 1;
    if (shape.symbolic) {
      this.symbolic = true;
      shape._parentSide = thisSide;
    }
    if (!this.symbolic)
      return this._join(cid, thisSide, shapeSide, offset, joinColor);
    var _resolve = this.resolve.bind(this);
    this.resolve = function(dict, rules) {
      // is this correct?! An alternative would be to keep around the string version
      // of deferred values.
      var shape = _resolve(dict, rules);
      shape._join(cid, thisSide, shapeSide, offset, joinColor);
      return shape;
    }
    return shape;
  }

  _join(cid, thisSide, shapeSide, offset, joinColor) {
    var shape = this.children[cid];
    thisSide = this.sides[thisSide];
    shapeSide = shape.sides[shapeSide];

    // externally, offset=0 refers to matching centers. Internally, offset applies from
    // the start point of thisSide.
    offset += (thisSide.length.value - shapeSide.length.value) / 2;

    if (offset <= -shapeSide.length.value && offset > thisSide.length.value)
      throw new RangeError("Can't join, offset out of range");

    var angle = shapeSide.direction().angleTo(new Point(0, 0).subtract(thisSide.direction()));
    shape.rotate(angle);

    /*
      NORMAL
      offset < 0       offset < (this - shape)    offset > (this - shape)   shape > this, offset > (this - shape)  offset < (this - shape) 
        --TTTTTTT         TTTTTTTTTT                 TTTTTTT                   --TTTT                             -----TTTT
        SSSS              ----SSSS                   -----SSSSS                SSSSSSSS                           SSSSSSS

      T INVERTED
      offset < 0   offset < (this - shape)  offset > (this - shape)  shape > this, offset > (this - shape)  offset < (this - shape)
           SSSS           SSSS----             SSSS----                      SSSSSSS                             SSSSSS
      TTTTTTT--         TTTTTTTTTT               TTTTTT                       TTTT--                           TTTT----
    */

    var selfSplits = [Math.max(offset, 0), Math.min(shapeSide.length.value + offset, thisSide.length.value)];
    var shapeSplits = [Math.max(-offset, 0), Math.min(thisSide.length.value - offset, shapeSide.length.value)];

    if (this.inverted !== shape.inverted) {
      shapeSplits = shapeSplits.map(a => shapeSide.length.value - a);
      shapeSplits.reverse();
      offset += thisSide.length.value;
    }

    thisSide.segment(selfSplits[0], selfSplits[1], joinColor || "fold");
    shapeSide.segment(shapeSplits[0], shapeSplits[1], "empty");

    shape.base = thisSide.start.subtract(shapeSide.end).add(thisSide.end.subtract(thisSide.start).multiply(offset / thisSide.length.value));
    return shape;
  }

  render(offset, layers) {
    if (this.symbolic)
      throw "UnresolvedObjectException";

    offset = offset || new Point(0, 0);
    var model = {};
    offset = offset.add(this.base);
    model.paths = {}
    let sides = this.sides.map(a => a.render(offset, layers)).reduce((a,b) => a.concat(b), []);
    for (let i = 0; i < sides.length; i++)
      model.paths['p' + i] = sides[i];
    if (this.children.length > 0) {
      model.models = {}
      var children = this.children.map(a => a.render(offset, layers));
      for (let i = 0; i < children.length; i++) {
        model.models[this.children[i].id ? this.children[i].id : 'm' + i] = children[i];
      }
    }
    return model;
  }
}

function fromPoints(points, color, id) {
  var shape = new Shape(id);
  points.map(a => shape.appendSide(a, color));
  shape.close(color);
  return shape;
}

function rect(width, height, color, id) {
  return fromPoints([new Point(width, 0), new Point(width, height), new Point(0, height)], color, id);
}

exports.Shape = Shape;
exports.fromPoints = fromPoints;
exports.rect = rect;

})()
