//The images we want to load
let thingsToLoad = ["images/isoTileset.png"];

//Create a new Hexi instance, and start it.
let g = hexi(512, 512, setup, thingsToLoad);

//Scale the canvas to the maximum browser dimensions
g.scaleToWindow();

//Declare variables used in more than one function
let world, leftArrow, upArrow,
  rightArrow, downArrow, message,
  player, groundLayer, wallMapArray;

//Start Hexi
g.start();

function setup() {

  //Create the `world` container that defines our isometric 
  //tile-based world
  world = g.group();

  //Set the `tileWidth` and `tileHeight` of each tile, in pixels
  world.cartTilewidth = 32;
  world.cartTileheight = 32;

  //Define the width and height of the world, in tiles
  world.widthInTiles = 8;
  world.heightInTiles = 8;

  //Create the world layers
  world.layers = [

    //The floor layer
    [
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1,
      1, 1, 1, 1, 1, 1, 1, 1
    ],

    //The wall layer
    [
      2, 2, 2, 2, 2, 2, 2, 2,
      2, 0, 0, 0, 0, 0, 0, 2,
      2, 0, 2, 0, 0, 2, 0, 2,
      2, 0, 0, 0, 0, 2, 2, 2,
      2, 0, 0, 0, 0, 0, 0, 2,
      2, 2, 2, 0, 2, 0, 0, 2,
      2, 0, 0, 0, 0, 0, 0, 2,
      2, 2, 2, 2, 2, 2, 2, 2
    ],

    //The player layer
    [
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 3, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0
    ]
  ];

  //The `z` index
  let z = 0;

  //Build the game world by looping through each of the arrays
  world.layers.forEach(layer => {

    //Loop through each array element
    layer.forEach((gid, index) => {

      //If the cell isn't empty (0) then create a sprite
      if (gid !== 0) {

        //Find the column and row that the sprite is on and also
        //its x and y pixel values.
        let column, row, x, y;
        column = index % world.widthInTiles;
        row = Math.floor(index / world.widthInTiles);
        x = column * world.cartTilewidth;
        y = row * world.cartTileheight;

        //Next, create a different sprite based on what its 
        //`gid` number is
        let sprite;
        switch (gid) {

          //The floor
          case 1:
            sprite = g.sprite(g.frame("images/isoTileset.png", 128, 0, 64, 64));
            break;

            //The walls
          case 2:
            sprite = g.sprite(g.frame("images/isoTileset.png", 0, 0, 64, 64));
            break;

            //The player
          case 3:
            sprite = g.sprite(g.frame("images/isoTileset.png", 64, 0, 64, 64));
            player = sprite;
            break;
        }


        //Add these properties to the sprite
        addIsoProperties(sprite, x, y, world.cartTilewidth, world.cartTileheight);

        //Set the sprite's `x` and `y` pixel position based on its
        //isometric coordinates
        sprite.x = sprite.isoX;
        sprite.y = sprite.isoY;

        //Add the new `z` depth property to the sprite
        sprite.z = z;

        //Cartesian positioning
        //sprite.x = sprite.cartX;
        //sprite.y = sprite.cartY;

        //Add the sprite to the `world` container
        world.addChild(sprite);
      }
    });

    //Add `1` to `z` for each new layer  
    z += 1;
  });

  //Move the player into the environment's depth layer
  player.z = 1;

  //Sort the world by depth
  world.children.sort(byDepth);

  //Position the world inside the canvas
  let canvasOffset = (g.canvas.width / 2) - world.cartTilewidth;
  world.x += canvasOffset;
  world.y = 0;

  //Make a text object
  message = g.text("", "16px Futura", "black");
  message.setPosition(5, 0);

  //Add isometric properties to the pointer
  makeIsoPointer(g.pointer, world);

  //Create the keyboard objects
  leftArrow = g.keyboard(37);
  upArrow = g.keyboard(38);
  rightArrow = g.keyboard(39);
  downArrow = g.keyboard(40);

  //Assign the key `press` actions
  player.direction = "none";
  leftArrow.press = () => player.direction = "left";
  upArrow.press = () => player.direction = "up";
  rightArrow.press = () => player.direction = "right";
  downArrow.press = () => player.direction = "down";
  leftArrow.release = () => player.direction = "none";
  upArrow.release = () => player.direction = "none";
  rightArrow.release = () => player.direction = "none";
  downArrow.release = () => player.direction = "none";

  //Set the game state to `play`
  g.state = play;
}

