let thingsToLoad = [
  "images/timeBombPanic.png",
  "maps/walkThePath.json"
];

//Create a new Hexi instance, and start it.
let g = hexi(832, 768, setup, thingsToLoad);

//Set the background color and scale the canvas
//g.backgroundColor = "black";
g.scaleToWindow();

//Start Hexi
g.start();

//Game variables
let alien, wayPoints2DArray, calculateNewPath,
  destinationX, destinationY;

//The `setup` function to initialize your application
function setup() {

  //Make the world from the Tiled JSON data and the tileset PNG image
  world = g.makeTiledWorld(
    "maps/walkThePath.json",
    "images/timeBombPanic.png"
  );

  //Create the alien sprite 
  alien = world.getObject("alien");

  //Create the bomb sprite
  //bomb = world.getObject("bomb");

  //Get a reference to the array that stores all the wall data
  wallMapArray = world.getObject("wallLayer").data;

  //An array that will be used to store sub-arrays of 
  //x/y position value pairs that we're going to use
  //to change the velocity of the alien sprite
  wayPoints2DArray = [];

  //A Boolean that will be set to true when the pointer
  //is clicked, and set to false when the new path
  //is calculated
  calculateNewPath = false;


  //The mouse pointer's `release` function runs the code that
  //calculates the shortest path and draws that sprites that
  //represent it
  g.pointer.release = () => {

    //Set the new path's desination to the pointer's
    //current x and y position
    destinationX = g.pointer.x;
    destinationY = g.pointer.y;

    //Set `calculateNewPath` to true
    calculateNewPath = true;
  };


  //Change the game state to `play` to start the game loop
  g.state = play;
}

function play() {

  //Find out if the alien is centered over a tile cell 
  if (isCenteredOverCell(alien)) {

    //If `calculateNewPath` has been set to `true` by the pointer,
    //Find the new shortest path between the alien and the pointer's
    //x and y position (`destinationX` and `destinationY`)
    if (calculateNewPath) {

      //calculate the shortest path
      let path = shortestPath(
        getIndex(alien.centerX, alien.centerY, 64, 64, 13), //The start map index
        getIndex(destinationX, destinationY, 64, 64, 13), //The destination index
        wallMapArray, //The map array
        13, //Map width, in tiles
        [2, 3], //Obstacle gid array
        "manhattan" //Heuristic to use
      );

      //Remove the first node of the `path` array. That's because we
      //don't need it: the alien sprite's current location and the
      //first node in the `path` array share the same location.
      //In the code ahead we're going to tell the alien sprite to move
      //from its current location, to first new node in the path.
      path.shift();

      //If the path isn't empty, fill the `wayPoints2DArray` with
      //sub arrays of x/y position value pairs. 
      if (path.length !== 0) {

        //Get a 2D array of x/y points
        wayPoints2DArray = path.map(node => {

          //Figure out the x and y location of each square in the path by
          //multiplying the node's `column` and `row` by the height, in
          //pixels, of each cell: 64 
          let x = node.column * 64,
            y = node.row * 64;

          //Return a sub-array containing the x and y position of each node
          return [x, y];
        });
      }

      //Set `calculateNewPath` to `false` so that this block of code.
      //won't run again inside the game loop. (It can be set to `true`
      //again by clicking the pointer.) 
      calculateNewPath = false;
    }

    //Set the alien's new velocity based on 
    //the alien's relative x/y position to the current, next, way point. 
    //Because we are always going to 
    //remove a way point element after we set this new 
    //velocity, the first element in the `wayPoints2DArray`
    //will always refer to the next way point that the 
    //alien sprite has to move to  
    if (wayPoints2DArray.length !== 0) {

      //Left
      if (wayPoints2DArray[0][0] < alien.x) {
        alien.vx = -4;
        alien.vy = 0;

        //Right
      } else if (wayPoints2DArray[0][0] > alien.x) {
        alien.vx = 4;
        alien.vy = 0;

        //Up
      } else if (wayPoints2DArray[0][1] < alien.y) {
        alien.vx = 0;
        alien.vy = -4;

        //Down
      } else if (wayPoints2DArray[0][1] > alien.y) {
        alien.vx = 0;
        alien.vy = 4;
      }

      //Remove the current way point, so that next time around
      //the first element in the `wayPoints2DArray` will correctly refer
      //to the next way point that that alien sprite has
      //to move to
      wayPoints2DArray.shift();

      //If there are no way points remaining, 
      //set the alien's velocity to 0
    } else {
      alien.vx = 0;
      alien.vy = 0;
    }
  }

  //Move the alien based on the new velocity
  alien.x += alien.vx;
  alien.y += alien.vy;
}

//Helper functions
//`isCenteredOverCell` returns true or false depending on whether a 
//sprite is exactly aligned to an intersection in the maze corridors
function isCenteredOverCell(sprite) {
  return Math.floor(sprite.x) % world.tilewidth === 0 && Math.floor(sprite.y) % world.tileheight === 0
}


