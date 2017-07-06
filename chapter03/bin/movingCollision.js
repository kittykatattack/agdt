let thingsToLoad = ["images/timeBombPanic.png", "fonts/puzzler.otf", "maps/simpleCollision.json"];

//Create a new Hexi instance, and start it.
let g = hexi(512, 512, setup, thingsToLoad);

//Set the background color and scale the canvas
//g.backgroundColor = "black";
g.scaleToWindow();

console.log(g.getIndex);

//Start Hexi
g.start();

//Game variables
let world, alien, leftArrow, upArrow, rightArrow, downArrow, message, bombMapArray, bombSprites, bombLayer, alienMapArray;

//The `setup` function to initialize your application
function setup() {

  //Make the world from the Tiled JSON data and the tileset PNG image
  world = g.makeTiledWorld("maps/simpleCollision.json", "images/timeBombPanic.png");

  //Create the `alien` sprite
  alien = world.getObject("alien");

  //Get a reference to the alien layer's `data` array
  alienMapArray = world.getObject("alienLayer").data;

  //Get a reference to the bomb layer.
  //"bombLayer" is the name of the bomb layer in Tiled Editor
  bombLayer = world.getObject("bombLayer");

  //Get a reference to the level's bomb layer array. This is the
  //bomb layer's `data` array from the tiledMap JSON file
  bombMapArray = bombLayer.data;

  //Get a reference to all the bomb sprites in the world. "bomb" is
  //the `name` property of the bomb image in the tileset.
  //`world.getObjects` returns an array of all the sprites that have
  //that same `name`
  bombSprites = world.getObjects("bomb");

  //Use the `changeDirection` function to give each
  //bomb a random starting velocity
  //(The `changeDirection` function is at the bottom of this file)
  bombSprites.forEach(bomb => changeDirection(bomb));

  //Alternatively, you can clone the `bombLayer` container's
  //`children` array
  //bombSprites = bombLayer.children.slice();

  //Possible ES6 way of doing it:
  //bombSprites = Array.from(bomblayer.children);

  //Make a text object
  message = g.text("testing", "12px puzzler", "black");
  message.setPosition(10, 10);

  //Create the keyboard objects
  leftArrow = g.keyboard(37);
  upArrow = g.keyboard(38);
  rightArrow = g.keyboard(39);
  downArrow = g.keyboard(40);

  //Assign the key `press` actions
  alien.direction = "";
  leftArrow.press = () => alien.direction = "left";
  upArrow.press = () => alien.direction = "up";
  rightArrow.press = () => alien.direction = "right";
  downArrow.press = () => alien.direction = "down";

  //Change the game state to `play`
  g.state = play;
}

//The `play` function contains all the game logic and runs in a loop
function play() {

  //Move the alien and keep it contained within the canvas
  //Change the alien's direction only if it's at an interesection
  if (Math.floor(alien.x) % world.tilewidth === 0 && Math.floor(alien.y) % world.tileheight === 0) {
    switch (alien.direction) {
      case "up":
        alien.vy = -4;
        alien.vx = 0;
        break;
      case "down":
        alien.vy = 4;
        alien.vx = 0;
        break;
      case "left":
        alien.vx = -4;
        alien.vy = 0;
        break;
      case "right":
        alien.vx = 4;
        alien.vy = 0;
        break;
    }
  }

  //Move the alien
  alien.x += alien.vx;
  alien.y += alien.vy;

  //Keep the alien contained inside the canvas
  g.contain(alien, g.stage);

  //Update the `alienMapArray` to reflect any changes in the alien's
  //position
  alienMapArray = g.updateMap(alienMapArray, alien, world);

  bombSprites.forEach(bomb => {

    //`atXEdge` and `atYEdge` will return `true` or `false` depending on whether or
    //not the sprite is at the edges of the canvas
    let atXEdge = (sprite, container) => {
      return sprite.x === 0 || sprite.x + sprite.width === container.width;
    };
    let atYEdge = (sprite, container) => {
      return sprite.y === 0 || sprite.y + sprite.width === container.height;
    };

    //Change the bomb's direction if it's at a map grid column or row
    if (Math.floor(bomb.x) % world.tilewidth === 0 && Math.floor(bomb.y) % world.tileheight === 0) {

      //If the bomb is at the edge of the canvas,
      //reverse its velocity to keep it inside
      if (atXEdge(bomb, g.canvas)) {
        bomb.vx = -bomb.vx;
      } else if (atYEdge(bomb, g.canvas)) {
        bomb.vy = -bomb.vy;
      }

      //If the bomb is inside the canvas, give it a new random direction
      else {
          changeDirection(bomb);
        }
    }

    //Move the bomb
    bomb.x += bomb.vx;
    bomb.y += bomb.vy;
  });

  //Update the `bombMapArray` to reflect any changes in the bomb
  //positions
  bombMapArray = g.updateMap(bombMapArray, bombSprites, world);

  //Compare each element in the `bombMapArray` with each element
  //in the `alienMapArray`. If there's a bomb gid and an lien gid at the
  //same index number, then you know there's a collision
  bombMapArray.forEach((gid, index) => {

    //Does the alien have the same index number as a bomb?
    if (alienMapArray[index] === 4 && gid === 5) {

      //Yes, so filter out any bomb sprites at this location
      //(there might be more than one)
      bombSprites = bombSprites.filter(bomb => {
        if (bomb.index === index) {

          //Remove the bomb gid number from the array
          bombMapArray[bomb.index] = 0;

          //Remove the bomb from the `bombLayer` group
          g.remove(bomb);
          return false;
        } else {
          return true;
        }
      });

      //Confirm the new arrays
      /*
      console.log("bombMapArray");
      console.log(bombMapArray);
      console.log("alienMapArray");
      console.log(alienMapArray);
      console.log("***");
      */
    }
  });

  //Display the alien's x, y and index values
  message.content = `centerX: ${ alien.centerX } centerY: ${ alien.centerY } index: ${ alien.index }`;;
}

//Change direction helper function
function changeDirection(sprite) {
  let up = 1,
      down = 2,
      left = 3,
      right = 4,
      direction = g.randomInt(1, 4);

  switch (direction) {
    case right:
      sprite.vx = 2;
      sprite.vy = 0;
      break;

    case left:
      sprite.vx = -2;
      sprite.vy = 0;
      break;

    case up:
      sprite.vx = 0;
      sprite.vy = -2;
      break;

    case down:
      sprite.vx = 0;
      sprite.vy = 2;
      break;
  }
}
//# sourceMappingURL=movingCollision.js.map