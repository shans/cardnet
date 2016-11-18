"use strict";

function union(setA, setB) {
    var union = new Set(setA);
    for (let elem of setB) {
        union.add(elem);
    }
    return union;
}

class Value {
  resolve(dict) { return this; }
  static fromString(string) {
    if (!isNaN(Number(string)))
      return new ResolvedValue(Number(string));
    if (string.includes('|'))
      return new WeakReferenceValue(string.split('|').map(a => a.trim()));
    return new ReferenceValue(string);
  }
}

class ResolvedValue extends Value {
  constructor(value) {
    super();
    this.value = value;
    this.unresolved = new Set();
  }
}

class ReferenceValue extends Value {
  constructor(reference) {
    super();
    this.reference = reference;
    this.unresolved = new Set([reference]);
  }

  resolve(dict) {
    var reference = this.reference;
    if (reference in dict)
      return Value.fromString(dict[reference]).resolve(dict);

    return this;
  }
}

class WeakReferenceValue extends Value {
  constructor(references) {
    super();
    if (references[0] instanceof Value)
      this.references = references;
    else
      this.references = references.map(a => Value.fromString(a));
    this.unresolved = this.references.map(a => a.unresolved).reduce((a,b) => union(a, b), new Set());
  }

  resolve(dict) {
    var reference = this.references[0];
    var resolvedReference = reference.resolve(dict);

    if (this.references.length == 1)
      return resolvedReference;

    if (resolvedReference == reference)
      return new WeakReferenceValue(this.references.slice(1)).resolve(dict);
    if (resolvedReference instanceof ResolvedValue)
      return resolvedReference;
    return new WeakReferenceValue([resolvedReference].concat(this.references.slice(1))).resolve(dict);
  }
}

class AlgorithmicValue extends Value {
  constructor(args, f) {
    super();
    this.references = args;
    this.algorithm = f;
    this.unresolved = this.references.map(a => a.unresolved).reduce((a,b) => union(a, b), new Set());
  }

  resolve(dict) {
    var references = this.references.map(a => a.resolve(dict));
    if (references.filter(a => a.constructor != ResolvedValue).length == 0) {
      references = references.map(a => a.value);
      return new ResolvedValue(this.algorithm.apply(undefined, references));
    }
    return new AlgorithmicValue(references, this.algorithm);
  }

  static apply(f) {
    var args = [];
    for (var i = 1; i < arguments.length; i++)
      args.push(arguments[i]);
    return new AlgorithmicValue(args, f).resolve({});
  }
}

class ElementReferenceValue extends Value {
  constructor(element, side) { 
    super();
    this.element = element;
    this.side = side;
  }

  resolve(dict) {
    return this.element.sides[this.side].length.resolve();
  }
}

exports.Value = Value;
exports.ResolvedValue = ResolvedValue;
exports.ReferenceValue = ReferenceValue;
exports.WeakReferenceValue = WeakReferenceValue;
exports.AlgorithmicValue = AlgorithmicValue;
exports.ElementReferenceValue = ElementReferenceValue;
