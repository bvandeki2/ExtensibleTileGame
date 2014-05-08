var ExtensionLoader = (function() {
    var module = function() {
        /**
         * A list of extensions present in this {@linkcode ExtensionLoader}
         * @type Array
         */
        this.extensions = [];
    };
    /**
     * 
     * @param {Extension} ext - The Extension that will be added to this 
     *      {@linkcode ExtensionLoader}
     */
    module.prototype.add = function(ext) {
        if (ext)
            this.extensions.push(ext);
    };
    
    /**
     * "Masks" an object behind a public set of methods
     * @constructor
     * @param {Object} obj - The object to be masked behind this object
     * @param {Array} visible - A list of method names that are visible in 
     *      {@linkcode this.src}
     * @returns {Mask} A mask for obj, having functions in visible accessible
     */
    function Mask(obj, visible) {
        for(var i = 0; i < visible.length; i ++) {
            var name = visible[i];
            if (typeof obj[name] === "undefined") {
                this[name] = (function() {
                    obj[visible[key]].apply({}, arguments);
                });
            }
        }
    }
    
    /**
     * Loads all extensions by calling {@linkcode Extension.load}
     * @param {TileRegistry} tileRegistry - Reference to the TileRegistry the
     *      extensions will load into
     * @param {TerrainGenerator} terrainGenerator - Reference to the
     *      TerrainGenerator the extensions will load into
     */
    module.prototype.load = function(tileRegistry, terrainGenerator) {
        var trMask = new Mask(tileRegistry, ["add", "isSolid"]),
            tgMask = new Mask(terrainGenerator, ["addGenStop"]);
    };
    
    
    return (module);
})();