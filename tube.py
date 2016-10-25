from netDraw import *
from dxfwrite import DXFEngine as dxf

drawing = dxf.drawing('tube.dxf')
tube(50, 40, 60, wallwidth=10, tabwidth=10).draw(drawing, Point(105, 65))
drawing.save()
