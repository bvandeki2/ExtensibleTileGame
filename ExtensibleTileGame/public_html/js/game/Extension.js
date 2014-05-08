var Extension = (function() {
    var module = function() {
        
    };
    
    function get(src, callback) {
        var req = new XMLHttpRequest();
        
        req.onload = callback;
        
        req.open("GET", src);
        req.send();
    };
    
    module.prototype.load = function(tileRegistry, terrainGenerator) {
        get(this.src, function(e) {
            this.extension = eval.call({}, e.target.responseText,
                    tileRegistry, terrainGenerator);
        });
    };
    
    return (module);
})();