//The `getIndex` helper method
//converts a sprite's x and y position to an array index number.
//It returns a single index value that tells you the map array
//index number that the sprite is in
function getIndex(x, y, tilewidth, tileheight, mapWidthInTiles) {
  let index = {};

  //Convert pixel coordinates to map index coordinates
  index.x = Math.floor(x / tilewidth);
  index.y = Math.floor(y / tileheight);

  //Return the index number
  return index.x + (index.y * mapWidthInTiles);
}

//The `shortestPath` function
function shortestPath(
  startIndex,
  destinationIndex,
  mapArray,
  mapWidthInTiles,
  obstacleGids = [],
  heuristic = "manhattan"
) {

  //The `nodes` function creates the array of node objects
  let nodes = (mapArray, mapWidthInTiles) => {
    return mapArray.map((cell, index) => {

      //Figure out the row and column of this cell
      let column = index % mapWidthInTiles;
      let row = Math.floor(index / mapWidthInTiles);

      //The node object
      return node = {
        f: 0,
        g: 0,
        h: 0,
        parent: null,
        column: column,
        row: row,
        index: index
      };
    });
  };

  //Initialize the shortestPath array
  let shortestPath = [];

  //Initialize the node map
  let nodeMap = nodes(mapArray, mapWidthInTiles);

  //Initialize the closed and open list arrays
  let closedList = [];
  let openList = [];

  //Declare the "costs" of travelling in straight or
  //diagonal lines
  let straightCost = 10;
  let diagonalCost = 14;

  //Get the start node
  let startNode = nodeMap[startIndex];

  //Get the current center node. The first one will 
  //match the path's start position
  let centerNode = startNode;

  //Push the `centerNode` into the `openList`, because
  //it's the first node that we're going to check
  openList.push(centerNode)

  //Get the current destination node. The first one will 
  //match the path's end position
  let destinationNode = nodeMap[destinationIndex];

  //All the nodes that are surrounding the current map index number
  let surroundingNodes = (index, mapArray, mapWidthInTiles) => {

    //Find out what all the surrounding nodes are, including those that
    //might be beyond the borders of the map
    let allSurroundingNodes = [
      nodeMap[index - mapWidthInTiles - 1],
      nodeMap[index - mapWidthInTiles],
      nodeMap[index - mapWidthInTiles + 1],
      nodeMap[index - 1],
      nodeMap[index + 1],
      nodeMap[index + mapWidthInTiles - 1],
      nodeMap[index + mapWidthInTiles],
      nodeMap[index + mapWidthInTiles + 1]
    ];

    //Optionaly exlude the diagonal nodes, which is often perferable
    //for 2D maze games
    let crossSurroundingNodes = [
      nodeMap[index - mapWidthInTiles],
      nodeMap[index - 1],
      nodeMap[index + 1],
      nodeMap[index + mapWidthInTiles],
    ];

    //Find the valid sourrounding nodes, which are ones inside 
    //the map border that don't incldue obstacles. Change `allSurroundingNodes`
    //to `crossSurroundingNodes` to prevent the path from choosing diagonal routes
    let validSurroundingNodes = crossSurroundingNodes.filter(node => {

      //The node will be beyond the top and bottom edges of the
      //map if it is `undefined`
      let nodeIsWithinTopAndBottomBounds = node !== undefined;

      //Only return nodes that are within the top and bottom map bounds
      if (nodeIsWithinTopAndBottomBounds) {

        //Some Boolean values that tell us whether the current map index is on 
        //the left or right border of the map, and whether any of the nodes
        //surrounding that index extend beyond the left and right borders
        let indexIsOnLeftBorder = index % mapWidthInTiles === 0
        let indexIsOnRightBorder = (index + 1) % mapWidthInTiles === 0
        let nodeIsBeyondLeftBorder = node.column % (mapWidthInTiles - 1) === 0 && node.column !== 0;
        let nodeIsBeyondRightBorder = node.column % mapWidthInTiles === 0

        //Find out whether of not the node contains an obstacle by looping
        //through the obstacle gids and and returning `true` if it
        //finds any at this node's location
        let nodeContainsAnObstacle = obstacleGids.some(obstacle => {
          return mapArray[node.index] === obstacle;
        });

        //If the index is on the left border and any nodes surrounding it are beyond the
        //left border, don't return that node
        if (indexIsOnLeftBorder) {
          //console.log("left border")
          return !nodeIsBeyondLeftBorder;
        }

        //If the index is on the right border and any nodes surrounding it are beyond the
        //right border, don't return that node
        else if (indexIsOnRightBorder) {
          //console.log("right border")
          return !nodeIsBeyondRightBorder;
        }

        //Return `true` if the node doesn't contain any obstacles
        else if (nodeContainsAnObstacle) {
          return false;
        }

        //The index must be inside the area defined by the left and right borders,
        //so return the node
        else {
          //console.log("map interior")
          return true;
        }
      }
    });

    //console.log(validSurroundingNodes)
    //Return the array of `validSurroundingNodes`
    return validSurroundingNodes;
  };

  //Diagnostic
  //console.log(nodeMap);
  //console.log(centerNode);
  //console.log(destinationNode);
  //console.log(wallMapArray);
  //console.log(surroundingNodes(86, mapArray, mapWidthInTiles));

  //Heuristic methods
  //1. Manhattan
  let manhattan = (testNode, destinationNode) => {
    let h = Math.abs(testNode.row - destinationNode.row) * straightCost + Math.abs(testNode.column - destinationNode.column) * straightCost;
    return h;
  };

  //2. Euclidean
  let euclidean = (testNode, destinationNode) => {
    let vx = destinationNode.column - testNode.column,
      vy = destinationNode.row - testNode.row,
      h = Math.floor(Math.sqrt(vx * vx + vy * vy) * straightCost);
    return h;
  };

  //3. Diagonal
  let diagonal = (testNode, destinationNode) => {
    let vx = Math.abs(destinationNode.column - testNode.column),
      vy = Math.abs(destinationNode.row - testNode.row),
      h = 0;

    if (vx > vy) {
      h = Math.floor(diagonalCost * vy + straightCost * (vx - vy));
    } else {
      h = Math.floor(diagonalCost * vx + straightCost * (vy - vx));
    }
    return h;
  };

  //Loop through all the nodes until the current `centerNode` matches the
  //`destinationNode`. When they they're the same we know we've reached the
  //end of the path
  while (centerNode !== destinationNode) {

    //Find all the nodes surrounding the current `centerNode`
    let surroundingTestNodes = surroundingNodes(centerNode.index, mapArray, mapWidthInTiles);

    //Loop through all the `surroundingTestNodes` using a classic `for` loop 
    //(A `for` loop gives us a marginal performance boost) 
    for (let i = 0; i < surroundingTestNodes.length; i++) {

      //Get a reference to the current test node
      let testNode = surroundingTestNodes[i];

      //Find out whether the node is on a straight axis or 
      //a diagonal axis, and assign the appropriate cost

      //A. Declare the cost variable
      let cost = 0;

      //B. Do they occupy the same row or column?
      if (centerNode.row === testNode.row || centerNode.column === testNode.column) {

        //If they do, assign a cost of "10"
        cost = straightCost;
      } else {

        //Otherwise, assign a cost of "14"
        cost = diagonalCost;
      }

      //C. Calculate the costs (g, h and f) 
      //The node's current cost
      let g = centerNode.g + cost;

      //The cost of travelling from this node to the 
      //destination node (the heuristic)
      let h;
      switch (heuristic) {
        case "manhattan":
          h = manhattan(testNode, destinationNode);
          break;

        case "euclidean":
          h = euclidean(testNode, destinationNode);
          break;

        case "diagonal":
          h = diagonal(testNode, destinationNode);
          break;

        default:
          throw new Error("Oops! It looks like you misspelled the name of the heuristic");
      }

      //The final cost
      let f = g + h;

      //Find out if the testNode is in either 
      //the openList or closedList array
      let isOnOpenList = openList.some(node => testNode === node);
      let isOnClosedList = closedList.some(node => testNode === node);

      //If it's on either of these lists, we can check 
      //whether this route is a lower-cost alternative 
      //to the previous cost calculation. The new G cost 
      //will make the difference to the final F cost 
      if (isOnOpenList || isOnClosedList) {
        if (testNode.f > f) {
          testNode.f = f;
          testNode.g = g;
          testNode.h = h;

          //Only change the parent if the new cost is lower
          testNode.parent = centerNode;
        }
      }

      //Otherwise, add the testNode to the open list
      else {
        testNode.f = f;
        testNode.g = g;
        testNode.h = h;
        testNode.parent = centerNode;
        openList.push(testNode);
      }

      //The `for` loop ends here
    }

    //Push the current centerNode into the closed list
    closedList.push(centerNode);

    //Quit the loop if there's nothing on the open list.
    //This means that there is no path to the destination or the 
    //destination is invalid, like a wall tile 
    if (openList.length === 0) {

      return shortestPath;
    }

    //Sort the open list according to final cost
    openList = openList.sort((a, b) => a.f - b.f);

    //Set the node with the lowest final cost as the new centerNode
    centerNode = openList.shift();

    //The `while` loop ends here  
  }

  //Now that we have all the candidates, let's find the shortest path!
  if (openList.length !== 0) {

    //Start with the destination node
    let testNode = destinationNode;
    shortestPath.push(testNode);

    //Work backwards through the node parents 
    //until the start node is found 
    while (testNode !== startNode) {

      //Step through the parents of each node, 
      //starting with the destination node and ending with the start node
      testNode = testNode.parent;

      //Add the node to the beginning of the array
      shortestPath.unshift(testNode);

      //...and then loop again to the next node's parent till you
      //reach the end of the path
    }
  }

  //Return an array of nodes that link together to form
  //the shortest path
  return shortestPath;
}