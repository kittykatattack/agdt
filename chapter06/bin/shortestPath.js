let thingsToLoad = ["images/timeBombPanic.png", "maps/AStar.json"];

//Create a new Hexi instance, and start it.
let g = hexi(832, 768, setup, thingsToLoad);

//Set the background color and scale the canvas
//g.backgroundColor = "black";
g.scaleToWindow();

//Start Hexi
g.start();

//Game variables
let alien, bomb, currentPath;

//The `setup` function to initialize your application
function setup() {

  //Make the world from the Tiled JSON data and the tileset PNG image
  world = g.makeTiledWorld("maps/AStar.json", "images/timeBombPanic.png");

  //Create the alien sprite
  alien = world.getObject("alien");

  //Create the bomb sprite
  //bomb = world.getObject("bomb");

  //Get a reference to the array that stores all the wall data
  wallMapArray = world.getObject("wallLayer").data;

  //An array to store the sprites that will be used to display
  //the shortest path
  currentPathSprites = [];

  //The mouse pointer's `release` function runs the code that
  //calculates the shortest path and draws that sprites that
  //represent it
  g.pointer.release = () => {

    //calculate the shortest path
    let path = shortestPath(getIndex(alien.x, alien.y, 64, 64, 13), //The start map index
    getIndex(g.pointer.x, g.pointer.y, 64, 64, 13), //The destination index
    wallMapArray, //The map array
    13, //Map width, in tiles
    [2, 3], //Obstacle gid array
    "manhattan" //Heuristic to use
    );

    //Use Hexi's `remove` method to remove any possible
    //sprites in the `currentPathSprites` array
    g.remove(currentPathSprites);

    //Display the shortest path
    path.forEach(node => {

      //Figure out the x and y location of each square in the path by
      //multiplying the node's `column` and `row` by the height, in
      //pixels, of each square: 64
      let x = node.column * 64,
          y = node.row * 64;

      //Create the square sprite and set it to the x and y location
      //we calculated above
      let square = g.rectangle(64, 64, "black");
      square.x = x;
      square.y = y;

      //Push the sprites into the `currentPath` array,
      //so that we can easily remove them the next time
      //the mouse is clicked
      currentPathSprites.push(square);
    });
  };
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
  return index.x + index.y * mapWidthInTiles;
}

