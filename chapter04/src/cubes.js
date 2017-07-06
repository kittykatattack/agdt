//The files we want to load
let thingsToLoad = [
  "images/cubes.png",
  "images/cubes.json"
];

//Create a new Hexi instance, and start it.
let g = hexi(512, 512, setup, thingsToLoad);

//Scale the canvas to the maximum browser dimensions
g.scaleToWindow();

//Declare variables used in more than one function
let world, leftArrow, upArrow,
  rightArrow, downArrow, message, wallLayer,
  player, wallMapArray;

//Start Hexi
g.start();

function setup() {

  //Make the world from the Tiled JSON data
  world = makeIsoTiledWorld(
    "images/cubes.json",
    "images/cubes.png"
  );

  //Add the world to the `stage`
  g.stage.addChild(world);

  //Position the world inside the canvas
  let canvasOffset = (g.canvas.width / 2) - world.tilewidth / 2;
  world.x += canvasOffset;
  world.y = 0;

  //Get the objects we need from the world
  player = world.getObject("player");
  wallLayer = world.getObject("wallLayer");

  //Add the player to the wall layer and set it at
  //the same depth level as the walls
  wallLayer.addChild(player);
  player.z = 0;
  wallLayer.children.sort(byDepth);

  //Initialize the player's velocity to zero
  player.vx = 0;
  player.vy = 0;

  //Make a text object
  message = g.text("", "16px Futura", "black");
  message.setPosition(5, 0);

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
  wallMapArray = wallLayer.data;

  //Use `hitTestIsoTile` to check for a collision
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

  //Position the sprite's screen `x` and `y` position
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
    wallLayer.children.sort(byDepth);
  }

  //Display the player's x, y and index values
  message.content = `index: ${player.index}`;
}

//Helper functions

