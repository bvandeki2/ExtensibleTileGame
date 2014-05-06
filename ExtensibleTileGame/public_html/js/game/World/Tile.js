// Note: Tiles are usually numbers, unless they need to have extra data
// associated with them, such as inventory space
var Tile = (function() {
    var module = function(id, data) {
        this.id = id;
        this.data = data;
    };
    
    return (module);
})();