function play() {

  //Change the player character's velocity if it's centered over a grid cell
  if (Math.floor(player.cartX) % world.cartTilewidth === 0 && Math.floor(player.cartY) % world.cartTileheight === 0) {
    switch (player.direction) {
      case "up":
        player.vy = -2;
        player.vx = 0;
        break;
      case "down":
        player.vy = 2;
        player.vx = 0;
        break;
      case "left":
        player.vx = -2;
        player.vy = 0;
        break;
      case "right":
        player.vx = 2;
        player.vy = 0;
        break;
      case "none":
        player.vx = 0;
        player.vy = 0;
        break;
    }
  }

  //Update the player's Cartesian position 
  //based on its velocity
  player.cartY += player.vy;
  player.cartX += player.vx;

  //Wall collision
  //Get a reference to the wall map array
  wallMapArray = world.layers[1];

  //Use `hiteTestIsoTile` to check for a collision
  let playerVsGround = hitTestIsoTile(player, wallMapArray, 0, world, "every");

  //If there's a collision, prevent the player from moving.
  //Subtract its velocity from its position and then set its velocity to zero
  if (!playerVsGround.hit) {
    player.cartX -= player.vx;
    player.cartY -= player.vy;
    player.vx = 0;
    player.vy = 0;
  }

  //Add world boundaries
  let top = 0,
    bottom = (world.heightInTiles * world.cartTileheight),
    left = 0,
    right = (world.widthInTiles * world.cartTilewidth);

  //Prevent the player from crossing any of the world boundaries
  //Top
  if (player.cartY < 0) {
    player.cartY = top;
  }

  //Bottom
  if (player.cartY + player.cartHeight > bottom) {
    player.cartY = bottom - player.cartHeight;
  }

  //Left
  if (player.cartX < left) {
    player.cartX = left;
  }

  //Right
  if (player.cartX + player.cartWidth > right) {
    player.cartX = right - player.cartWidth;
  }

  //Position the sprite's sceen `x` and `y` position
  //using its isometric coordinates
  player.x = player.isoX;
  player.y = player.isoY;

  //Get the player's index position in the map array
  player.index = g.getIndex(
    player.cartX, player.cartY,
    world.cartTilewidth, world.cartTileheight, world.widthInTiles
  );

  //Depth sort the sprites if the player is moving
  if (player.vx !== 0 || player.vy !== 0) {
    world.children.sort(byDepth);
  }

  //Display the player's x, y and index values
  message.content = `index: ${player.index}`;
}

//Helper functions

function byDepth(a, b) {
  //Calculate the depths of `a` and `b`
  //(add `1` to `a.z` and `b.x` to avoid multiplying by 0)
  a.depth = (a.cartX + a.cartY) * (a.z + 1);
  b.depth = (b.cartX + b.cartY) * (b.z + 1);

  //Move sprites with a lower depth to a higher position in the array
  if (a.depth < b.depth) {
    return -1;
  } else if (a.depth > b.depth) {
    return 1;
  } else {
    return 0;
  }
}

function hitTestIsoTile(sprite, mapArray, gidToCheck, world, pointsToCheck) {

  //The `checkPoints` helper function Loop through the sprite's corner points to 
  //find out if they are inside an array cell that you're interested in. 
  //Return `true` if they are
  let checkPoints = key => {

    //Get a reference to the current point to check.
    //(`topLeft`, `topRight`, `bottomLeft` or `bottomRight` )
    let point = sprite.collisionPoints[key];

    //Find the point's index number in the map array
    collision.index = g.getIndex(
      point.x, point.y,
      world.cartTilewidth, world.cartTileheight, world.widthInTiles
    );

    //Find out what the gid value is in the map position
    //that the point is currently over
    collision.gid = mapArray[collision.index];

    //If it matches the value of the gid that we're interested, in
    //then there's been a collision
    if (collision.gid === gidToCheck) {
      return true;
    } else {
      return false;
    }
  };

  //Assign "some" as the default value for `pointsToCheck`
  pointsToCheck = pointsToCheck || "some";

  //The collision object that will be returned by this function
  let collision = {};

  //Which points do you want to check?
  //"every", "some" or "center"?
  switch (pointsToCheck) {
    case "center":

      //`hit` will be true only if the center point is touching
      let point = {
        center: {
          //x: sprite.centerX,
          //y: sprite.centerY
          x: s.cartX + ca.x + (ca.width / 2),
          y: s.cartY + ca.y + (ca.height / 2)
        }
      };
      sprite.collisionPoints = point;
      collision.hit = Object.keys(sprite.collisionPoints).some(checkPoints);
      break;
    case "every":

      //`hit` will be true if every point is touching
      sprite.collisionPoints = getIsoPoints(sprite);
      collision.hit = Object.keys(sprite.collisionPoints).every(checkPoints);
      break;
    case "some":

      //`hit` will be true only if some points are touching
      sprite.collisionPoints = getIsoPoints(sprite);
      collision.hit = Object.keys(sprite.collisionPoints).some(checkPoints);
      break;
  }

  //Return the collision object.
  //`collision.hit` will be true if a collision is detected.
  //`collision.index` tells you the map array index number where the
  //collision occured
  return collision;
}

