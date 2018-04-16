var cardnet = require('../cardnet.js');

var base = cardnet.rect('width', 'depth', 'solid');
base.join(cardnet.rect('depth', 'height', 'solid'), 1, 0);
base.join(cardnet.rect('depth', 'height', 'solid'), 3, 0);

var front = base.join(cardnet.rect('width', 'height', 'solid'), 2, 0);
front.join(cardnet.tabShape('height', 'tabdepth'), 1, 0);
front.join(cardnet.tabShape('height', 'tabdepth'), 3, 0);

var back = base.join(cardnet.rect('width', 'height', 'solid'), 0, 0);
back.join(cardnet.tabShape('height', 'tabdepth'), 1, 0);
back.join(cardnet.tabShape('height', 'tabdepth'), 3, 0);

var lid = front.join(cardnet.rect('width', 'depth', 'solid', 'lid'), 2, 0);
lid.join(cardnet.tabShape('width', 'tabdepth'), 2, 0);
lid.join(cardnet.tabShape('depth', 'tabdepth'), 3, 0);
lid.join(cardnet.tabShape('depth', 'tabdepth'), 1, 0);

var styleRules = 
  [
    new cardnet.Rule(new cardnet.ElementSelector('tabShape'), {tabdepth: 5, tabindent: 4}),
    new cardnet.Rule(new cardnet.ComplexSelector(new cardnet.IDSelector('lid')).append(cardnet.Descendant, new cardnet.ElementSelector('tabShape')), {tabdepth: 10})
  ];

/*

tabShape {
  tabdepth: 5;
  tabindent: 4;
}

#lid tabShape {
  tabdepth: 10;
}

*/

/*

<style>
#back > cn-rect {
  --tabdepth: 2;
}
</style>

<cn-rect width='width' height='depth'>
  <cn-rect id='back' height='height' parent-face='0'>
    <cn-tab-shape parent-face='2'></cn-tab-shape>
    <cn-tab-shape parent-face='4'></cn-tab-shape>
  </cn-rect>
  <cn-rect id='right' height='height' parent-face='1'></cn-rect>
  <cn-rect id='front' height='height' parent-face='2'>
    <cn-rect id='lid' height='depth' parent-face='2'>
      <cn-tab-shape parent-face='2'></cn-tab-shape>
      <cn-tab-shape parent-face='3'></cn-tab-shape>
      <cn-tab-shape parent-face='4'></cn-tab-shape>
    </cn-rect>
    <cn-tab-shape parent-face='2'></cn-tab-shape>
    <cn-tab-shape parent-face='4'></cn-tab-shape>
  </cn-rect>
  <cn-rect id='left' height='height' parent-face='3'></cn-rect>
</cn-rect>

*/
/*

rect width depth 
  rect#back ^ height 
    <
    tabShape 
    -
    tabShape 
  rect#right ^ height 
  rect#front ^ height 
    <
    tabShape 
    rect#lid ^ depth 
      <
      tabShape 
      tabShape 
      tabShape 
    tabShape
  rect#left ^ height 

*/

cardnet.toDXF([{shape: base.resolve({width: 20, depth: 30, height: 40}, styleRules), point: new cardnet.Point(50, 50)}], 'box.dxf');
