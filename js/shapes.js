(function() {

var shape = require('./shape.js');
var Point = require('./point.js').Point;

var tabShape = function(width, depth, tabindent, color) {
  width = width || 'width';
  depth = depth || 'depth';
  tabindent = tabindent || 'tabindent';
  color = color || 'solid';
  var tabIndent = new Point(tabindent, 0);
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
