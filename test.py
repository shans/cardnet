from netDraw import *
from dxfwrite import DXFEngine as dxf
import math

drawing = dxf.drawing('test.dxf')
def bendTab(width0, width1, width2, depth0, depth1):
  shape = Shape()
  shape.appendSide(width2, 0)
  shape.appendSide(width2, depth1)
  shape.appendSide((width2+width1)/2.0, depth1)
  shape.appendSide(width2, depth1)
  shape.appendSide(width2, depth1 + depth0)
  shape.appendSide((width2+width0)/2.0, depth1 + depth0)
  shape.appendSide((width2-width0)/2.0, depth1 + depth0)
  shape.appendSide(0, depth1 + depth0)
  shape.appendSide(0, depth1)
  shape.appendSide((width2-width1)/2.0, depth1)
  shape.appendSide(0, depth1)
  shape.close()
  return shape;

base = rect(20, 200)
for i in range(20):
  base.join(bendTab(5, 8, 10, 20, 5), 1, 6, offset=i*10)
  base.join(bendTab(5, 8, 10, 20, 5), 3, 6, offset=i*10)

def loop(radius, tabsize, width):
  tabRatio = (2.0 * tabsize - 2) / tabsize
  excess = (tabRatio - 1) * radius
  tabLength = math.sqrt(excess * excess + (width/2) * (width/2))
  length = 2 * radius * math.pi
  numtabs = int(math.floor(length / tabsize / 2))
  tabExpansion = length / (numtabs * tabsize * 2)
  base = rect(width, length)
  for i in range(numtabs):
    base.join(bendTab(tabsize * tabExpansion, (2 * tabsize - 2) * tabExpansion, 2 * tabsize * tabExpansion,
                      tabLength, 5), 1, 6, offset=i*tabsize*2*tabExpansion)
    base.join(bendTab(tabsize * tabExpansion, (2 * tabsize - 2) * tabExpansion, 2 * tabsize * tabExpansion,
                      tabLength, 5), 3, 6, offset=i*tabsize*2*tabExpansion)
  base.join(tabShape(width, 10, 0), 0, 2, joinType=EMPTY)
  base.dsplit(0, width/4, width*3/4, SOLID)
  tab(base, 2, width=width/2, depth=10, tagWidth=width/4, taper=0, joinType=EMPTY)
  return base

#base.draw(drawing, Point(50, 50))
loop(25, 3, 10).draw(drawing, Point(50, 50))
loop(35, 5, 20).draw(drawing, Point(140, 50))
drawing.save()
