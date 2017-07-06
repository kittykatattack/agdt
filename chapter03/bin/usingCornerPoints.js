let thingsToLoad = ["images/timeBombPanic.png", "fonts/puzzler.otf", "maps/simpleCollision.json"];

//Create a new Hexi instance, and start it.
let g = hexi(512, 512, setup, thingsToLoad);

//Set the background color and scale the canvas
//g.backgroundColor = "black";
g.scaleToWindow();

//Start Hexi
g.start();

//Game variables
let world, alien, leftArrow, upArrow, rightArrow, downArrow, message, bombMapArray, bombSprites, bombLayer;

//The `setup` function to initialize your application
function setup() {

  //Make the world from the Tiled JSON data and the tileset PNG image
  world = g.makeTiledWorld("maps/simpleCollision.json", "images/timeBombPanic.png");

  //Create the `alien` sprite
  alien = world.getObject("alien");

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
  //(The `contain` method is in library/collision)
  g.contain(alien, g.stage);

  let alienVsBomb = g.hitTestTile(alien, bombMapArray, 5, world, "every");

  //if (alienVsBomb.hit) console.log("hit!");

  //Find out if the alien's position in the bomb array matches a bomb gid number
  if (alienVsBomb.hit) {

    //If it does, filter through the bomb sprites and find the one
    //that matches the alien's position
    bombSprites = bombSprites.filter(bomb => {

      //Does the bomb sprite have the same index number as the alien?
      if (bomb.index === alienVsBomb.index) {

        //If it does, remove the bomb from the
        //`bombMapArray` by setting its gid to `0`
        bombMapArray[bomb.index] = 0;

        //Remove the bomb sprite from its container group
        g.remove(bomb);

        //Alternatively, remove the bomb with `removeChild` on
        //the `bombLayer` group
        //bombLayer.removeChild(bomb);
        //Confirm the array data
        console.log(bombMapArray);

        //Filter the bomb out of the `bombSprites` array
        return false;
      } else {

        //Keep the bomb in the `bombSprites` array if it doesn't match
        return true;
      }
    });
  }

  //Display the alien's x, y and index values
  message.content = `centerX: ${ alien.centerX } centerY: ${ alien.centerY } index: ${ alien.index }`;;
}
//# sourceMappingURL=usingCornerPoints.js.map