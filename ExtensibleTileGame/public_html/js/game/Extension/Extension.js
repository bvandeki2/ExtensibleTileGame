var Extension = (function() {
    /**
     * @constructor
     * @param {string} src - The URI of the extension source file
     * @returns {Extension} The newly-created {@linkcode Extension}
     */
    var module = function(src) {
        this.src = src;
    };
    
    /**
     * 
     * @param {strnig} src
     * @param {function} callback
     */
    function get(src, callback) {
        var req = new XMLHttpRequest();
        
        req.onload = callback;
        
        req.open("GET", src);
        req.send();
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
     * Loads this extension, running the coed at this.src
     * @param {TileRegistry} tileRegistry - Reference to the TileRegistry the
     *      extension will load into
     * @param {TerrainGenerator} terrainGenerator - Reference to the
     *      TerrainGenerator the extension will load into
     */
    module.prototype.load = function(tileRegistry, terrainGenerator) {
        get(this.src, function(e) {
            this.extension = new Function(e.target.responseText).call(
                    {}, tileRegistry, terrainGenerator);
        });
    };
    
    return (module);
})();