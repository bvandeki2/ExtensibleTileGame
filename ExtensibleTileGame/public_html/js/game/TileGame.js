var TileGame = (function() {
    var module = Util.extend(GameEngine.Game, {
        constructor: function() {
            this.keys = {
                left:   'A'.charCodeAt(0),
                right:  'D'.charCodeAt(0),
                up:     'W'.charCodeAt(0),
                down:   'S'.charCodeAt(0)
            };
            
            this.tileRegistry = new TileRegistry(this);

            this.world = new World(this);

            this.player = new Player();
            this.cursor = new Cursor();

            // World should render below everything, so it is registered first
            this.entityHandler.addEntity(
                    new WorldRenderer(this.world));

            this.entityHandler.addEntity(this.cursor);
            this.entityHandler.addEntity(this.player);
        }
    });
    
    return (module);
})();

window.addEventListener("load", function() {
    var canvas = document.getElementById("canvas");
    canvas.width = document.body.clientWidth;
    canvas.height = document.body.clientHeight;

    var game = new TileGame({canvas: canvas});

    game.tileRegistry.add("invalid", "img/invalid.png", 
        false);

    game.tileRegistry.add("air", undefined, false);
    game.tileRegistry.add("stone",  "img/stone.png");
    game.tileRegistry.add("dirt",   "img/dirt.png");
    game.tileRegistry.add("grass",  "img/grass.png");

    game.tileRegistry.requireResources();

    game.res.load(function() {
        game.start();
    });
});