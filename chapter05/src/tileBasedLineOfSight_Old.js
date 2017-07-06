let thingsToLoad = [
  "images/monsterMaze.png",
  "maps/monsterMaze.json"
];

//Create a new Hexi instance, and start it.
let g = hexi(704, 512, setup, thingsToLoad);

//Set the background color and scale the canvas
//g.backgroundColor = "black";
g.scaleToWindow();

//Start Hexi
g.start();

//Game variables
let world, alien, message, wallMapArray,
  bombMapArray, bombSprites, bombLayer,
  leftArrow, upArrow, downArrow, rightArrow;

//The `setup` function to initialize your application
function setup() {

  //Make the world from the Tiled JSON data and the tileset PNG image
  world = g.makeTiledWorld(
    "maps/monsterMaze.json",
    "images/monsterMaze.png"
  );

  //Create the alien sprite and set its speed
  alien = world.getObject("alien");
  alien.speed = 4

  //Get a reference to the array that stores all the wall data
  wallMapArray = world.getObject("wallLayer").data;

  //We're just using the monsters sprites in the Tiled Editor
  //map as generic placeholders.  We're going to use their size and
  //position data to build new monster sprites from scratch and place
  //them in the world. That's because we want to give the monsters
  //custom animation frames. Here's how to do this:

  //1. Get a reference to the map's monster sprites and the 
  //layer container that those sprites are one
  let mapMonsters = world.getObjects("monster");
  let monsterLayer = world.getObject("monsterLayer");

  //2.Define the monster's animation frames. In this example there are just
  //two: the monster mouth open, and the monster's mouth closed.
  monsterFrames = g.frames(
    "images/monsterMaze.png", //The tileset image
    [
      [128, 0],
      [128, 64]
    ], //The `x` and `y` positions of frames
    64, 64 //The `width` and `height` of each frame
  );

  //3.Create a new array called `monsters` that contains a new `monster`
  //sprite for each `mapMonster` in the original array. The new
  //`monster` sprites are created using the `monsterFrames` we defined
  //above and have the same `x` and `y` positions as the original
  //placeholder monsters from the Tiled Editor map. We're also going
  //to give them new `direction` and `speed`. Finally, we need to make the 
  //placeholder monsters invisible and add the new `monster` sprite
  //to the `monsterLayer` container. 
  monsters = mapMonsters.map(mapMonster => {
    let monster = g.sprite(monsterFrames);
    monster.x = mapMonster.x;
    monster.y = mapMonster.y;
    monster.direction = "none";
    monster.speed = 4;
    monsterLayer.addChild(monster);
    mapMonster.visible = false;

    //Define the monster's two states: `normal` and `scared`
    //`0` and `1` refer to the monster's two animation frames
    monster.states = {
      normal: 0,
      scared: 1
    };
    return monster;
  });

  //Give the `alien` a `direction` property and initilize it to "none"
  alien.direction = "none";

  //Configure Hexi's built in arrow keys to assign the alien a direction
  //Create some keyboard objects
  leftArrow = g.keyboard(37);
  upArrow = g.keyboard(38);
  rightArrow = g.keyboard(39);
  downArrow = g.keyboard(40);

  //Program the keyboard objects
  leftArrow.press = () => alien.direction = "left";
  upArrow.press = () => alien.direction = "up";
  rightArrow.press = () => alien.direction = "right";
  downArrow.press = () => alien.direction = "down";

  //Change the game state to `play`
  g.state = play;
}

//The `play` function contains all the game logic and runs in a loop
function play() {

  //Change the alien's direction if it's directly centered
  //over a tile cell

  if (isCenteredOverCell(alien)) {
    let velocity = directionToVelocity(alien.direction, alien.speed);
    alien.vx = velocity.vx;
    alien.vy = velocity.vy;
  }

  //Move the alien
  g.move(alien);

  //Check for a collision between the alien and the floor
  let alienVsFloor = g.hitTestTile(alien, wallMapArray, 0, world, "every");

  //If every corner point on the alien isn't touching a floor 
  //tile (array gridIDNumber: 0) then prevent the alien from moving
  if (!alienVsFloor.hit) {

    //To prevent the alien from moving, subtract its velocity from its position
    alien.x -= alien.vx;
    alien.y -= alien.vy;
    alien.vx = 0;
    alien.vy = 0;
  }

  monsters.forEach(monster => {

    //Is the monster directly centered over a map tile cell?
    if (isCenteredOverCell(monster)) {

      //Yes, it is, so give it a new random direction
      monster.direction = findDirection(
        monster, monster.direction, alien, wallMapArray, world
      );

      //Use the monster's direction and speed to find its 
      //new velocity
      let velocity = directionToVelocity(monster.direction, monster.speed);
      monster.vx = velocity.vx;
      monster.vy = velocity.vy;
    }

    //Move the monster
    g.move(monster);

    //Change the monster's state

    //1. Plot a vector between the monster and the alien
    let vx = alien.centerX - monster.centerX,
      vy = alien.centerY - monster.centerY;

    //3. If the monster can see the alien,
    //change the monster's state to `scared`. Otherwise, set its
    //state to `normal`
    monster.lineOfSight = tileBasedLineOfSight(
      monster,
      alien,
      wallMapArray,
      world,
      0, [90, -90, 0, 180, -180]
    );

    if (monster.lineOfSight) {
      monster.show(monster.states.scared)
    } else {
      monster.show(monster.states.normal)
    }
  });
}

