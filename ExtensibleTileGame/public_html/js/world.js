var World = function(game) {
    this.regions = [];
    
    this.game = game;
    
    this.generator = new TerrainGenerator(this.game.tileRegistry);
    
    // Regions are 8x8 tiles
    this.regionSize = 8;
    // With 24 by 24 px tiles
    this.imgResolution = 24;
    
    this.displayCaches = [];
    for(var i = 0; i < 100; i ++) {
        var canvas = document.createElement("canvas");
        canvas.width = canvas.height = this.regionSize * this.imgResolution;
        this.displayCaches[i] = {
            canvas: canvas,
            ctx: canvas.getContext("2d"),
            region: undefined
        };
    }
    
    this.setFocus(0, 0);
};
/**
 * Request a display cache to a certain region, unloading it from another of
 * lower importance
 * @param {Region} newRegion The region that will use the display cache
 * @return {Object} The display cache
 */
World.prototype.requestDisplayCache = function(newRegion) {
    var selected = -1, maxDist = 0, 
        halfRegion = this.regionSize * this.imgResolution / 2;
    
    // Get the furthest away one (least important)
    for(var i = 0; i < this.displayCaches.length; i ++) {
        if (!this.displayCaches[i].region) {
            selected = i;
            break;
        }
        var dx = (this.displayCaches[i].region.x + halfRegion - this.focusX),
            dy = (this.displayCaches[i].region.y + halfRegion - this.focusY);
        if (dx * dx + dy * dy > maxDist) {
            selected = i;
            maxDist = dx * dx + dy * dy;
        }
    }
    
    
    // Release it from old region, if needed
    if (this.displayCaches[selected].region)
        this.displayCaches[selected].region.freeDisplayCache();
    this.displayCaches[selected].region = newRegion;
    return (this.displayCaches[selected]);
    
    
};
World.prototype.getRegion = function(x, y) {
    // Verify it exists
    if (this.regions[x] === undefined)
        this.regions[x] = [];
    if (this.regions[x][y] === undefined)
        this.regions[x][y] = new Region(this, this.regionSize, x, y);
    return (this.regions[x][y]);
};
World.prototype.get = function(x, y) {
    // Get the tile in the selected area
    return (this.getRegion(
                Math.floor(x / this.regionSize),
                Math.floor(y / this.regionSize))
                .get(x % this.regionSize, y % this.regionSize));
};
World.prototype.set = function(tile, x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    this.getRegion(
            Math.floor(x / this.regionSize),
            Math.floor(y / this.regionSize))
            .set(tile, x % this.regionSize, y % this.regionSize);
};
/**
 * Set the current focus of the world.
 * @param {type} x The pixel x-component to focus the viewplane on
 * @param {type} y The pixel y-component to focus the viewplane on
 */
World.prototype.setFocus = function(x, y) {
    this.focusX = x;
    this.focusY = y;
};
World.prototype.render = function() {
    //  Calculations for screen-only rendering of regions
    // Region size in px
    var r = this.regionSize * this.imgResolution;
    var startX  = Math.floor((this.focusX - this.game.canvas.width  / 2) / r),
        startY  = Math.floor((this.focusY - this.game.canvas.height / 2) / r),
        endX    = Math.floor((this.focusX + this.game.canvas.width  / 2) / r),
        endY    = Math.floor((this.focusY + this.game.canvas.height / 2) / r);
        
    this.game.ctx.beginPath();
    
    for(var x = startX; x <= endX; x ++)
    for(var y = startY; y <= endY; y ++) {
        this.getRegion(x, y).render(this.game.ctx, x * r, y * r);
        
        this.game.ctx.moveTo(x * r + r, y * r);
        this.game.ctx.lineTo(x * r, y * r);
        this.game.ctx.lineTo(x * r, y * r + r);
    }
    this.game.ctx.stroke();
};

