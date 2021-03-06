"use strict";

let assert = require('assert');
let Polygon = require('./polygon.js').Polygon;

if (typeof assert !== 'function') {
  assert = () => {};
}

(function() {

const FREE_EDGE = -1;
const PREVIOUS_EDGE = 1;
const NEXT_EDGE = 2;

class Face {
  constructor(num_sides, id) {
    this.id = id;
    this.sides = [];
    for (var i = 0; i < num_sides; i++)
      this.sides.push(FREE_EDGE)
  }
  side(i) {
    return {
      face: this,
      side: i,
      connect: side => {
        assert(this.sides[i] == -1);
        assert(side.face.sides[side.side] == -1);
        this.sides[i] = side.face;
        side.face.sides[side.side] = this;
      },
      previous: () => {
        if (i == 0)
          return this.lastSide();
        return this.side(i - 1);
      },
      next: () => {
        if (i == this.sides.length - 1)
          return this.firstSide();
        return this.side(i + 1);
      },
      connectedFace: () => {
        return this.sides[i] == FREE_EDGE ? null : this.sides[i];
      }
    }
  }
  firstSide() {
    return this.side(0);
  }
  lastSide() {
    return this.side(this.sides.length - 1);
  }
  firstFreeSide() {
    let idx = this.sides.indexOf(FREE_EDGE);
    if (idx == -1)
      return null;
    return this.side(idx);
  }
  findEdgePointingAt(face) {
    return this.side(this.sides.indexOf(face));
  }
  numSides() {
    return this.sides.length;
  }
}


class Polyhedron {
  constructor(facesAroundCorner) {
    this.faces = [];
    this.generateFaceList(facesAroundCorner);
  }

  asNumericArray() {
    let faceMap = new Map();
    for (let i = 0; i < this.faces.length; i++)
      faceMap.set(this.faces[i], i);
    let output = [];
    for (let i = 0; i < this.faces.length; i++) {
      let face = this.faces[i];
      let faceRep = face.sides.map(a => faceMap.get(a));
      output.push(faceRep);
    }
    return output;
  }

  asNet(sideLength) {
    let numericArray = this.asNumericArray();
    let faces = [];
    for (let faceNo = 0; faceNo < numericArray.length; faceNo++) {
      let face = numericArray[faceNo];
      faces.push(new Polygon(face.length, sideLength));
      let toIdx = 0;
      let toNum = face[0];
      for (let i = 1; i < face.length; i++) {
        if (face[i] < toNum) {
          toNum = face[i];
          toIdx = i;
        }
      }
      if (toNum < faces.length) {
        let fromIdx = numericArray[toNum].indexOf(faceNo);
        faces[toNum].join(faces[faces.length - 1], fromIdx, toIdx);
      }
    }
    return faces[0];
  }

  newFace(num_sides) {
    let face = new Face(num_sides, this.faces.length);
    this.faces.push(face);
    return face;
  }

  countFacesAroundVertex(face, edge, direction) {
    assert(edge !== null);
    let originFace = face;
    let originEdge = edge;
    let count = 1;
    let sideCounts = [face.numSides()];
    while (true) {
      let edgeToCheck = direction == PREVIOUS_EDGE ? edge.previous() : edge.next();
      if (edgeToCheck.connectedFace() == null)
        return {face, edge: edgeToCheck, count, sideCounts, originFace, originEdge, direction};
      let newFace = edgeToCheck.connectedFace();
      edge = newFace.findEdgePointingAt(face);
      assert(edge !== null);
      if (newFace == originFace) {
        return {face, edge, count, sideCounts}; 
      }
      face = newFace;
      count++;
      sideCounts.push(face.numSides());
    }
  }
  
  createNewFace(originFace, facesAroundCorner) {
    // find free edge
    let freeEdge = originFace.firstFreeSide();
    // something else has already processed this side
    if (freeEdge == null)
      return;
    // check previous vertex for extra connection point
    let previousInfo = this.countFacesAroundVertex(originFace, freeEdge, PREVIOUS_EDGE);

    // check next vertex for extra connection point
    let nextInfo = this.countFacesAroundVertex(originFace, freeEdge, NEXT_EDGE);

    // match sides
    let sideInfo = previousInfo.count > nextInfo.count ? previousInfo.sideCounts : nextInfo.sideCounts;
    let facesAround = facesAroundCorner.concat(facesAroundCorner);
    let offset = 0;
    for (let i = 0; i < sideInfo.length; i++) {
      if (facesAround[i + offset] !== sideInfo[i]) {
        i = 0;
        offset++;
      }
    }
    let position = offset - 1;
    if (position == -1)
      position = facesAroundCorner.length - 1;
    // create new face
    let face = this.newFace(facesAroundCorner[position]);
    let side = face.side(0);
    freeEdge.connect(side);
    // attach extra connection points
    assert(previousInfo.count < facesAroundCorner.length);
    assert(nextInfo.count < facesAroundCorner.length);
    let sideForPreviousInfo = side.next();
    while (previousInfo.count == facesAroundCorner.length - 1) {
      previousInfo.edge.connect(sideForPreviousInfo);
      previousInfo = this.countFacesAroundVertex(previousInfo.face, previousInfo.edge, PREVIOUS_EDGE);
      sideForPreviousInfo = sideForPreviousInfo.next();
    }
    // nextInfo needs to be recomputed in case previousInfo looping has changed it
    nextInfo = this.countFacesAroundVertex(originFace, freeEdge, NEXT_EDGE);
    let sideForNextInfo = side.previous();
    while (nextInfo.count == facesAroundCorner.length - 1) {
      nextInfo.edge.connect(sideForNextInfo);
      nextInfo = this.countFacesAroundVertex(nextInfo.face, nextInfo.edge, NEXT_EDGE);
      sideForNextInfo = sideForNextInfo.previous();
    }
    return face;
  }

  generateFaceList(facesAroundCorner) {
    // set up all the faces around the first vertex.
    let firstFace = this.newFace(facesAroundCorner[0]);
    let prevFace = firstFace;
    for (let i = 1; i < facesAroundCorner.length; i++) {
      let face = this.newFace(facesAroundCorner[i]);
      face.firstSide().connect(prevFace.lastSide());
      prevFace = face;
    }
    firstFace.firstSide().connect(prevFace.lastSide());

    // all of these faces are unfinished - each should have at least a 3rd edge that isn't yet connected
    let unfinished = this.faces.slice();

    while (unfinished.length > 0) {
      let currentFace = unfinished[0];
      unfinished = unfinished.slice(1);
      let newFace = this.createNewFace(currentFace, facesAroundCorner);
      if (newFace)
        unfinished.push(newFace);
      if (currentFace.firstFreeSide() !== null)
        unfinished.push(currentFace);
    }

    return;
  }
}

exports.Polyhedron = Polyhedron;

})();