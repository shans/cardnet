import math
from dxfwrite import DXFEngine as dxf
import dxfwrite.const as const

SOLID = 0
FOLD = 1
EMPTY = 2

colors = ["SOLID", "FOLD", "EMPTY"];

def isclose(a, b):
  if a == b:
    return True
  return math.fabs(a-b) < max(1e-09 * max(math.fabs(a), math.fabs(b)), 1e-09)

class Point:
  def __init__(self, x, y):
    self.x = x
    self.y = y
  def plus(self, point):
    return Point(self.x + point.x, self.y + point.y)
  def toDxf(self):
    return (self.x, -self.y)
  def __str__(self):
    return "(%f, %f)" % (self.x, self.y)
  def clone(self):
    return Point(self.x, self.y)
  def rotate(self, angle):
    x = self.x
    y = self.y
    self.x = math.cos(angle) * x - math.sin(angle) * y
    self.y = math.sin(angle) * x + math.cos(angle) * y

class Side:
  def __init__(self, a, b, color):
    self.a = a.clone()
    self.b = b.clone()
    self.parts = []
    self.length = math.sqrt((a.y - b.y) * (a.y - b.y) + (a.x - b.x) * (a.x - b.x))
    self.parts.append([a.clone(), b.clone(), color, 0, 1])
    self.inverted = False
  def invert(self):
    self.inverted = not self.inverted
  def normal(self):
    if self.inverted:
      return Point((self.b.x - self.a.x)/self.length, (self.b.y - self.a.y)/self.length)
    return Point((self.a.x - self.b.x)/self.length, (self.a.y - self.b.y)/self.length)
  def split(self, offset=0, colorBefore=SOLID, colorAfter=SOLID):
    assert (offset >= 0 and offset <= self.length)
    f = offset/self.length
    for i in range(len(self.parts)):
      part = self.parts[i];
      if part[3] < f and part[4] > f:
        ft = part[4]
        part[4] = f
        pt = part[1]
        part[2] = colorBefore
        part[1] = Point(self.a.x + (self.b.x - self.a.x) * f, self.a.y + (self.b.y - self.a.y) * f)
        self.parts.insert(i + 1, [part[1].clone(), pt, colorAfter, f, ft])
        return
  def dsplit(self, o1, o2, interior):
    # TODO: implement properly
    #assert (self.parts[0][4] > o2/self.length)
    assert (o1 < o2)
    exterior = self.parts[0][2]
    self.split(o1, exterior, interior)
    self.split(o2, interior, exterior)
  def setColor(self, color):
    for part in self.parts:
      part[2] = color
  def draw(self, drawing, offset):
    for part in self.parts:
      drawing.add(dxf.line(offset.plus(part[0]).toDxf(), offset.plus(part[1]).toDxf(), color=part[2]))
  def rotate(self, angle):
    self.a.rotate(angle)
    self.b.rotate(angle)
    for part in self.parts:
      part[0].rotate(angle)
      part[1].rotate(angle)
  def __str__(self):
    return reduce(lambda a, b: a + "|" + b, map(lambda a: "%s-%s (%s)" % (a[0], a[1], colors[a[2]]), self.parts)) 
    

