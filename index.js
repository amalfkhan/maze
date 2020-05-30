const {Engine, Render, Runner, World, Bodies, Body, Events} = Matter;

const width = 500;
const height = 500;
const cells = 10;
const unitLength = width/cells //width of one cell

const engine = Engine.create();
engine.world.gravity.y = 0;
const {world} = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		wireframes: false,
		width: width,
		height: height
	}
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Boundaries
const boundaries = [
	Bodies.rectangle(width/2, 0, width, 2, {isStatic: true}), //top: x, y, width of rectangle, height of rectangle
	Bodies.rectangle(width/2, height, width, 2, {isStatic: true}), //bottom
	Bodies.rectangle(0, height/2, 2, height, {isStatic: true}), //left
	Bodies.rectangle(width, height/2, 2, height, {isStatic: true}), //right
];
World.add(world,boundaries);


// Maze generation
const shuffle = (array) => {
  let counter = array.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter --;
    
    const tmp = array[counter];
    array[counter] = array[index];
    array[index] = tmp;
  }

  return array;
};

const grid = Array(cells).fill(null).map(() => Array(cells).fill(false));
const verticles = Array(cells).fill(null).map(() => Array(cells - 1).fill(false));
const horizontals = Array(cells - 1).fill(null).map(() => Array(cells).fill(false));
const startRow = Math.floor(Math.random() * cells);
const startColumn = Math.floor(Math.random() * cells);


const recurseMaze = (row, column) => {
	//if visited return
	if(grid[row][column]) return;

	//mark as visited
	grid[row][column] = true;

	//compile list of neighbours
	const neighbours = shuffle([
		[row - 1, column, 'up'],
		[row, column + 1, 'right'],
		[row + 1, column, 'down'], 
		[row, column - 1, 'left']
	]);
		
		
    for (let neighbour of neighbours) {
      const [nextRow, nextColumn, direction] = neighbour;
    
      //out of bounds?
      if (nextRow < 0 || nextRow >= cells || nextColumn < 0 || nextColumn >= cells) continue;

      //have we visited it?
      if (grid[nextRow][nextColumn]) continue;

      if (direction === 'left') {
        verticles[row][column - 1] = true;
      } else if (direction === 'right') {
        verticles[row][column] = true;
      } else if (direction === 'up') {
        horizontals[row - 1][column] = true;
      } else {
        horizontals[row][column] = true;
      }

      //visit next cell
      recurseMaze(nextRow, nextColumn);

    }
}

recurseMaze(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;
    
    const wall = Bodies.rectangle(
      columnIndex * unitLength + unitLength / 2,
      rowIndex * unitLength + unitLength,
      unitLength,
      10,
      {
        label: 'wall',
        isStatic: true,
      }
    );
    World.add(world, wall);
  });

});

verticles.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;
    
    const wall = Bodies.rectangle(
      columnIndex * unitLength + unitLength,
      rowIndex * unitLength + unitLength / 2,
      10,
      unitLength,
      {
        label: 'wall',
        isStatic: true,
      }
    );
    World.add(world, wall);
  });

});


// goal generation
const goal = Bodies.rectangle(
  width - unitLength / 2, //x coord of center of goal
  height - unitLength / 2, //y coord of center of goal
  unitLength * 0.7,
  unitLength * 0.7,
  {
    label: 'goal',
    isStatic: true,
  }
);
World.add(world, goal);

// ball generation
const ball = Bodies.circle(
  unitLength / 2,
  unitLength / 2,
  unitLength / 4, //radius
  {
    label: 'ball',
  }
);
World.add(world, ball);

document.addEventListener('keydown', event => {
  const {x, y} = ball.velocity;
  if (event.keyCode === 87 || event.keyCode === 38) { //up
    Body.setVelocity(ball, {x, y: y - 5});
  } else if (event.keyCode === 68 || event.keyCode === 39) { //right
    Body.setVelocity(ball, {x: x + 5, y});
  } else if (event.keyCode === 83 || event.keyCode === 40) { //down
    Body.setVelocity(ball, {x, y: y + 5});
  } else if (event.keyCode === 65 || event.keyCode === 37) { //left
    Body.setVelocity(ball, {x: x - 5, y});
  }
});

// win condition
Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach((collision) => {
    const labels = ['ball', 'goal'];
    
    if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
      world.gravity.y = 1;
      world.bodies.forEach(body => {
        if (body.label === 'wall') {
          Body.setStatic(body, false);
        }
      });
    }

  });
});
