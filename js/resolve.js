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
  static toValue(string) {
    if (string instanceof Value)
      return string.clone();
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
  clone() {
    return new ResolvedValue(this.value);
  }
}

class ReferenceValue extends Value {
  constructor(reference) {
    super();
    this.reference = reference;
    this.unresolved = new Set([reference]);
  }
  clone() {
    return new ReferenceValue(this.reference);
  }

  resolve(dict) {
    var reference = this.reference;
    if (reference in dict)
      return Value.toValue(dict[reference]).resolve(dict);

    return this;
  }
}

class WeakReferenceValue extends Value {
  constructor(references) {
    super();
    this.references = references.map(a => Value.toValue(a));
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

  clone() {
    return new AlgorithmicValue(this.references.map(a => a.clone()), this.algorithm);
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
    if (this.element.sideToParent == this.side)
      return this.element.parent.sides[this.element.parentSide].length.resolve();
    return this;
  }
}

exports.Value = Value;
exports.ResolvedValue = ResolvedValue;
exports.ReferenceValue = ReferenceValue;
exports.WeakReferenceValue = WeakReferenceValue;
exports.AlgorithmicValue = AlgorithmicValue;
exports.ElementReferenceValue = ElementReferenceValue;