function makeIsoTiledWorld(jsonTiledMap, tileset) {

  //Create a group called `world` to contain all the layers, sprites
  //and objects from the `tiledMap`. The `world` object is going to be
  //returned to the main game program
  let tiledMap = PIXI.loader.resources[jsonTiledMap].data;

  //A. You need to add three custom properties to your Tiled Editor
  //map: `cartTilewidth`,`cartTileheight` and `tileDepth`. They define the Cartesian
  //dimesions of the tiles (32x32x64).
  //Check to make sure that these custom properties exist  
  if (!tiledMap.properties.cartTilewidth && !tiledMap.properties.cartTileheight && !tiledMao.properties.tileDepth) {
    throw new Error(
      "Set custom cartTilewidth, cartTileheight and tileDepth 
      map properties in Tiled Editor"
    );
  }

  //Create the `world` container
  let world = new PIXI.Container();

  //B. Set the `tileHeight` to the `tiledMap`'s `tileDepth` property
  //so that it matches the pixel height of the sprite tile image
  world.tileheight = parseInt(tiledMap.properties.tileDepth);
  world.tilewidth = tiledMap.tilewidth;


  //C. Define the Cartesian dimesions of each tile
  world.cartTileheight = parseInt(tiledMap.properties.cartTileheight);
  world.cartTilewidth = parseInt(tiledMap.properties.cartTilewidth);

  //D. Calculate the `width` and `height` of the world, in pixels
  //using the `world.cartTileHeight` and `world.cartTilewidth`
  //values
  world.worldWidth = tiledMap.width * world.cartTilewidth;
  world.worldHeight = tiledMap.height * world.cartTileheight;

  //Get a reference to the world's height and width in
  //tiles, in case you need to know this later (you will!)
  world.widthInTiles = tiledMap.width;
  world.heightInTiles = tiledMap.height;

  //Create an `objects` array to store references to any
  //named objects in the map. Named objects all have
  //a `name` property that was assigned in Tiled Editor
  world.objects = [];

  //The optional spacing (padding) around each tile
  //This is to account for spacing around tiles
  //that's commonly used with texture atlas tilesets. Set the
  //`spacing` property when you create a new map in Tiled Editor
  let spacing = tiledMap.tilesets[0].spacing;

  //Figure out how many columns there are on the tileset.
  //This is the width of the image, divided by the width
  //of each tile, plus any optional spacing thats around each tile
  let numberOfTilesetColumns =
    Math.floor(
      tiledMap.tilesets[0].imagewidth / (tiledMap.tilewidth + spacing)
    );

  //E. A `z` property to help track which depth level the sprites are on
  let z = 0;

  //Loop through all the map layers
  tiledMap.layers.forEach(tiledLayer => {

    //Make a group for this layer and copy
    //all of the layer properties onto it.
    let layerGroup = new PIXI.Container();

    Object.keys(tiledLayer).forEach(key => {
      //Add all the layer's properties to the group, except the
      //width and height (because the group will work those our for
      //itself based on its content).
      if (key !== "width" && key !== "height") {
        layerGroup[key] = tiledLayer[key];
      }
    });

    //Translate `opacity` to `alpha`
    layerGroup.alpha = tiledLayer.opacity;

    //Add the group to the `world`
    world.addChild(layerGroup);

    //Push the group into the world's `objects` array
    //So you can access it later
    world.objects.push(layerGroup);

    //Is this current layer a `tilelayer`?
    if (tiledLayer.type === "tilelayer") {

      //Loop through the `data` array of this layer
      tiledLayer.data.forEach((gid, index) => {
        let tileSprite, texture, mapX, mapY, tilesetX, tilesetY,
          mapColumn, mapRow, tilesetColumn, tilesetRow;

        //If the grid id number (`gid`) isn't zero, create a sprite
        if (gid !== 0) {

          //Figure out the map column and row number that we're on, and then
          //calculate the grid cell's x and y pixel position.
          mapColumn = index % world.widthInTiles;
          mapRow = Math.floor(index / world.widthInTiles);

          //F. Use the Cartesian values to find the 
          //`mapX` and `mapY` values
          mapX = mapColumn * world.cartTilewidth;
          mapY = mapRow * world.cartTileheight;

          //Figure out the column and row number that the tileset
          //image is on, and then use those values to calculate
          //the x and y pixel position of the image on the tileset
          tilesetColumn = ((gid - 1) % numberOfTilesetColumns);
          tilesetRow = Math.floor((gid - 1) / numberOfTilesetColumns);
          tilesetX = tilesetColumn * world.tilewidth;
          tilesetY = tilesetRow * world.tileheight;

          //Compensate for any optional spacing (padding) around the tiles if
          //there is any. This bit of code accumlates the spacing offsets from the
          //left side of the tileset and adds them to the current tile's position
          if (spacing > 0) {
            tilesetX += spacing + (spacing * ((gid - 1) % numberOfTilesetColumns));
            tilesetY += spacing + (spacing * Math.floor((gid - 1) / numberOfTilesetColumns));
          }

          //Use the above values to create the sprite's image from
          //the tileset image
          texture = g.frame(
            tileset, tilesetX, tilesetY,
            world.tilewidth, world.tileheight
          );

          //I've dedcided that any tiles that have a `name` property are important
          //and should be accessible in the `world.objects` array.

          let tileproperties = tiledMap.tilesets[0].tileproperties,
            key = String(gid - 1);

          //If the JSON `tileproperties` object has a sub-object that
          //matches the current tile, and that sub-object has a `name` property,
          //then create a sprite and assign the tile properties onto
          //the sprite
          if (tileproperties[key] && tileproperties[key].name) {

            //Make a sprite
            tileSprite = new PIXI.Sprite(texture);

            //Copy all of the tile's properties onto the sprite
            //(This includes the `name` property)
            Object.keys(tileproperties[key]).forEach(property => {

              //console.log(tileproperties[key][property])
              tileSprite[property] = tileproperties[key][property];
            });

            //Push the sprite into the world's `objects` array
            //so that you can access it by `name` later
            world.objects.push(tileSprite);
          }

          //If the tile doesn't have a `name` property, just use it to
          //create an ordinary sprite (it will only need one texture)
          else {
            tileSprite = new PIXI.Sprite(texture);
          }

          //G. Add isometric properties to the sprite
          addIsoProperties(
            tileSprite, mapX, mapY,
            world.cartTilewidth, world.cartTileheight
          );

          //H. Use the isometric position to add the sprite to the world
          tileSprite.x = tileSprite.isoX;
          tileSprite.y = tileSprite.isoY;
          tileSprite.z = z;

          //Make a record of the sprite's index number in the array
          //(We'll use this for collision detection later)
          tileSprite.index = index;

          //Make a record of the sprite's `gid` on the tileset.
          //This will also be useful for collision detection later
          tileSprite.gid = gid;

          //Add the sprite to the current layer group
          layerGroup.addChild(tileSprite);
        }
      });
    }

    //Is this layer an `objectgroup`?
    if (tiledLayer.type === "objectgroup") {
      tiledLayer.objects.forEach(object => {

        //We're just going to capture the object's properties
        //so that we can decide what to do with it later

        //Get a reference to the layer group the object is in
        object.group = layerGroup;

        //Push the object into the world's `objects` array
        world.objects.push(object);
      });
    }

    //I. Add 1 to the z index (the first layer will have a z index of `1`)
    z += 1;
  });

  //Search functions
  //`world.getObject` and `world.getObjects`  search for and return
  //any sprites or objects in the `world.objects` array.
  //Any object that has a `name` propery in
  //Tiled Editor will show up in a search.
  //`getObject` gives you a single object, `getObjects` gives you an array
  //of objects.
  //`getObject` returns the actual search function, so you
  //can use the following format to directly access a single object:
  //sprite.x = world.getObject("anySprite").x;
  //sprite.y = world.getObject("anySprite").y;

  world.getObject = (objectName) => {
    let searchForObject = () => {
      let foundObject;
      world.objects.some(object => {
        if (object.name && object.name === objectName) {
          foundObject = object;
          return true;
        }
      });
      if (foundObject) {
        return foundObject;
      } else {
        throw new Error("There is no object with the property name: " + objectName);
      }
    };

    //Return the search function
    return searchForObject();
  };

  world.getObjects = (objectNames) => {
    let foundObjects = [];
    world.objects.forEach(object => {
      if (object.name && objectNames.indexOf(object.name) !== -1) {
        foundObjects.push(object);
      }
    });
    if (foundObjects.length > 0) {
      return foundObjects;
    } else {
      throw new Error("I could not find those objects");
    }
    return foundObjects;
  };

  //That's it, we're done!
  //Finally, return the `world` object back to the game program
  return world;
}

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
        return (((2 * this.cartY + this.cartX) - (2 * world.y + world.x)) / 2) - (world.tilewidth / 2);
      },
      enumerable: true,
      configurable: true
    },
    cartY: {
      get() {
        return (((2 * this.cartY - this.cartX) - (2 * world.y - world.x)) / 2) + (world.tileheight / 2);
      },
      enumerable: true,
      configurable: true
    },

    //The tile's column and row in the array
    column: {
      get() {
        return Math.floor(this.cartX / world.tilewidth);
      },
      enumerable: true,
      configurable: true
    },
    row: {
      get() {
        return Math.floor(this.cartY / world.tileheight);
      },
      enumerable: true,
      configurable: true
    },

    //The tile's index number in the array
    index: {
      get() {
        let index = {};

        //Convert pixel coordinates to map index coordinates
        index.x = Math.floor(this.cartX / world.tilewidth);
        index.y = Math.floor(this.cartY / world.tileheight);

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