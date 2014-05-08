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
     * @param {string} src
     * @param {function} callback
     */
    function get(src, callback) {
        var req = new XMLHttpRequest();
        
        req.onload = callback;
        
        req.open("GET", src);
        req.send();
    };
    
    /**
     * Loads this extension, running the code at this.src
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