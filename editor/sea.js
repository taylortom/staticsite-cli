var width, height, center;
var points;
var path = new Path();
var pathHeight = 75;
path.fillColor = $("body").hasClass("night") ? '#111E2E' : '#6798CA';

// initializePath();

function initializePath() {
  points = Math.round(view.size.width/200);
  center = view.center;
  width = view.size.width;
  height = view.size.height*0.75;

  path.segments = [];

  path.add(view.bounds.bottomLeft);

  for (var i = 0; i <= points; i++)
    path.add(new Point(width/points*i, center.y));

  path.add(view.bounds.bottomRight);

  //path.fullySelected = true;
}

function onFrame(event) {
  pathHeight += (center.y - (view.size.height*0.44) - pathHeight)/points;
  for (var i = 1; i <= (points+1); i++) {
    var sinSeed = event.count + (i + i % 10) * 100;
    var sinHeight = Math.sin(sinSeed / 200) * pathHeight;
    var yPos = Math.sin(sinSeed / 100) * sinHeight + height;
    path.segments[i].point.y = yPos;
  }
  path.smooth();
}

function onResize(event) {
  initializePath();
}