//The `shortestPath` function
function shortestPath(startIndex, destinationIndex, mapArray, mapWidthInTiles, obstacleGids = [], heuristic = "manhattan") {

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
  openList.push(centerNode);

  //Get the current destination node. The first one will
  //match the path's end position
  let destinationNode = nodeMap[destinationIndex];

  //All the nodes that are surrounding the current map index number
  let surroundingNodes = (index, mapArray, mapWidthInTiles) => {

    //Find out what all the surrounding nodes are, including those that
    //might be beyond the borders of the map
    let allSurroundingNodes = [nodeMap[index - mapWidthInTiles - 1], nodeMap[index - mapWidthInTiles], nodeMap[index - mapWidthInTiles + 1], nodeMap[index - 1], nodeMap[index + 1], nodeMap[index + mapWidthInTiles - 1], nodeMap[index + mapWidthInTiles], nodeMap[index + mapWidthInTiles + 1]];

    //Optionaly exlude the diagonal nodes, which is often perferable
    //for 2D maze games
    let crossSurroundingNodes = [nodeMap[index - mapWidthInTiles], nodeMap[index - 1], nodeMap[index + 1], nodeMap[index + mapWidthInTiles]];

    //Find the valid sourrounding nodes, which are ones inside
    //the map border that don't incldue obstacles. Change `allSurroundingNodes`
    //to `crossSurroundingNodes` to prevent the path from choosing diagonal routes
    let validSurroundingNodes = allSurroundingNodes.filter(node => {

      //The node will be beyond the top and bottom edges of the
      //map if it is `undefined`
      let nodeIsWithinTopAndBottomBounds = node !== undefined;

      //Only return nodes that are within the top and bottom map bounds
      if (nodeIsWithinTopAndBottomBounds) {

        //Some Boolean values that tell us whether the current map index is on
        //the left or right border of the map, and whether any of the nodes
        //surrounding that index extend beyond the left and right borders
        let indexIsOnLeftBorder = index % mapWidthInTiles === 0;
        let indexIsOnRightBorder = (index + 1) % mapWidthInTiles === 0;
        let nodeIsBeyondLeftBorder = node.column % (mapWidthInTiles - 1) === 0 && node.column !== 0;
        let nodeIsBeyondRightBorder = node.column % mapWidthInTiles === 0;

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

function displayShortestPath(shortestPath) {
  //console.log(shortestPath)
  shortestPath.forEach(node => {

    let x = node.column * 64,
        y = node.row * 64;

    let square = g.rectangle(64, 64, "black");
    square.x = x;
    square.y = y;
  });
}

//Helper functions

//`isCenteredOverCell` returns true or false depending on whether a
//sprite is exactly aligned to anintersection in the maze corridors
function isCenteredOverCell(sprite) {
  return Math.floor(sprite.x) % world.tilewidth === 0 && Math.floor(sprite.y) % world.tileheight === 0;
}

//Convert the direction string to an object with `vx` and `vy`
//velocity properties
function directionToVelocity(direction = "", speed = 0) {
  switch (direction) {
    case "up":
      return {
        vy: -speed,
        vx: 0
      };
      break;
    case "down":
      return {
        vy: speed,
        vx: 0
      };
      break;
    case "left":
      return {
        vx: -speed,
        vy: 0
      };
      break;
    case "right":
      return {
        vx: speed,
        vy: 0
      };
      break;
    default:
      return {
        vx: 0,
        vy: 0
      };
  }
};

//Change the sprite's velocity if it's centered
//over a tile grid cell
function changeDirection(sprite, direction, speed) {
  switch (direction) {
    case "up":
      sprite.vy = -speed;
      sprite.vx = 0;
      break;
    case "down":
      sprite.vy = speed;
      sprite.vx = 0;
      break;
    case "left":
      sprite.vx = -speed;
      sprite.vy = 0;
      break;
    case "right":
      sprite.vx = speed;
      sprite.vy = 0;
      break;
    default:
      sprite.vx = 0;
      sprite.vy = 0;
      break;
  }
};

function surroundingCrossCells(index, widthInTiles) {
  return [index - widthInTiles, index - 1, index + 1, index + widthInTiles];
}

function surroundingDiagonalCells(index, widthInTiles) {
  return [index - widthInTiles - 1, index - widthInTiles + 1, index + widthInTiles - 1, index + widthInTiles + 1];
}

function validDirections(sprite, mapArray, validGid, world) {

  //Get the sprite's current map index position number
  let index = g.getIndex(sprite.x, sprite.y, world.tilewidth, world.tileheight, world.widthInTiles);

  //An array containing the index numbers of tile cells
  //above, below and to the left and right of the sprite
  let surroundingCrossCells = (index, widthInTiles) => {
    return [index - widthInTiles, index - 1, index + 1, index + widthInTiles];
  };

  //Get the index position numbers of the 4 cells to the top, right, left
  //and bottom of the sprite
  let surroundingIndexNumbers = surroundingCrossCells(index, world.widthInTiles);

  //Find all the tile gid numbers that match the surrounding index numbers
  let surroundingTileGids = surroundingIndexNumbers.map(index => mapArray[index]);

  //`directionList` is an array of 4 string values that can be either
  //"up", "left", "right", "down" or "none", depending on
  //whether there is a cell with a valid gid that matches that direction.
  let directionList = surroundingTileGids.map((gid, i) => {

    //The possible directions
    let possibleDirections = ["up", "left", "right", "down"];

    //If the direction is valid, choose the matching string
    //identifier for that direction. Otherwise, return "none"
    if (gid === validGid) {
      return possibleDirections[i];
    } else {
      return "none";
    }
  });

  //We don't need "none" in the list of directions
  //(it's just a placeholder), so let's filter it out
  let filteredDirectionList = directionList.filter(direction => direction != "none");

  //Return the filtered list of valid directions
  return filteredDirectionList;
}

function canChangeDirection(validDirections = []) {

  //Is the sprite in a dead-end (cul de sac.) This will be true if there's only
  //one element in the `validDirections` array
  let inCulDeSac = validDirections.length === 1;

  //Is the sprite trapped? This will be true if there are no elements in
  //the `validDirections` array
  let trapped = validDirections.length === 0;

  //Is the sprite in a passage? This will be `true` if the the sprite
  //is at a location that contain the values
  //“left” or “right” and “up” or “down”
  let up = validDirections.find(x => x === "up"),
      down = validDirections.find(x => x === "down"),
      left = validDirections.find(x => x === "left"),
      right = validDirections.find(x => x === "right"),
      atIntersection = (up || down) && (left || right);

  //Return `true` if the sprite can change direction or
  //`false` if it can't
  return trapped || atIntersection || inCulDeSac;
}

function randomDirection(sprite, validDirections = []) {

  //The `randomInt` helper function returns a random integer between a minimum
  //and maximum value
  let randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  //Is the sprite trapped?
  let trapped = validDirections.length === 0;

  //If the sprite isn't trapped, randomly choose one of the valid
  //directions. Otherwise, return the string "trapped"
  if (!trapped) {
    return validDirections[randomInt(0, validDirections.length - 1)];
  } else {
    return "trapped";
  }
}
/*
function randomDirection(sprite, currentDirection = "none", validDirections = []) {

  //Some values that help find out what the sprite's situation in the maze is
  //Is the sprite in an up/down passage?
  //let inUpOrDownPassage = validDirections.indexOf("up") !== -1 || validDirections.indexOf("down") !== -1;
  let inUpOrDownPassage = validDirections.indexOf("up") !== -1 || validDirections.indexOf("down") !== -1;

  //Is the sprite in a left/right passage?
  let inLeftOrRightPassage = validDirections.indexOf("left") !== -1 || validDirections.indexOf("right") !== -1;

  //Is the sprite in a dead-end (cul de sac.) This will be true if there's only
  //one element in the `validDirections` array
  let inCulDeSac = validDirections.length === 1;

  //Is the sprite trapped? This will be true if there are no elements in
  //the `validDirections` array
  let trapped = validDirections.length === 0;

  //The `randomInt` helper function returns a random integer between a minimum
  //and maximum value
  let randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  //Randomly select one of the valid directions
  let randomDirection = () => {
    if (!trapped) {
      return validDirections[randomInt(0, validDirections.length - 1)];
    } else {
      return "none"
    }
  };

  //If the sprite isn't trapped and it's in a passage intersection or
  //cul-de-sac, assign the newRandomDirecton to the sprite's
  //`direction` property. Otherwise, keep the sprite's directon the 
  //same as it was before
  if (!trapped) {
    if (inLeftOrRightPassage && inUpOrDownPassage || inCulDeSac) {
      return randomDirection();
    } else {
      return currentDirection;
    }
  } else {
    return currentDirection;
  }
}
*/
//# sourceMappingURL=shortestPath.js.map