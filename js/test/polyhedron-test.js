var assert = require('assert');

var Polyhedron = require('../polyhedron.js').Polyhedron;

describe('Polyhedron', function() {
  describe('#generateFaceList()', function() {
    it('generates a face list', function() {
      let polyhedron = new Polyhedron([3,3,3]);
      assert.deepEqual(polyhedron.asNumericArray(), [ [ 2, 3, 1 ], [ 0, 3, 2 ], [ 1, 3, 0 ], [ 0, 2, 1 ] ]);
    });
    it('generates another face list', function() {
      let polyhedron = new Polyhedron([3,4,3,4]);
      assert.deepEqual(polyhedron.asNumericArray(), 
      [ [ 3, 4, 1 ],
        [ 0, 5, 10, 2 ],
        [ 1, 6, 3 ],
        [ 2, 7, 8, 0 ],
        [ 0, 8, 13, 5 ],
        [ 1, 4, 9 ],
        [ 2, 10, 11, 7 ],
        [ 3, 6, 12 ],
        [ 4, 3, 12 ],
        [ 5, 13, 11, 10 ],
        [ 1, 9, 6 ],
        [ 6, 9, 12 ],
        [ 7, 11, 13, 8 ],
        [ 4, 12, 9 ]
      ]);  
    })
  });
});