"use strict";

class Selector {
  constructor() { }

  matches(shape) {
    return false;
  }

  partiallyMatches(shape) {
    return undefined;
  }
}

class IDSelector extends Selector {
  constructor(id) {
    super();
    this.id = id;
    this.priority = [0,1,0];
  }

  matches(shape) {
    return shape.id == this.id;
  }
}

class ClassSelector extends Selector {
  constructor(clazz) {
    super();
    this.clazz = clazz;
    this.priority = [0,0,1];
  }

  matches(shape) {
    return shape.classList.includes(this.clazz);
  }
}

class ElementSelector extends Selector {
  constructor(elementName) {
    super();
    this.elementName = elementName;
    this.priority = [1,0,0]
  }

  matches(shape) {
    return shape.name == this.elementName;
  }
}

class Combinator {
  constructor(id) {
    this.id = id;
  }
}

exports.Descendant = new Combinator('descendant');

class ComplexSelector extends Selector {
  constructor(selectors, combinators, priority) {
    super();
    if (combinators == undefined) {
      this.selectors = [selectors];
      this.combinators = [];
      this.priority = selectors.priority;
    } else {
      this.selectors = selectors;
      this.combinators = combinators;
      this.priority = priority;
    }
  }

  append(combinator, selector) {
    this.selectors.push(selector);
    this.combinators.push(combinator);
    for (var i = 0; i < this.priority.length; i++) {
      this.priority[i] += selector.priority[i];
    }
    return this;
  }

  matches(shape) {
    return this.selectors.length == 1 && this.selectors[0].matches(shape);
  }

  partiallyMatches(shape) {
    if (this.selectors.length > 1 && this.selectors[0].matches(shape))
      return {combinator: this.combinators[0],
              selector: new ComplexSelector(this.selectors.slice(1), this.combinators.slice(1), this.priority)};
    return undefined;
  }
}

class Rule {
  constructor(selector, propertySet) {
    this.selector = selector;
    this.propertySet = propertySet;
    this.priority = selector.priority;
  }

  matches(shape) {
    return this.selector.matches(shape);
  }

  partiallyMatches(shape) {
    var partial = this.selector.partiallyMatches(shape);
    if (partial)
      return {combinator: partial.combinator, rule: new Rule(partial.selector, this.propertySet)}
  }

  apply(propertySet) {
    var ps = {};
    for (var property in propertySet)
      ps[property] = propertySet[property];
    for (property in this.propertySet)
      ps[property] = this.propertySet[property];
    return ps;
  }
}

exports.IDSelector = IDSelector;
exports.ClassSelector = ClassSelector;
exports.ElementSelector = ElementSelector;
exports.ComplexSelector = ComplexSelector;
exports.Rule = Rule;
