var World = (function() {
    var module = function(game) {
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
     * @param {World.Region} newRegion The region that will use the display cache
     * @return {Object} The display cache
     */
    module.prototype.requestDisplayCache = function(newRegion) {
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
    module.prototype.getRegion = function(x, y) {
        // Verify it exists
        if (this.regions[x] === undefined)
            this.regions[x] = [];
        if (this.regions[x][y] === undefined)
            this.regions[x][y] = new Region(this, this.regionSize, x, y);
        return (this.regions[x][y]);
    };
    module.prototype.get = function(x, y) {
        // Get the tile in the selected area
        return (this.getRegion(
                    Math.floor(x / this.regionSize),
                    Math.floor(y / this.regionSize))
                    .get(x % this.regionSize, y % this.regionSize));
    };
    module.prototype.set = function(tile, x, y) {
        x = Math.floor(x);
        y = Math.floor(y);
        this.getRegion(
                Math.floor(x / this.regionSize),
                Math.floor(y / this.regionSize))
                .set(tile, x % this.regionSize, y % this.regionSize);
    };
    /**
     * Set the current focus of the World.
     * @param {type} x The pixel x-component to focus the viewplane on
     * @param {type} y The pixel y-component to focus the viewplane on
     */
    module.prototype.setFocus = function(x, y) {
        this.focusX = x;
        this.focusY = y;
    };
    module.prototype.render = function() {
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
    
    return (module);
})();