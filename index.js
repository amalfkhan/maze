const {Engine, Render, Runner, World, Bodies, Body, Events} = Matter;

const width = window.innerWidth;
const height = window.innerHeight;
const cellsHorizontal = 10;
const cellsVerticle = 15;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVerticle;

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

const grid = Array(cellsVerticle).fill(null).map(() => Array(cellsHorizontal).fill(false));
const verticles = Array(cellsVerticle).fill(null).map(() => Array(cellsHorizontal - 1).fill(false));
const horizontals = Array(cellsVerticle - 1).fill(null).map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVerticle);
const startColumn = Math.floor(Math.random() * cellsHorizontal);


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
      if (nextRow < 0 || nextRow >= cellsVerticle || nextColumn < 0 || nextColumn >= cellsHorizontal) continue;

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
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      5,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: '#1F6BA6',
        },
      },
    );
    World.add(world, wall);
  });

});

verticles.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) return;
    
    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      5,
      unitLengthY,
      {
        label: 'wall',
        isStatic: true,
        render: {
          fillStyle: '#1F6BA6',
        }
      }
    );
    World.add(world, wall);
  });

});

const smallestDimension = Math.min(unitLengthX, unitLengthY);
// goal generation

const goal = Bodies.rectangle(
  width - smallestDimension / 2, //x coord of center of goal
  height - smallestDimension / 2, //y coord of center of goal
  smallestDimension * 0.7,
  smallestDimension * 0.7,
  {
    label: 'goal',
    isStatic: true,
    render: {
      fillStyle: '#F8BB41',
    }
  }
);
World.add(world, goal);

// ball generation
// const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(
  unitLengthX / 2,
  unitLengthY / 2,
  smallestDimension / 4, //radius
  {
    label: 'ball',
    render: {
      fillStyle: '#F8BB41',
    }
  }
);
World.add(world, ball);

document.addEventListener('keydown', event => {
  const {x, y} = ball.velocity;
  if (event.keyCode === 87 || event.keyCode === 38) { //up
    Body.setVelocity(ball, {x, y: y - 3});
  } else if (event.keyCode === 68 || event.keyCode === 39) { //right
    Body.setVelocity(ball, {x: x + 3, y});
  } else if (event.keyCode === 83 || event.keyCode === 40) { //down
    Body.setVelocity(ball, {x, y: y + 3});
  } else if (event.keyCode === 65 || event.keyCode === 37) { //left
    Body.setVelocity(ball, {x: x - 3, y});
  }
});

// document.addEventListener('keyup', event =>{
//   const {x, y} = ball.velocity;
//   if (event.keyCode === 87 || event.keyCode === 38){
//       Body.setVelocity(ball, {x, y:0})
//   }
//   if (event.keyCode === 68 || event.keyCode === 39){
//       Body.setVelocity(ball, {x: 0, y})
//   }
//   if (event.keyCode === 83 || event.keyCode === 40){
//       Body.setVelocity(ball, {x, y:0})
      
//   }
//   if (event.keyCode === 65 || event.keyCode === 37){
//       Body.setVelocity(ball, {x: 0, y})
//   }
// })

// win condition
Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach((collision) => {
    const labels = ['ball', 'goal'];
    
    if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
      document.querySelector('.winner').classList.remove('hidden');
      
      world.gravity.y = 1;
      world.bodies.forEach(body => {
        if (body.label === 'wall') {
          Body.setStatic(body, false);
        }
      });
    }

  });
});