function getIsoPoints(s) {
  let ca = s.collisionArea;
  if (ca !== undefined) {
    return {
      topLeft: {
        x: s.cartX + ca.x,
        y: s.cartY + ca.y
      },
      topRight: {
        x: s.cartX + ca.x + ca.width,
        y: s.cartY + ca.y
      },
      bottomLeft: {
        x: s.cartX + ca.x,
        y: s.cartY + ca.y + ca.height
      },
      bottomRight: {
        x: s.cartX + ca.x + ca.width,
        y: s.cartY + ca.y + ca.height
      }
    };
  } else {
    return {
      topLeft: {
        x: s.cartX,
        y: s.cartY
      },
      topRight: {
        x: s.cartX + s.cartWidth - 1,
        y: s.cartY
      },
      bottomLeft: {
        x: s.cartX,
        y: s.cartY + s.cartHeight - 1
      },
      bottomRight: {
        x: s.cartX + s.cartWidth - 1,
        y: s.cartY + s.cartHeight - 1
      }
    };
  }
}


//Create some useful properties on the pointer
function makeIsoPointer(pointer, world) {
  Object.defineProperties(pointer, {

    //The isometric's world's Cartesian coordiantes
    cartX: {
      get() {
        return (((2 * this.cartY + this.cartX) - (2 * world.y + world.x)) / 2) - (world.cartTilewidth / 2);
      },
      enumerable: true,
      configurable: true
    },
    cartY: {
      get() {
        return (((2 * this.cartY - this.cartX) - (2 * world.y - world.x)) / 2) + (world.cartTileheight / 2);
      },
      enumerable: true,
      configurable: true
    },

    //The tile's column and row in the array
    column: {
      get() {
        return Math.floor(this.cartX / world.cartTilewidth);
      },
      enumerable: true,
      configurable: true
    },
    row: {
      get() {
        return Math.floor(this.cartY / world.cartTileheight);
      },
      enumerable: true,
      configurable: true
    },

    //The tile's index number in the array
    index: {
      get() {
        let index = {};

        //Convert pixel coordinates to map index coordinates
        index.x = Math.floor(this.cartX / world.cartTilewidth);
        index.y = Math.floor(this.cartY / world.cartTileheight);

        //Return the index number
        return index.x + (index.y * world.widthInTiles);
      },
      enumerable: true,
      configurable: true
    },
  });
}

//A function for creating a simple isometric diamond
//shaped rectangle using Pixi's graphics library
function isoRectangle(width, height, fillStyle) {

  //Figure out the `halfHeight` value
  let halfHeight = height / 2;

  //Draw the flattened and rotated square (diamond shape)
  let rectangle = new PIXI.Graphics();
  rectangle.beginFill(fillStyle);
  rectangle.moveTo(0, 0);
  rectangle.lineTo(width, halfHeight);
  rectangle.lineTo(0, height);
  rectangle.lineTo(-width, halfHeight);
  rectangle.lineTo(0, 0);
  rectangle.endFill();

  //Generate a texture from the rectangle
  let texture = rectangle.generateTexture();

  //Use the texture to create a sprite 
  let sprite = new PIXI.Sprite(texture);

  //Return it to the main program
  return sprite;
}

//Add properties to the sprite to help work between Cartesian
//and isometric properties
function addIsoProperties(sprite, x, y, width, height) {

  //Cartisian (flat 2D) properties
  sprite.cartX = x;
  sprite.cartY = y;
  sprite.cartWidth = width;
  sprite.cartHeight = height;

  //Add a getter/setter for the isometric properties
  Object.defineProperties(sprite, {
    isoX: {
      get() {
        return this.cartX - this.cartY;
      },
      enumerable: true,
      configurable: true
    },
    isoY: {
      get() {
        return (this.cartX + this.cartY) / 2;
      },
      enumerable: true,
      configurable: true
    },
  });
};

//A function for converting a Cartsian x and y point
//to an isometric point
//(This is unused in this example)
function isoPoint(x, y) {
  let point = {};
  point.x = x - y;
  point.y = (x + y) / 2;
  return point;
}