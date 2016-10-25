'use strict';

var makerjs = require('makerjs');
var fs = require('fs');

for (var i of ['Point', 'Side', 'Shape', 'shapes', 'styling']) {
  var component = require(`./${i}.js`);
  for (var key in component) {
    exports[key] = component[key];
  }
}

exports.toDXF = function(shapes, name) {
  var layers = {};
  var json = [];
  for (var shape of shapes)
    json.push(shape.shape.render(shape.point, layers));

  var dxf = makerjs.exporter.toDXF(json);

  var color = 3;
  layers.solid = 0;
  layers.fold = 1;
  layers.empty = 2;
  for (var layer in layers) {
    if (layers[layer] == layer)
      layers[layer] = color++;
    dxf = dxf.replace(new RegExp(`8\n${layer}\n`, 'g'), `8\n${layer}\n62\n${layers[layer]}\n`);
  }

  var f = fs.openSync(name, 'w');
  fs.writeSync(f, dxf);
  fs.close(f);
}