//Helper functions

//`isAtIntersection` returns true or false depending on whether a 
//sprite is exactly aligned to anintersection in the maze corridors
function isCenteredOverCell(sprite) {
  let trueOrFalse =
    Math.floor(sprite.x) % world.tilewidth === 0 && Math.floor(sprite.y) % world.tileheight === 0
  return trueOrFalse;
}

function directionToVelocity(direction = "none", speed = 0) {

  //Change the sprite's velocity if it's centered 
  //over a tile grid cell 
  switch (direction) {
    case "up":
      return {
        vy: -speed,
        vx: 0
      }
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
    case "none":
      return {
        vx: 0,
        vy: 0
      };
  }
};

function changeDirection(sprite, direction, speed) {

  //Change the sprite's velocity if it's centered 
  //over a tile grid cell 
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
    case "none":
      sprite.vx = 0;
      sprite.vy = 0;
      break;
  }
};

function surroundingCrossCells(index, widthInTiles) {
  return [
    index - widthInTiles,
    index - 1,
    index + 1,
    index + widthInTiles,
  ];
}

function surroundingDiagonalCells(index, widthInTiles) {
  return [
    index - widthInTiles - 1,
    index - widthInTiles + 1,
    index + widthInTiles - 1,
    index + widthInTiles + 1,
  ];
}

function findValidDirections(sprite, mapArray, validGid, world) {

  //Get the sprite's current map index position number
  let index = g.getIndex(
    sprite.x,
    sprite.y,
    world.tilewidth,
    world.tileheight,
    world.widthInTiles
  );

  //Get the index position numbers of the 4 cells to the top, right, left
  //and bottom of the sprite
  let surroundingIndexNumbers = surroundingCrossCells(index, world.widthInTiles);

  //Find all the tiles that match the surrounding index numbers
  let surroundingTiles = surroundingIndexNumbers.map(indexNumber => {
    return g.getTile(indexNumber, mapArray, world);
  });

  //Floor tiles have a gid value of 0, and are a valid tiles for the sprite
  //to travel on. 0 is the `validGid` value in this example. 
  //`validTiles` is an array of true/false values where each
  //valid direction tile (a floor tile) will be represented as `true`
  let validTiles = surroundingTiles.map(tile => {
    return tile.gid === validGid;
  });

  //`directionList` is an array of 4 string values that can be either
  //"up", "left", "right", "down" or "none", depending on 
  //whether there is a `validTile` that matches that direction.
  let directionList = validTiles.map((validTile, i) => {

    //The possible directions
    let possibleDirections = ["up", "left", "right", "down"];

    //If the direction is valid, choose the matching string 
    //identifier for that direction. Otherwise, return "none"
    if (validTile) {
      return possibleDirections[i];
    } else {
      return "none";
    }
  });

  //We don't need "none" in the list of directions, so 
  //let's filter it out
  let filteredDirectionList = directionList.filter(direction => direction != "none");

  //Return the filtered list of valid directions
  return filteredDirectionList;
}