class Shape:
  def __init__(self):
    self.geom = []
    self.tabs = []
    self.base = Point(0, 0)
    self.children = []
    self.labels = {}
    self.inverted = False
    self.text = None
  def appendSide(self, x, y):
    if len(self.geom) == 0:
      start = Point(0, 0) 
    else:
      start = self.geom[-1].b
    self.geom.append(Side(start, Point(x, y), SOLID))
  def close(self):
    self.appendSide(0, 0)
  def draw(self, drawing, offset=Point(0, 0)):
    offset = offset.plus(self.base)
    if self.text is not None:
      drawing.add(dxf.text(self.text, insert=self.textOffset.plus(offset).toDxf(), height=5, halign=const.CENTER))
    for side in self.geom:
      side.draw(drawing, offset)
    for child in self.children:
      child.draw(drawing, offset)
  def rotate(self, angle):
    self.base.rotate(angle)
    for side in self.geom:
      side.rotate(angle)
    for child in self.children:
      child.rotate(angle)
  def __str__(self):
    return reduce(lambda a, b: a + " " + b, map(str, self.geom))
  def dsplit(self, side, o1, o2, color, tolerance=0.2):
    self.geom[side].dsplit(o1-tolerance, o2+tolerance, color)
  def join(self, shape, thisSide, shapeSide, offset=0, label=None, joinType=FOLD):
    thisN = self.geom[thisSide].normal()
    shapeN = shape.geom[shapeSide].normal()
    angle = math.acos(max(-1, min(thisN.x * (-shapeN.x) + thisN.y * (-shapeN.y), 1)))
    shape.rotate(angle)
    shapeN = shape.geom[shapeSide].normal()
    if not (isclose(thisN.x, -shapeN.x) and isclose(thisN.y, -shapeN.y)):
      shape.rotate(-2 * angle)
      shapeN = shape.geom[shapeSide].normal() 
    #assert (isclose(thisN.x, -shapeN.x) and isclose(thisN.y, -shapeN.y))
    thisSide = self.geom[thisSide];
    shapeSide = shape.geom[shapeSide];
    assert (offset > -shapeSide.length)
    assert (offset < thisSide.length)
    if offset <= 0 and offset + shapeSide.length >= thisSide.length:
      thisSide.setColor(joinType)
    if offset >= 0 and offset + shapeSide.length <= thisSide.length:
      shapeSide.setColor(EMPTY)
    self.children.append(shape)
    if offset >= 0:
      thisSide.split(offset, SOLID, joinType)
    if offset <= 0:
      shapeSide.split(shapeSide.length - offset, SOLID, EMPTY)
    if offset + shapeSide.length <= thisSide.length:
      thisSide.split(shapeSide.length + offset, joinType, SOLID)
    if thisSide.length - offset <= shapeSide.length:
      shapeSide.split(thisSide.length - offset, EMPTY, SOLID)
    if not (self.inverted == shape.inverted):
      offset = thisSide.length - offset
    shape.base.x = thisSide.a.x - shapeSide.b.x + (offset / thisSide.length) * (thisSide.b.x - thisSide.a.x)
    shape.base.y = thisSide.a.y - shapeSide.b.y + (offset / thisSide.length) * (thisSide.b.y - thisSide.a.y)
    if label is not None:
      self.labels[label] = shape
    return shape
  def subPart(self, shape, offset=Point(0, 0), label=None):
    self.children.append(shape)
    shape.base = offset
    if label is not None: 
      self.labels[label] = shape
  def get(self, label):
      return self.labels[label]
  def hole(self, shape, offset, label=None):
    self.children.append(shape)
    shape.base = offset
    shape.invert()
    if label is not None:
      self.labels[label] = shape
  def invert(self):
    self.inverted = not self.inverted
    for side in self.geom:
      side.invert()
    for child in self.children:
      child.invert()
  def setText(self, text, offset):
    self.text = text
    self.textOffset = offset
  

def rect(width, height):
  shape = Shape()
  shape.appendSide(width, 0)
  shape.appendSide(width, height)
  shape.appendSide(0, height)
  shape.close()
  return shape;

def tabShape(length, depth, taper=2):
  shape = Shape()
  shape.appendSide(length - 2 * taper, 0)
  shape.appendSide(length - taper, depth)
  shape.appendSide(-taper, depth)
  shape.close()
  return shape

def regular_polygon(sideLength, sideCount):
  angle = 2 * math.pi / sideCount
  polarDistance = sideLength / 2 / math.sin(angle/2)
  shape = Shape()
  for i in range(1, sideCount):
    shape.appendSide(polarDistance * math.sin(i * angle), polarDistance - polarDistance * math.cos(i * angle))
  shape.close()
  return shape

def tab(shape, side, width=10, depth=5, tagWidth=5, taper=2, tabTaper=0, offset=None, joinType=FOLD):
  if offset is None:
    offset = shape.geom[side].length / 2.0
  offset -= width/2.0
  tabBody = tabShape(width, depth, tabTaper)
  shape.join(tabBody, side, 2, offset, joinType=joinType)
  tabDepth = math.sqrt(tabTaper * tabTaper + depth * depth)
  tabLeft = tabShape(tabDepth, tagWidth, taper)
  tabBody.join(tabLeft, 1, 2)
  tabRight = tabShape(tabDepth, tagWidth, taper)
  tabBody.join(tabRight, 3, 2)
  return shape

