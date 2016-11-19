"use strict";

var assert = require('assert');

var resolve = require('../resolve.js');
var util = require('./util.js');

describe('Value', function() {
  describe('#toValue()', function() {
    it('should return ResolvedValues for numbers', function() {
      var v = resolve.Value.toValue("42");
      util.assertResolved(v, 42);
    });

    it('should return ReferenceValues for strings', function() {
      var v = resolve.Value.toValue("width");
      util.assertReference(v, "width");
    });

    it('should return WeakReferenceValues for lists', function() {
      var v = resolve.Value.toValue("width | globalWidth | 42");
      assert.equal(v.constructor, resolve.WeakReferenceValue);
      assert.equal(v.references[0].reference, "width");
      assert.equal(v.references[1].reference, "globalWidth");
      assert.equal(v.references[2].value, 42);
    });
  });
});

describe('ReferenceValue', function() {
  describe('#resolve()', function() {
    it('should resolve references present in the dictionary', function() {
      var v = resolve.Value.toValue("width");
      var w = v.resolve({width: 21});
      util.assertResolved(w, 21);
    });
    it('should not resolve references not present in the dictionary', function() {
      var v = resolve.Value.toValue("width");
      var w = v.resolve({height: 21});
      util.assertReference(w, "width");
    });
    it('should follow reference chains', function() {
      var v = resolve.Value.toValue("width");
      var w = v.resolve({width: 'height', height: 55});
      util.assertResolved(w, 55);
    });
  });
});

describe('WeakReferenceValue', function() {
  describe('#resolve()', function() {
    it('should resolve references present in the dictionary', function() {
      var v = resolve.Value.toValue("width | 42");
      var w = v.resolve({width: -10});
      util.assertResolved(w, -10);
    });
    it('should not resolve references not present in the dictionary', function() {
      var v = resolve.Value.toValue("width | 42");
      var w = v.resolve({height: -10});
      util.assertResolved(w, 42);
    });
    it('should resolve the first present reference', function() {
      var v = resolve.Value.toValue("width | height | 42");
      var w = v.resolve({height: 20});
      util.assertResolved(w, 20);
    });
    it('should follow reference chains', function() {
      var v = resolve.Value.toValue("width | 42");
      var w = v.resolve({width: 'height', height: 1});
      util.assertResolved(w, 1);
    });
    it('should not exhaust if a reference chain does', function() {
      var v = resolve.Value.toValue("width | height | -10");
      var w = v.resolve({width: 'maxWidth', maxWidth: 'minWidth', height: 'minWidth'});
      util.assertResolved(w, -10);
    });
  });
});

describe('AlgorithmicValue', function() {
  describe('#apply()', function() {
    it('should construct an AlgorithmicValue if one or more inputs are not resolved', function() {
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, resolve.Value.toValue("width"), resolve.Value.toValue(42));
      util.assertAlgorithmic(v, ['width']);
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, resolve.Value.toValue(24), resolve.Value.toValue("height"));
      util.assertAlgorithmic(v, ['height']);
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, resolve.Value.toValue("width"), resolve.Value.toValue("height"));
      util.assertAlgorithmic(v, ['width', 'height']);
    });
    it('should construct a ResolvedValue if all inputs are resolved', function() {
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, resolve.Value.toValue(24), resolve.Value.toValue(42));
      util.assertResolved(v, 66);
    });
  });
  describe('#resolve()', function() {
    it('should partially resolve when some inputs are available', function() {
      var v = resolve.AlgorithmicValue.apply((a, b, c) => a + b + c, resolve.Value.toValue("width"), resolve.Value.toValue("height"), resolve.Value.toValue("depth"));
      util.assertAlgorithmic(v, ['width', 'height', 'depth']);
      var w = v.resolve({width: 22});
      util.assertAlgorithmic(w, ['height', 'depth']);
    });
    it('should completely resolve when all inputs are available', function() {
      var v = resolve.AlgorithmicValue.apply((a, b, c) => a + b + c, resolve.Value.toValue("width"), resolve.Value.toValue("height"), resolve.Value.toValue("depth"));
      util.assertAlgorithmic(v, ['width', 'height', 'depth']);
      var w = v.resolve({width: 22, height: 41, depth: 34});
      util.assertResolved(w, 97);
    });
    it('should allow for complicated trees of dependencies', function() {
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, 
        resolve.AlgorithmicValue.apply((a, b) => a * b, resolve.Value.toValue("x"), resolve.Value.toValue("y | z | 24")),
        resolve.AlgorithmicValue.apply((a, b) => a / b, resolve.Value.toValue("a | b"), resolve.Value.toValue(2)));
      util.assertAlgorithmic(v, ['x', 'y', 'z', 'a', 'b']);
      var w = v.resolve({b: 10});
      util.assertAlgorithmic(w, ['x']);
      var x = w.resolve({x: 20});
      util.assertResolved(x, 485);
    });
  }); 
});

describe('ElementReferenceValue', function() {
  describe('#resolve()', function() {
    it('should resolve when an element has a parent on the side recorded in the reference', function() {
      var v = new resolve.ElementReferenceValue({parent: {sides: [undefined, {length: resolve.Value.toValue(20)}]}, parentSide: 1, sideToParent: 3}, 3);
      var w = v.resolve({});
      util.assertResolved(w, 20);
    });
  });
});
