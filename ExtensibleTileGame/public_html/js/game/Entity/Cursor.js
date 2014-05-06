var Cursor = (function() {
    var module = Util.extend(GameEngine.Entity, {
        constructor: function() {
            this.imgSrc = "img/cursor.png";
        }, update: function(delta) {
            if (this.game.input.mouse.button === GameEngine.CONST.MOUSE_LEFT)
                this.game.world.set(
                    this.game.tileRegistry.makeTile("air"),
                    this.x / this.game.world.imgResolution,
                    this.y / this.game.world.imgResolution);
        },
        render: function(ctx) {
            // Updates in the render function to avoid latency
            this.x = this.game.input.mouse.x - Math.round(
                this.game.canvas.width / 2 - this.game.viewFocus.x);
            this.y = this.game.input.mouse.y - Math.round(
                this.game.canvas.height / 2 - this.game.viewFocus.y);
                
            ctx.drawImage(this.img, this.x, this.y);
        }
    });
    
    return (module);
})();