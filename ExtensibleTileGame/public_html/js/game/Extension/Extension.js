var Extension = (function() {
    var module = function(src) {
        this.src = src;
    };
    
    function get(src, callback) {
        var req = new XMLHttpRequest();
        
        req.onload = callback;
        
        req.open("GET", src);
        req.send();
    };
    
    /**
     * "Masks" an object behind a public set of methods
     * @param {Object} obj The object to be masked behind this object
     * @param {Array} visible A list of method names that are visible in obj
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
    
    module.prototype.load = function(tileRegistry, terrainGenerator) {
        get(this.src, function(e) {
            this.extension = new Function(e.target.responseText).call(
                    {}, tileRegistry, terrainGenerator);
        });
    };
    
    return (module);
})();