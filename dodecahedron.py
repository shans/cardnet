from netDraw import *
from dxfwrite import DXFEngine as dxf

drawing = dxf.drawing('dodecahedron.dxf')
base = regular_polygon(30, 5)
for i in range(5):
  l1 = base.join(regular_polygon(30, 5), i, 2, label=str(i))
  l1.join(tabShape(20, 5, 5), 1, 2)
  l1.dsplit(1, 5, 15, SOLID)
  tab(l1, 3, 10, 4, 2, offset=20)
  tab(l1, 4, 10, 5, 5, offset=20)
  l2 = l1.join(regular_polygon(30, 5), 0, 2, label="0")
  l2.join(tabShape(20, 5, 5), 1, 2)
  l2.dsplit(1, 5, 15, SOLID)
  l2.join(tabShape(20, 5, 5), 0, 2)
  l2.dsplit(0, 5, 15, SOLID)
  tab(l2, 3, 10, 5, 5, offset=20)
  if i is not 2:
    l2.join(tabShape(30, 5, 5), 4, 2)
    l2.dsplit(4, 10, 20, SOLID)
    
top = base.get("2").get("0").join(regular_polygon(30, 5), 4, 2, label="0")
for i in range(5):
  if i is not 2:
    tab(top, i, 10, 5, 5, offset=15)
base.draw(drawing, Point(110, 90))
drawing.save()
