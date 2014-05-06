var Region = (function() {
    var module = function(world, size, x, y, compressedData) {
        this.world = world;
        this.size = size;
        this.x = x;
        this.y = y;

        this.displayCache = undefined;
        this.ctx = undefined;

        this.data = undefined;
        this.ctxDirty = false;

        if (!compressedData) {
            // Dirty flag; set to true if anything is modified, requiring
            // another compress to update.
            this.compressedDirty = true;
            this.compressedData = "";
        } else {
            // No compression update needed yet
            this.compressedDirty = false;
            this.compressedData = compressedData;
        }

        this.generate();
    };
    module.prototype.render = function(ctx, x, y) {
        if (this.ctxDirty || !this.displayCache)
            this.updateDisplayCache();
        ctx.drawImage(this.displayCache, x, y);
    };
    module.prototype.freeDisplayCache = function() {
        this.displayCache = undefined;
        this.ctx = undefined;
    };
    module.prototype.updateDisplayCache = function() {
        if (!this.displayCache) {
            var cache = this.world.requestDisplayCache(this);
            this.displayCache = cache.canvas;
            this.ctx = cache.ctx;
        }

        this.ctx.clearRect(0, 0, this.displayCache.width, 
                                 this.displayCache.height);

        for(var x = 0; x < this.size; x++)
        for(var y = 0; y < this.size; y++)
            this.world.game.tileRegistry.renderTile(this.ctx, 
                this.get(x, y), 
                x * this.world.imgResolution, 
                y * this.world.imgResolution);

        this.ctxDirty = false;
    };
    module.prototype.generate = function() {
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
    module.prototype.compress = function() {
        // Only compress if needed
        if (this.compressedDirty) {
            this.compressedDirty = false;
            this.compressedData = 
                    LZString.compressToUTF16(JSON.stringify(this.data));
        }
    };
    module.prototype.get = function(x, y) {
        // Fix negative modulus
        if (x < 0)
            x += this.size;
        if (y < 0)
            y += this.size;
        return (this.data[x][y]);
    };
    module.prototype.set = function(tile, x, y) {
        // Fix negative modulus
        if (x < 0)
            x += this.size;
        if (y < 0)
            y += this.size;
        this.data[x][y] = tile;

        this.ctxDirty = true;
        this.compressedDirty = true;
    };
    
    return (module);
})();