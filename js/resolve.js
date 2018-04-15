"use strict";

function union(setA, setB) {
    var union = new Set(setA);
    for (let elem of setB) {
        union.add(elem);
    }
    return union;
}

exports.union = union;

class Value {
  constructor() {
    this.symbolic = true;
  }

  resolve(dict) { return this; }

  hasElementReference() {
    return false;
  }

  setElementReferenceLength(length) { }

  static toValue(string) {
    if (string == '<parent>')
      return new ElementReferenceValue();
    if (string instanceof Value)
      return string.clone();
    if (!isNaN(Number(string)))
      return new ResolvedValue(Number(string));
    if (typeof(string) !== "string")
      console.log(string, typeof(string));
    if (string.includes('|'))
      return new WeakReferenceValue(string.split('|').map(a => a.trim()));
    return new ReferenceValue(string);
  }

  dump() { return "Value"; }
}

exports.toValue = Value.toValue;

class ResolvedValue extends Value {
  constructor(value) {
    super();
    this.symbolic = false;
    this.value = value;
    this.unresolved = new Set();
  }
  clone() {
    return new ResolvedValue(this.value);
  }
  dump() { return this.value; }
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

  dump() { return this.reference; }
}

class WeakReferenceValue extends Value {
  constructor(references) {
    super();
    this.references = references.map(a => Value.toValue(a));
    this.unresolved = this.references.map(a => a.unresolved).reduce((a,b) => union(a, b), new Set());
  }

  hasElementReference() {
    return this.references.map(a => a.hasElementReference()).reduce((a,b) => a || b, false);
  }

  setElementReferenceLength(length) {
    this.references.map(a => a.setElementReferenceLength(length));
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

  dump() { return this.references.map(a => a.dump()).join((a,b) => a + ' | ' + b); }
}

class AlgorithmicValue extends Value {
  constructor(args, f) {
    super();
    this.references = args;
    this.algorithm = f;
    this.unresolved = this.references.map(a => a.unresolved).reduce((a,b) => union(a, b), new Set());
  }

  hasElementReference() {
    return this.references.map(a => a.hasElementReference()).reduce((a,b) => a || b, false);
  }

  setElementReferenceLength(length) {
    this.references.map(a => a.setElementReferenceLength(length));
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
  
  dump() { return 'f(' + this.references.map(a => a.dump()).join((a,b) => a + ', ' + b); + ')' }
}

exports.apply = AlgorithmicValue.apply;

class ElementReferenceValue extends Value {
  constructor() { 
    super();
    this.resolvedLength = undefined;
    this.unresolved = new Set();
  }

  hasElementReference() {
    return true;
  }

  setElementReferenceLength(length) {
    this.resolvedLength = length;
  }

  resolve(dict) {
    if (this.resolvedLength !== undefined)
      return this.resolvedLength.resolve(dict);
    return this;
  }

  clone() {
    return this;
  }

  dump() {
    if (this.resolvedLength)
      return '<parent:' + this.resolvedLength.dump() + '>';
    return '<!parent!>';
  }
}

exports.Value = Value;
exports.ResolvedValue = ResolvedValue;
exports.ReferenceValue = ReferenceValue;
exports.WeakReferenceValue = WeakReferenceValue;
exports.AlgorithmicValue = AlgorithmicValue;
exports.ElementReferenceValue = ElementReferenceValue;
