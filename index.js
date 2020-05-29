const {Engine, Render, Runner, World, Bodies} = Matter;

const width = 500;
const height = 500;
const cells = 10;
const unitLength = width/cells //width of one cell

const engine = Engine.create();
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
	Bodies.rectangle(width/2, 0, width, 40, {isStatic: true}), //top: x, y, width of rectangle, height of rectangle
	Bodies.rectangle(width/2, height, width, 40, {isStatic: true}), //bottom
	Bodies.rectangle(0, height/2, 40, height, {isStatic: true}), //left
	Bodies.rectangle(width, height/2, 40, height, {isStatic: true}), //right
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
		[row - 1, column, "up"],
		[row, column + 1, "right"],
		[row + 1, column, "down"], 
		[row, column - 1, "left"]
	]);
		
		
    for (let neighbour of neighbours) {
      const [nextRow, nextColumn, direction] = neighbour;
    
      //out of bounds?
      if (nextRow < 0 || nextRow >= cells || nextColumn < 0 || nextColumn >= cells) continue;

      //have we visited it?
      if (grid[nextRow][nextColumn]) continue;

      if (direction === "left") {
        verticles[row][column - 1] = true;
      } else if (direction === "right") {
        verticles[row][column] = true;
      } else if (direction === "up") {
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
        isStatic: true,
      }
    );
    World.add(world, wall);
  });

});