function tileBasedLineOfSight(
  spriteOne, //The first sprite, with `centerX` and `centerY` properties
  spriteTwo, //The second sprite, with `centerX` and `centerY` properties
  mapArray, //The tile map array
  world, //The `world` object that contains the `tilewidth
  //`tileheight` and `widthInTiles` properties
  emptyGid = 0, //The Gid that represents and empty tile, usually `0`
  angles = [] //An array of angles to which you want to 
  //restrict the line of sight
) {

  //Plot a vector between spriteTwo and spriteOne
  let vx = spriteTwo.centerX - spriteOne.centerX,
    vy = spriteTwo.centerY - spriteOne.centerY;

  //Find the vector's magnitude (its length in pixels)
  let magnitude = Math.sqrt(vx * vx + vy * vy);

  let angle = Math.atan2(vy, vx) * 180 / Math.PI;

  //Find the unit vector. This is a small, scaled down version of
  //the vector between the sprites that's less than one pixel long.
  //It points in the same direction as the main vector, but because it's
  //the smallest size that the vector can be, we can use it to create
  //new vectors or varying length
  let dx = vx / magnitude,
    dy = vy / magnitude;

  //We need to test points along the vector between the two sprites.
  //To do that, we need to find out how much space should be between
  //each of those points. In this example, the space between points will
  //be the same as the width of a tile cell (64 pixels)
  let segment = world.tilewidth;

  //How many points will we need to test?
  let numberOfPoints = magnitude / segment;

  //Create an array of x/y points, separated by 64 pixels, that
  //extends from `spriteOne` to `spriteTwo`  
  let points = () => {

    //Initialize an array that is going to store all our points
    //along the vector
    let arrayOfPoints = [];

    //Create a point object for each segment of the vector and 
    //store its x/y position as well as its index number on
    //the map array 
    for (let i = 1; i <= numberOfPoints; i++) {
      let newMagnitude = segment * i;
      let x = spriteOne.centerX + dx * newMagnitude;
      let y = spriteOne.centerY + dy * newMagnitude;
      let index = g.getIndex(
        x, y,
        world.tilewidth,
        world.tileheight,
        world.widthInTiles
      );
      let point = {
        x: x,
        y: y,
        index: index
      };
      arrayOfPoints.push(point);
    }
    return arrayOfPoints;
  };

  //The `noObstacles` function will return `true` if all the tile
  //index numbers along the vector are `0`, which means they contain 
  //no walls. If any of them aren't 0, then the function returns
  //`false` which means there's a wall in the way 
  let noObstacles = points().every(point => mapArray[point.index] === emptyGid);

  //Restrict the line of sight to right angles only (we don't want to
  //need diagonals)

  let validAngle = () => {
    if (angles.length !== 0) {
      return angles.some(x => x === angle);
    } else {
      return true;
    }
  };

  if (noObstacles === true && validAngle() === true) {
    return true;
  } else {
    return false;
  }

  //points().forEach(point => console.log(mapArray[point.index]));

  //To check for line of sight in a non-tile based game world,
  //you could alternatively do a standard "point vs. rectangle" collision
  //check using x/y coordinates. Just test each x/y point in the
  //`points` array for a collision with a wall sprite. If you don't
  //find a collision, then you know you have line of sight. 
}

function findDirection(spriteOne, spriteOneDirection, spriteTwo, mapArray, world) {

  //Get the sprite's list of valid directions and the values it needs
  //to understand the kind of map environment that it's in
  let validDirections = findValidDirections(spriteOne, mapArray, 0, world);
  let inUpOrDownPassage = validDirections.indexOf("up") !== -1 || validDirections.indexOf("down") !== -1;
  let inLeftOrRightPassage = validDirections.indexOf("left") !== -1 || validDirections.indexOf("right") !== -1;
  let inCulDeSac = validDirections.length === 1;
  let trapped = validDirections.length === 0;

  let hasLineOfSight = tileBasedLineOfSight(
    spriteOne, //The first sprite
    spriteTwo, //The second sprite
    mapArray, //The tile map array
    world, //The `world` object
    0, //The Gid that represents and empty tile
    [90, -90, 0, 180, -180] //The angles to limit the line-of-sight
  );

  //Randomly select one of the valid directions
  let randomDirection = () => {
    if (!trapped) {
      return validDirections[g.randomInt(0, validDirections.length - 1)];
    } else {
      return "none"
    }
  };

  //Find the closest direction
  let closestDirection = () => {

    //Plot a vector between spriteTwo and spriteOne
    let vx = spriteTwo.centerX - spriteOne.centerX,
      vy = spriteTwo.centerY - spriteOne.centerY;

    //If the distance is greater on the X axis...
    if (Math.abs(vx) >= Math.abs(vy)) {

      //Try left and right
      if (vx <= 0) {
        return "left";
      } else {
        return "right";
      }
    }
    //If the distance is greater on the Y axis...
    else {
      //Try up and down
      if (vy <= 0) {
        return "up"
      } else {
        return "down"
      }
    }
  };

  //Return `true` if the closest direction is also a valid direction
  let closestDirectionIsValid = validDirections.indexOf(closestDirection()) !== -1;

  //Check to make sure the sprite is at a location on the map where
  //it can change its direction.
  //Return the `closestDirection` if it's also a valid direction,
  //otherwise choose a new random direction.
  //If the sprite is not at a location where it can change its direction,
  //just return the same direction that it had before
  if (!trapped) {
    if (inLeftOrRightPassage && inUpOrDownPassage || inCulDeSac) {
      if (closestDirectionIsValid && hasLineOfSight) {
        return closestDirection();
      } else {
        return randomDirection();
      }
    } else {
      return spriteOneDirection;
    }
  } else {
    return spriteOneDirection;
  }
}