//Create a new Hexi instance, and start it.
let g = hexi(512, 512, setup);

//Scale the canvas to the maximum browser dimensions
g.scaleToWindow();

//Declare variables used in more than one function
let world, message;

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

  //The environment layer. `2` represents the walls,
  //`1` represents the floors
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 1, 2, 1, 1, 2, 1, 2, 2, 1, 1, 1, 1, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 1, 2, 1, 1, 2, 2, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2],

  //The character layer. `3` represents the game character
  //`0` represents an empty cell which won't contain any
  //sprites
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];

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

            //Create a sprite using an isometric rectangle
            sprite = isoRectangle(world.cartTilewidth, world.cartTileheight, 0xCCCCFF);
            //Cartesian rectangle:
            //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0xCCCCFF);
            break;

          //The walls
          case 2:
            sprite = isoRectangle(world.cartTilewidth, world.cartTileheight, 0x99CC00);
            //Cartesian rectangle:
            //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0x99CC00);
            break;

          //The character 
          case 3:
            sprite = isoRectangle(world.cartTilewidth, world.cartTileheight, 0xFF0000);
            //Cartesian rectangle:
            //sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0xFF0000);

            //Define this sprite as the `player`
            player = sprite;
        }

        //Add these properties to the sprite
        addIsoProperties(sprite, x, y, world.cartTilewidth, world.cartTileheight);

        //Set the sprite's `x` and `y` pixel position based on its
        //isometric coordinates
        sprite.x = sprite.isoX;
        sprite.y = sprite.isoY;

        //Cartesian positioning
        //sprite.x = sprite.cartX;
        //sprite.y = sprite.cartY;

        //Add the sprite to the `world` container
        world.addChild(sprite);
      }
    });
  });

  //Position the world inside the canvas
  let canvasOffset = g.canvas.width / 2 - world.cartTilewidth;
  world.x += canvasOffset;
  world.y = 150;

  //Make a text object
  message = g.text("", "16px Futura", "black");
  message.setPosition(5, 0);

  makeIsoPointer(g.pointer, world);

  //Set the game state to `play`
  g.state = play;
}

function play() {

  //Display the x and y position of the tile that the pointer is over
  /*
  message.content = `
    cartX: ${Math.floor(g.pointer.cartX)}
    cartY: ${Math.floor(g.pointer.cartY)}
    column: ${Math.floor(g.pointer.column)} 
    row: ${Math.floor(g.pointer.row)}
    index: ${Math.floor(g.pointer.index)}
    layer 1 gid: ${world.layers[0][Math.floor(g.pointer.index)]}
    layer 2 gid: ${world.layers[1][Math.floor(g.pointer.index)]}
  `;
  */
  message.content = `
    cartX: ${ Math.floor(g.pointer.cartX) }
    cartY: ${ Math.floor(g.pointer.cartY) }
    column: ${ g.pointer.column } 
    row: ${ g.pointer.row }
    index: ${ g.pointer.index }
    layer 1 gid: ${ world.layers[0][Math.floor(g.pointer.index)] }
    layer 2 gid: ${ world.layers[1][Math.floor(g.pointer.index)] }
  `;
}

//Helper functions

//Create some useful properties on the pointer
function makeIsoPointer(pointer, world) {
  Object.defineProperties(pointer, {

    //The isometric's world's Cartesian coordiantes
    cartX: {
      get() {
        let x = (2 * this.y + this.x - (2 * world.y + world.x)) / 2 - world.cartTilewidth / 2;

        return x;
      },
      enumerable: true,
      configurable: true
    },
    cartY: {
      get() {
        let y = (2 * this.y - this.x - (2 * world.y - world.x)) / 2 + world.cartTileheight / 2;

        return y;
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
        return index.x + index.y * world.widthInTiles;
      },
      enumerable: true,
      configurable: true
    }
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
    }
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
//# sourceMappingURL=pointer.js.map