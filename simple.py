from netDraw import *
from dxfwrite import DXFEngine as dxf

drawing = dxf.drawing('simple.dxf')

base = rect(40, 40);
base.join(rect(20, 40), 2, 0)
base.join(rect(20, 40), 2, 0, offset=20)

base.draw(drawing, Point(40, 40));
drawing.save();