var Region = function(world, size, x, y, compressedData) {
    this.world = world;
    this.size = size;
    this.x = x;
    this.y = y;
    
    this.displayCache = undefined;
    this.ctx = undefined;
    
    this.data = undefined;
    this.ctxDirty = false;
    
    if (!compressedData) {
        // Dirty flag; set to true if anything is modified, requiring another 
        // compress to update.
        this.compressedDirty = true;
        this.compressedData = "";
    } else {
        // No compression update needed yet
        this.compressedDirty = false;
        this.compressedData = compressedData;
    }
    
    this.generate();
};
Region.prototype.render = function(ctx, x, y) {
    if (this.ctxDirty || !this.displayCache)
        this.updateDisplayCache();
    ctx.drawImage(this.displayCache, x, y);
};
Region.prototype.freeDisplayCache = function() {
    this.displayCache = undefined;
    this.ctx = undefined;
};
Region.prototype.updateDisplayCache = function() {
    if (!this.displayCache) {
        var cache = this.world.requestDisplayCache(this);
        this.displayCache = cache.canvas;
        this.ctx = cache.ctx;
    }
    
    this.ctx.clearRect(0, 0, this.displayCache.width, this.displayCache.height);

    for(var x = 0; x < this.size; x++)
    for(var y = 0; y < this.size; y++)
        this.world.game.tileRegistry.renderTile(this.ctx, this.get(x, y), 
            x * this.world.imgResolution, y * this.world.imgResolution);
            
    this.ctxDirty = false;
};
Region.prototype.generate = function() {
    // Generate or load
    
    if (!this.compressedData) {
        this.data = [];
        var rSize = this.world.regionSize;
        for(var x = 0; x < this.size; x ++) {
            this.data[x] = [];
            for(var y = 0; y < this.size; y ++)
                this.data[x][y] = 
                    this.world.generator.tileGen(
                    this.x * rSize + x, this.y * rSize + y);
        };
    } else
        this.data = JSON.parse(
            LZString.decompressFromUTF16(this.compressedData));
};
Region.prototype.compress = function() {
    // Only compress if needed
    if (this.compressedDirty) {
        this.compressedDirty = false;
        this.compressedData = 
                LZString.compressToUTF16(JSON.stringify(this.data));
    }
};
Region.prototype.get = function(x, y) {
    // Fix negative modulus
    if (x < 0)
        x += this.size;
    if (y < 0)
        y += this.size;
    return (this.data[x][y]);
};
Region.prototype.set = function(tile, x, y) {
    // Fix negative modulus
    if (x < 0)
        x += this.size;
    if (y < 0)
        y += this.size;
    this.data[x][y] = tile;
    
    this.ctxDirty = true;
    this.compressedDirty = true;
};

var TerrainGenerator = function(tileRegistry, method) {
    this.tileRegistry = tileRegistry;
    this.method = method || {
        scale: 0.05,
        shapes: [
            {
                start: Number.MIN_SAFE_INTEGER,
                eval: new Evaluable(0),
                types: [{
                    start: 0, tile: "air" }
                ]
            }, {
                start: -5,
                eval: new Evaluable("*", {
                    a: new Evaluable("ratio"),
                    b: new Evaluable("noise")
                }),
                types: [{
                    start: 0, tile: "air" }, {
                    start: 0.1, tile: "stone" }
                ]
            }, {
                start: 5,
                eval: new Evaluable(0),
                types: [{
                    start: 0, tile: "stone" }
                ]
            }, {
                start: 20,
                eval: new Evaluable("*", {
                    a: new Evaluable("noise", 0),
                    b: new Evaluable("lerp", {
                        a: new Evaluable("noise", {
                            id: 1,
                            scale: 0.3
                        }),
                        b: 1,
                        x: new Evaluable("ratio")
                    })
                }),
                types: [{
                    start: 0, tile: "stone" }, {
                    start: 0.36, tile: "air" }, {
                    start: 0.64, tile: "stone" }
                ]
            }, {
                start: 1024,
                eval: new Evaluable("noise"),
                types: [{
                    start: 0, tile: "stone" }, {
                    start: 0.36, tile: "air" }, {
                    start: 0.64, tile: "stone" }
                ]
            }
        ]
    };
};
/**
 * Generates a single tile at x, y
 * @param {type} x x-coordinate of the tile
 * @param {type} y y-coordinate of the tile
 * @returns {Tile/Number} id or Tile object
 */
TerrainGenerator.prototype.tileGen = function(x, y) {
    var i = 0, shapes =  this.method.shapes;
    while (i < shapes.length && y >= shapes[i].start)
       i++;
    // Now one index too high
    i--;
    var ratio;
    if (shapes[i + 1] !== undefined)
        ratio = (y - shapes[i].start) / (shapes[i + 1].start - shapes[i].start);
    else
        ratio = 0;
    var val = this.method.shapes[i].eval.eval(x * this.method.scale, 
                                              y * this.method.scale, ratio);
    
    var j = 0, types =  shapes[i].types;
    while (j < types.length && val >= types[j].start)
       j++;
    j--;
    
    return (this.tileRegistry.makeTile(types[j].tile));
};

