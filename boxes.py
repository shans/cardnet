from netDraw import *
from dxfwrite import DXFEngine as dxf

drawing = dxf.drawing('boxes.dxf')
box(40, 50, 60).draw(drawing, Point(65, 65))
box(20, 30, 20, tabwidth=10).draw(drawing, Point(195, 65))
drawing.save()

