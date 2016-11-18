"use strict";

var assert = require('assert');

var resolve = require('../resolve.js');

function assertSetsEqual(a, b) {
  assert.equal(a.length, b.length);
  for (let item of a)
    assert(b.has(item));
}

function assertResolved(v, value) {
  assert.equal(v.constructor, resolve.ResolvedValue);
  assert.equal(v.value, value);
  assertSetsEqual(v.unresolved, new Set());
}

function assertReference(v, reference) {
  assert.equal(v.constructor, resolve.ReferenceValue);
  assert.equal(v.reference, reference);
  assertSetsEqual(v.unresolved, new Set([reference]));
}

function assertAlgorithmic(v, unresolved) {
  assert.equal(v.constructor, resolve.AlgorithmicValue);
  assertSetsEqual(v.unresolved, new Set(unresolved));
}

describe('Value', function() {
  describe('#fromString()', function() {
    it('should return ResolvedValues for numbers', function() {
      var v = resolve.Value.fromString("42");
      assertResolved(v, 42);
    });

    it('should return ReferenceValues for strings', function() {
      var v = resolve.Value.fromString("width");
      assertReference(v, "width");
    });

    it('should return WeakReferenceValues for lists', function() {
      var v = resolve.Value.fromString("width | globalWidth | 42");
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
      var v = resolve.Value.fromString("width");
      var w = v.resolve({width: 21});
      assertResolved(w, 21);
    });
    it('should not resolve references not present in the dictionary', function() {
      var v = resolve.Value.fromString("width");
      var w = v.resolve({height: 21});
      assertReference(w, "width");
    });
    it('should follow reference chains', function() {
      var v = resolve.Value.fromString("width");
      var w = v.resolve({width: 'height', height: 55});
      assertResolved(w, 55);
    });
  });
});

describe('WeakReferenceValue', function() {
  describe('#resolve()', function() {
    it('should resolve references present in the dictionary', function() {
      var v = resolve.Value.fromString("width | 42");
      var w = v.resolve({width: -10});
      assertResolved(w, -10);
    });
    it('should not resolve references not present in the dictionary', function() {
      var v = resolve.Value.fromString("width | 42");
      var w = v.resolve({height: -10});
      assertResolved(w, 42);
    });
    it('should resolve the first present reference', function() {
      var v = resolve.Value.fromString("width | height | 42");
      var w = v.resolve({height: 20});
      assertResolved(w, 20);
    });
    it('should follow reference chains', function() {
      var v = resolve.Value.fromString("width | 42");
      var w = v.resolve({width: 'height', height: 1});
      assertResolved(w, 1);
    });
    it('should not exhaust if a reference chain does', function() {
      var v = resolve.Value.fromString("width | height | -10");
      var w = v.resolve({width: 'maxWidth', maxWidth: 'minWidth', height: 'minWidth'});
      assertResolved(w, -10);
    });
  });
});

describe('AlgorithmicValue', function() {
  describe('#apply()', function() {
    it('should construct an AlgorithmicValue if one or more inputs are not resolved', function() {
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, resolve.Value.fromString("width"), resolve.Value.fromString(42));
      assertAlgorithmic(v, ['width']);
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, resolve.Value.fromString(24), resolve.Value.fromString("height"));
      assertAlgorithmic(v, ['height']);
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, resolve.Value.fromString("width"), resolve.Value.fromString("height"));
      assertAlgorithmic(v, ['width', 'height']);
    });
    it('should construct a ResolvedValue if all inputs are resolved', function() {
      var v = resolve.AlgorithmicValue.apply((a, b) => a + b, resolve.Value.fromString(24), resolve.Value.fromString(42));
      assertResolved(v, 66);
    });
  });
  describe('#resolve()', function() {
    it('should partially resolve when some inputs are available', function() {
      var v = resolve.AlgorithmicValue.apply((a, b, c) => a + b + c, resolve.Value.fromString("width"), resolve.Value.fromString("height"), resolve.Value.fromString("depth"));
      assertAlgorithmic(v, ['width', 'height', 'depth']);
      var w = v.resolve({width: 22});
      assertAlgorithmic(w, ['height', 'depth']);
    });
    it('should completely resolve when all inputs are available', function() {
      var v = resolve.AlgorithmicValue.apply((a, b, c) => a + b + c, resolve.Value.fromString("width"), resolve.Value.fromString("height"), resolve.Value.fromString("depth"));
      assertAlgorithmic(v, ['width', 'height', 'depth']);
      var w = v.resolve({width: 22, height: 41, depth: 34});
      assertResolved(w, 97);
    });
  }); 
});
