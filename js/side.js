"use strict";

class SidePart {
  constructor(start, end, startOffset, endOffset, color) {
    this.start = start;
    this.end = end;
    this.startOffset = startOffset;
    this.endOffset = endOffset;
    this.color = color;
  }

  _unresolvedVars(dict) {
    this.start._unresolvedVars(dict);
    this.end._unresolvedVars(dict);
  }

  split(offset, colors) {
    if (offset < this.startOffset || offset > this.endOffset)
      throw new RangeError("cant't split: offset out of range of side segment")
    var scaledOffset = (offset - this.startOffset) / (this.endOffset - this.startOffset)
    var newPoint = this.start.add(this.end.subtract(this.start).multiply(scaledOffset))
    var result = [];
    if (offset !== this.startOffset)
      result.push(new SidePart(this.start, newPoint, this.startOffset, offset, 
		    colors.before ? colors.before : this.color));
    if (offset !== this.endOffset)
      result.push(new SidePart(newPoint.clone(), this.end, offset, this.endOffset, 
		    colors.after ? colors.after : this.color));
    return result;
  }

  rotate(angle) {
    this.start = this.start.rotate(angle);
    this.end = this.end.rotate(angle);
  }

  render(offset, layers) {
    if (layers !== undefined)
      layers[this.color] = this.color;
    var result = {type: 'line', origin: this.start.render(offset), end: this.end.render(offset)};
    result.layer = this.color;
    return result;
    return {
      type: 'line',
      origin: this.start.render(offset),
      end: this.end.render(offset),
      layer: this.color
    };
  }
}

class Side {
  constructor(start, end, color) {
    this.start = start.clone();
    this.end = end.clone();
    if (this.start.symbolic || this.end.symbolic) {
      this.symbolic = true;
      this.color = color;
      this.resolve = dict => { var s = new Side(start.resolve(dict), end.resolve(dict), color); s.inverted = this.inverted; return s; }
      var d = {};
      start._unresolvedVars(d);
      end._unresolvedVars(d);
      this.unresolved = d;
    } else {
      this.parts = [new SidePart(start, end, 0, 1, color)];
      this.resolve = function() { return this; }.bind(this);
      this.unresolved = [];
    }
    this.length = start.distanceTo(end);
    this.inverted = false;
  }

  _unresolvedVars(dict) {
    for (var k in this.unresolved)
      dict[k] = k;
  } 

  invert() {
    this.inverted = !this.inverted;
  }

  direction() {
    if (this.inverted)
      return this.start.subtract(this.end);
    return this.end.subtract(this.start);
  }

  split(offset, colors) {
    if (this.symbolic) {
      var _resolve = this.resolve;
      this.resolve = dict => _resolve(dict).split(offset, colors);
      return;
    }
    offset /= this.length;
    for (var i = 0; i < this.parts.length; i++) {
      var part = this.parts[i];
      if (offset <= part.endOffset && offset >= part.startOffset) {
	this.parts.splice(i, 1, part.split(offset, colors));
	return this;
      }
    }
  }

  segment(startOffset, endOffset, color) {
    if (this.symbolic) {
      var _resolve = this.resolve;
      this.resolve = dict => _resolve(dict).segment(startOffset, endOffset, color);
      return;
    }
    if (startOffset >= endOffset)
      throw new RangeError("can't segment: startOffset larger than endOffset");
    startOffset /= this.length;
    endOffset /= this.length;
    for (var i = 0; i < this.parts.length; i++) {
      var part = this.parts[i];
      if (startOffset >= part.startOffset && endOffset <= part.endOffset) {
	var firstSplit = part.split(startOffset, {after: color});
	if (firstSplit.length == 2) {
	  var secondSplit = firstSplit[1].split(endOffset, {after: part.color});
	  var result = firstSplit.slice(0, 1).concat(secondSplit);
	} else {
	  var result = firstSplit[0].split(endOffset, {after: part.color});
	}
	this.parts.splice.apply(this.parts, [i, 1].concat(result));
	return this;
      }
    }
  }

  rotate(angle) {
    this.start = this.start.rotate(angle);
    this.end = this.end.rotate(angle);
    if (this.symbolic) {
      var _resolve = this.resolve;
      this.resolve = dict => _resolve(dict).rotate(angle);
      return;
    }
    for (var part of this.parts)
      part.rotate(angle);
  }

  render(offset, layers) {
    return this.parts.map(a => a.render(offset, layers));
  }
}

exports.Side = Side
