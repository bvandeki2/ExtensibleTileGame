// Evaluable module, used as a safer alternative to window.eval
// Currently only does basic math, with a few focused applications
// for the gane
var Evaluable = (function() {
    var module = function () {
        if (typeof arguments[0] === "number") {
            this.opr = "const";
            this.data = arguments[0];
        } else {
            this.opr = arguments[0];
            this.data = arguments[1];
        }
    };
    
    var noiseGenerators = {};
    function getNoise(x, y, id) {
        if (!noiseGenerators[id])
            noiseGenerators[id] = new SimplexNoise(Math);
        return (0.5 * (1 + noiseGenerators[id].noise(x, y)));
    }
    
    function process(val, x, y, ratio) {
        if (val === undefined)
            return (0);
        if (typeof val === "number") return val;
        return (val.eval(x, y, ratio));
    }
    
    module.prototype.eval = function (x, y, ratio) {
        switch (this.opr) {
            case "const":
                return (process(this.data, x, y, ratio));
            case "ratio":
                return (ratio);
            case "x":
                return (x);
            case "y":
                return (y);
            
            // Now for actual operands
            
            case "+":
                return (process(this.data.a, x, y, ratio) + 
                        process(this.data.b, x, y, ratio));
            case "*":
                return (process(this.data.a, x, y, ratio) * 
                        process(this.data.b, x, y, ratio));
            case "-":
                return (process(this.data.a, x, y, ratio) - 
                        process(this.data.b, x, y, ratio));
            case "/":
                return (process(this.data.a, x, y, ratio) / 
                        process(this.data.b, x, y, ratio));
            case "noise":
                var id, scale = 1;
                if (typeof this.data === "object") {
                    id = process(this.data.id, x, y, ratio);
                    scale = process(this.data.scale, x, y, ratio);
                } else
                    id = process(this.data, x, y, ratio);
                return (getNoise(x * scale, y * scale, id));
            case "lerp":
                var r = process(this.data.x, x, y, ratio);
                return ((1 - r) * process(this.data.a, x, y, ratio) +
                        (    r) * process(this.data.b, x, y, ratio));
            case "inrange":
                var x = process(this.data.x, x, y, ratio);
                return (process(this.data.a, x, y, ratio) <= x &&
                        process(this.data.b, x, y, ratio) > x ? 1 : 0);
        }
    };
    
    return (module);
})();