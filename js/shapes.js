(function() {

var shape = require('./shape.js');
var Point = require('./point.js').Point;

var tabShape = function(width, depth, color) {
  var tabIndent = new Point("tabindent", 0);
  var result = shape.fromPoints([
    new Point(width, 0),
    new Point (width, depth).subtract(tabIndent),
    new Point(0, depth).add(tabIndent),
  ], color);
  result.name = 'tabShape';
  return result;
}

exports.tabShape = tabShape;

})();
