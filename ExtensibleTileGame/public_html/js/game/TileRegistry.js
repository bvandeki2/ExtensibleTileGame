var TileRegistry = (function() {
    var module = function(game) {
        this.game = game;
        this.tileDef = [];
        // Tile indexes by name
        this.tileIndexes = {};
    };
    /**
     * Adds a tile to the tile registry
     * @param {String} name Name of the tile
     * @param {String} imgSrc Source location for the 24x24 image
     * @param {Boolean} solid True if the tile is solid
     * @param {function} create Callback for creation event of block
     * @param {function} update Callback for update event of block
     * @param {function} active Callback for mouse click events on the block
     * @param {Object} data Default extra data for the block.
     * @returns {TileRegistry.tileIndexes} id of the tile
     */
    module.prototype.add = function(
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
    module.prototype.requireResources = function() {
        for(var i = 0;i < this.tileDef.length; i++)
            this.game.res.require(this.tileDef[i].imgSrc);
    };
    module.prototype.isSolid = function(kind) {
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
    module.prototype.makeTile = function(kind) {
        var id;
        if (typeof kind === "string")
            id = this.tileIndexes[kind];
        else
            id = kind;
        // Set to invalid if something goes wrong
        if (this.tileDef[id] === undefined)
            id = this.tileIndexes["invalid"];

        if (this.tileDef[id].hasData)
            return (new World.Tile(id, this.tileDef[id].data));
        return (id);
    };
    module.prototype.renderTile = function(ctx, kind, x, y) {
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
    
    return (module);
})();