def box(width, height, depth, tabwidth=20):
  base = rect(width, depth)
  back = rect(width, height)
  back.join(tabShape(height, 10), 3, 2)
  back.join(tabShape(height, 10), 1, 2)
  back.dsplit(3, height - tabwidth - 5, height - 5, SOLID)
  back.dsplit(1, 5, tabwidth + 5, SOLID)
  base.join(back, 0, 2, label="back")
  left = rect(depth, height)
  tab(left, 3, tabwidth, 10, 5, offset=height - tabwidth/2 - 5)
  tab(left, 1, tabwidth, 10, 5, offset=5 + tabwidth/2)
  base.join(left, 3, 2, label="left")
  right = rect(depth, height)
  tab(right, 3, tabwidth, 10, 5, offset=height - tabwidth/2 - 5)
  tab(right, 1, tabwidth, 10, 5, offset=5 + tabwidth/2)
  base.join(right, 1, 2, label="right")
  front = rect(width, height)
  front.join(tabShape(height, 10), 3, 2)
  front.join(tabShape(height, 10), 1, 2)
  front.dsplit(3, height - tabwidth - 5, height - 5, SOLID)
  front.dsplit(1, 5, tabwidth + 5, SOLID)
  base.join(front, 2, 2, label="front")
  return base

def tube(width, height, depth, wallwidth=5, tabwidth=20):
  base = box(width, height, depth, tabwidth)
  base.hole(rect(width-2*wallwidth, depth-2*wallwidth), Point(wallwidth, wallwidth), label="hole")
  top = rect(width, depth)
  top.hole(rect(width-2*wallwidth, depth-2*wallwidth), Point(wallwidth, wallwidth), label="hole")
  tab(top, 1, tabwidth, 10, 5, offset=depth/2)
  tab(top, 0, tabwidth, 10, 5, offset=width/2)
  tab(top, 2, tabwidth, 10, 5, offset=width/2)
  base.get("left").join(top, 0, 3)
  base.get("right").join(tabShape(depth, 10), 0, 2)
  base.get("right").dsplit(0, (depth-tabwidth)/2, (depth+tabwidth)/2, SOLID)
  base.get("front").join(tabShape(width, 10), 0, 2)
  base.get("front").dsplit(0, (width-tabwidth)/2, (width+tabwidth)/2, SOLID)
  base.get("back").join(tabShape(width, 10), 0, 2)
  base.get("back").dsplit(0, (width-tabwidth)/2, (width+tabwidth)/2, SOLID)

  for i in range(4):
    if i % 2:
      w = depth - 2 * wallwidth
    else:
      w = width - 2 * wallwidth
    top.get("hole").join(tabShape(tabwidth, 10, taper=5), i, 2, offset=(w-tabwidth)/2)
    #tab(top.get("hole"), i, tabwidth, 10, 5, offset=w/2)
    tab(base.get("hole"), i, tabwidth, 10, 5, offset=w/2)

  def tubeWall(w):
    tube = rect(w, height)
    tube.join(tabShape(w, 10), 0, 2)
    tube.join(tabShape(w, 10), 2, 2)
    tube.dsplit(0, (w-tabwidth)/2, (w+tabwidth)/2, SOLID)
    tube.dsplit(2, (w-tabwidth)/2, (w+tabwidth)/2, SOLID)
    return tube

  base.subPart(tubeWall(width - wallwidth * 2), Point(0, depth + width + tabwidth + 20), label="tube")
  base.get("tube").join(tubeWall(depth - wallwidth * 2), 1, 3, label="right")
  base.get("tube").join(tubeWall(depth - wallwidth * 2), 3, 1, label="left")
  base.get("tube").get("left").join(tubeWall(width - wallwidth * 2), 3, 1, label="back")
  tab(base.get("tube").get("left").get("back"), 3, tabwidth, 10, 5, offset=height/2)
  base.get("tube").get("right").join(tabShape(height, 10), 1, 2)
  base.get("tube").get("right").dsplit(1, (height-tabwidth)/2, (height+tabwidth)/2, SOLID)

  return base
