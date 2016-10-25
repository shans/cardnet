from netDraw import *
from dxfwrite import DXFEngine as dxf
import math

def shape(points):
  result = Shape()
  for i in range(len(points)/2):
    result.appendSide(points[2*i], points[2*i+1])
  result.close()
  return result

def joinTo(fr, fside, to, tside, width=10, depth=5, fromOffset=0, toOffset=0, toTab=True, tagWidth=2):
  # TODO: from offset
  tab(fr, fside, width=width, depth=depth, tagWidth=tagWidth, taper=2, tabTaper=2)
  length = to.geom[tside].length
  if toTab:
    to.join(tabShape(length, depth, depth), tside, 2)
  to.dsplit(tside, (length-width)/2.0 + toOffset, (length+width)/2.0 + toOffset, SOLID)

  #base.join(tabShape(width, 10, 0), 0, 2, joinType=EMPTY)
  #base.dsplit(0, width/4, width*3/4, SOLID)
  #tab(base, 2, width=width/2, depth=10, tagWidth=width/4, taper=0, joinType=EMPTY)
  

drawing = dxf.drawing('aic.dxf')

base = shape([40, 0, 40, 10, 30, 10, 20, 10, 20, 40, 0, 40])

rhs = rect(20, 10)
base.join(rhs, 1, 3)
smallTop = rect(10, 10)
rhs.join(smallTop, 1, 3)

bigSide = shape([20, 0, 20, 10, 30, 0, 40, 0, 40, 20, 10, 20, 0, 10])
smallTop.join(shape([10, 0, 20, 10, 0, 10]), 1, 3, label="innerSide").join(rect(10, math.sqrt(200)), 1, 3, label="slope").join(bigSide, 1, 6)

lhs = shape([20, 0, 20, 40, 10, 40, 10, 20, 0, 20])
base.join(lhs, 6, 1);

bhs = shape([20, 0, 20, 10, 30, 10, 30, 0, 40, 0, 40, 20, 0, 20])
base.join(bhs, 0, 6)

fhs1 = rect(10, 20)
base.join(fhs1, 2, 0)

bigTop = rect(20, 20)
bhs.join(bigTop, 0, 2)

topFront = bigTop.join(rect(20, 10), 0, 2)

fhs3 = shape([20, 0, 20, 20, 10, 20, 10, 10, 0, 10])
base.join(fhs3, 5, 0)

nextToSlope = fhs3.join(rect(10, 10), 2, 0, label="otherTop").join(shape([10, 0, 10, 10, 0, 20]), 3, 1).join(rect(10, 20), 3, 1)
slope = fhs3.get("otherTop").join(rect(10, math.sqrt(200)), 2, 0)

joinTo(rhs, 0, bhs, 5)
joinTo(smallTop, 0, bhs, 4, width=5)
joinTo(rhs, 2, fhs1, 1)
joinTo(smallTop, 2, fhs1, 2, width=5)

joinTo(bigSide, 4, fhs3, 1)
joinTo(bigSide, 3, fhs3.get("otherTop"), 1, width=5)
joinTo(bigSide, 0, bigTop, 1)
joinTo(slope, 2, topFront, 0, width=5, toOffset=-5)
joinTo(nextToSlope, 2, topFront, 0, width=5, toOffset=5, toTab=False)
joinTo(lhs, 3, nextToSlope, 3, tagWidth=1.5)
joinTo(lhs, 4, topFront, 3, width=5)
joinTo(lhs, 5, bigTop, 3)
joinTo(lhs, 0, bhs, 7)

joinTo(smallTop.get("innerSide").get("slope"), 2, base, 3, width=5) 
joinTo(base, 4, bigSide, 5)
joinTo(fhs1, 3, smallTop.get("innerSide"), 2)

base.draw(drawing, Point(40, 80))
drawing.save();