// Evaluable module, used as a safer alternative to window.eval
var Evaluable = (function() {
    var self = function () {
        if (typeof arguments[0] === "number") {
            this.opr = "const";
            this.data = arguments[0];
        } else {
            this.opr = arguments[0];
            this.data = arguments[1];
        }
    };
    
    var noiseGenerators = {};
    var getNoise = function(x, y, id) {
        if (!noiseGenerators[id])
            noiseGenerators[id] = new SimplexNoise(Math);
        return (0.5 * (1 + noiseGenerators[id].noise(x, y)));
    };
    
    function process(val, x, y, ratio) {
        if (val === undefined)
            return (0);
        if (typeof val === "number") return val;
        return (val.eval(x, y, ratio));
    }
    
    self.prototype.eval = function (x, y, ratio) {
        switch (this.opr) {
            case "const":
                return (process(this.data, x, y, ratio));
            case "ratio":
                return (ratio);
            case "x":
                return (x);
            case "y":
                return (y);
            
            // Now for actual operands
            
            case "+":
                return (process(this.data.a, x, y, ratio) + 
                        process(this.data.b, x, y, ratio));
            case "*":
                return (process(this.data.a, x, y, ratio) * 
                        process(this.data.b, x, y, ratio));
            case "-":
                return (process(this.data.a, x, y, ratio) - 
                        process(this.data.b, x, y, ratio));
            case "/":
                return (process(this.data.a, x, y, ratio) / 
                        process(this.data.b, x, y, ratio));
            case "noise":
                var id, scale = 1;
                if (typeof this.data === "object") {
                    id = process(this.data.id, x, y, ratio);
                    scale = process(this.data.scale, x, y, ratio);
                } else
                    id = process(this.data, x, y, ratio);
                return (getNoise(x * scale, y * scale, id));
            case "lerp":
                var r = process(this.data.x, x, y, ratio);
                return ((1 - r) * process(this.data.a, x, y, ratio) +
                        (    r) * process(this.data.b, x, y, ratio));
            case "inrange":
                var x = process(this.data.x, x, y, ratio);
                return (process(this.data.a, x, y, ratio) <= x &&
                        process(this.data.b, x, y, ratio) > x);
        }
    };
    
    return (self);
})();

var Tile = function(id, data) {
    this.id = id;
    this.data = data;
};

var TileRegistry = function(game) {
    this.game = game;
    this.tileDef = [];
    // Tile indexes by name
    this.tileIndexes = {};
};
/**
 * 
 * @param {String} name Name of the tile
 * @param {String} imgSrc Source location for the 24x24 image
 * @param {Boolean} solid True if the tile is solid
 * @param {function} create Callback for creation event of block
 * @param {function} update Callback for update event of block
 * @param {function} active Callback for mouse click events on the block
 * @param {Object} data Default extra data for the block.
 * @returns {TileRegistry.tileIndexes} id of the tile
 */
TileRegistry.prototype.add = function(
        name, imgSrc, solid, create, update, active, data) {
    this.tileIndexes[name] = this.tileDef.length;
    // True by default
    if (solid === undefined)
        solid = true;
    this.tileDef.push({
        name:   name,
        imgSrc: imgSrc,
        solid:  solid,
        data:   data,
        create: create,
        update: update,
        active: active
    });
    return (this.tileIndexes[name]);
};
TileRegistry.prototype.requireResources = function() {
    for(var i = 0;i < this.tileDef.length; i++)
        this.game.res.require(this.tileDef[i].imgSrc);
};
TileRegistry.prototype.isSolid = function(kind) {
    if (kind === undefined)
        kind = "invalid";
    var id;
    if (typeof kind === "string")
        id = this.tileIndexes[kind];
    else
        id = kind;
        return (this.tileDef[id].solid);
};
/**
 * Makes a new tile, either by id or object with extra data
 * @param {Number/String} kind - The id or name of the tile
 * @return {Tile/Number} id or Tile object
 */
TileRegistry.prototype.makeTile = function(kind) {
    var id;
    if (typeof kind === "string")
        id = this.tileIndexes[kind];
    else
        id = kind;
    // Set to invalid if something goes wrong
    if (this.tileDef[id] === undefined)
        id = this.tileIndexes["invalid"];
        
    if (this.tileDef[id].hasData)
        return (new Tile(id, this.tileDef[id].data));
    return (id);
};
TileRegistry.prototype.renderTile = function(ctx, kind, x, y) {
    var id;
    if (typeof kind === "string")
        id = this.tileIndexes[kind];
    else
        id = kind;
    if (this.tileDef[id] === undefined)
        return;
    var img = this.game.res.get(this.tileDef[id].imgSrc);
    if (img)
        ctx.drawImage(img, x, y);
};

