//Create a new Hexi instance, and start it.
let g = hexi(512, 512, setup);

//Scale the canvas to the maximum browser dimensions
g.scaleToWindow();

//Start Hexi
g.start();


function setup() {

  //Create the `world` container that defines our isometric 
  //tile-based world
  let world = g.group();

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
    [
      2, 2, 2, 2, 2, 2, 2, 2,
      2, 1, 1, 1, 1, 1, 1, 2,
      2, 1, 2, 1, 1, 2, 1, 2,
      2, 1, 1, 1, 1, 2, 2, 2,
      2, 1, 1, 1, 1, 1, 1, 2,
      2, 2, 2, 1, 2, 1, 1, 2,
      2, 1, 1, 1, 1, 1, 1, 2,
      2, 2, 2, 2, 2, 2, 2, 2
    ],

    //The character layer. `3` represents the game character
    //`0` represents an empty cell which won't contain any
    //sprites
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

  //Build the game world by looping through each 
  //of the layers arrays one after the other
  world.layers.forEach(layer => {

    //Loop through each array element
    layer.forEach((gid, index) => {

      //If the cell isn't empty (0) then create a sprite
      if (gid !== 0) {

        //Find the column and row that the sprite is on and also
        //its x and y pixel values that match column and row position
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
            sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0xCCCCFF);
            break;

            //The walls
          case 2:
            sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0x99CC00);
            break;

            //The character  
          case 3:
            sprite = g.rectangle(world.cartTilewidth, world.cartTileheight, 0xFF0000);
        }

        //Position the sprite using the calculated `x` and `y` values
        //that match its column and row in the tile map
        sprite.x = x;
        sprite.y = y;

        //Add the sprite to the `world` container
        world.addChild(sprite);
      }
    });
  });
}