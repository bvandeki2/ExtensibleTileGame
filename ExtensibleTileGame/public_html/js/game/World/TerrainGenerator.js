var TerrainGenerator = (function() {
    var module = function(tileRegistry, method) {
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
    module.prototype.tileGen = function(x, y) {
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
    
    return (module);
})();