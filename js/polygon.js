"use strict";

(function() {

var union = require("./resolve.js").union;
var Point = require("./point.js").Point;
var Side = require("./side.js").Side;
var Shape = require("./shape.js").Shape;

class Polygon extends Shape {
  constructor(numSides, sideLength, color, id) {
    super(id);
    let angle = 2 * Math.PI / numSides;
    let bearing = 0;
    let x = 0, y = 0;
    for (let i = 0; i < numSides - 1; i++) {
      x += Math.cos(bearing) * sideLength;
      y += Math.sin(bearing) * sideLength;
      this.appendSide(new Point(x, y), color);
      bearing += angle;
    }
    this.close(color);
  }
}

exports.Polygon = Polygon;

})();