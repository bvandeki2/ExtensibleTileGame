/*
 * Game Engine v1.2
 * By bvande
 */

var Util = (function(self) {
	
	// Polyfill and utilities
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || 
                window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
        
        if (!Number.MAX_SAFE_INTEGER)
            Number.MAX_SAFE_INTEGER = 9007199254740991;
        if (!Number.MIN_SAFE_INTEGER)
            Number.MIN_SAFE_INTEGER = -9007199254740991;
	
        self.sign = function(x) {
            return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
        };
        
	self.inherit = function(subClass, superClass) {
		// Avoid recursion
		var sub = subClass;
		
		subClass = function() {
			superClass.apply(this, arguments);
			sub.apply(this, arguments);
		};
		
		// Inherit
		subClass.prototype = Object.create(superClass.prototype);
		
		return (subClass);
	};
	self.extend = function(superClass, props, ignoreSuperFunctions) {
		// Inherit super functions by default
		ignoreSuperFunctions = ignoreSuperFunctions || false;
		
		var subClass = function() {
			superClass.apply(this, arguments);
			if (props.constructor)
				props.constructor.apply(this, arguments);
		};
		
		subClass.prototype = Object.create(superClass.prototype);
		
		for(var key in props) {
			(function() {
				if (props.hasOwnProperty(key) && key !== "constructor") {
					if (typeof props[key] === "function" && !ignoreSuperFunctions) {
						// Inherit super function too, if it exists
						
                                                if (superClass.prototype[key]) {
                                                    // Combine
                                                    var myKey = key;
                                                    subClass.prototype[myKey] = function() {
                                                            if (superClass.prototype[myKey])
                                                                    superClass.prototype[myKey].apply(this, arguments);
                                                            props[myKey].apply(this, arguments);
                                                    };
                                                } else
                                                    subClass.prototype[key] = props[key];
					} else
						subClass.prototype[key] = props[key];
				}
			})();
		}
		
		return (subClass);
	};
	
	self.File = {
		TYPE_AUDIO: "AUDIO",
		TYPE_IMAGE: "IMAGE",
		
		getExtension: function(path) {
			return ((/(?:\.([A-Za-z0-9]+))?$/).exec(path)[1]);
		},
		getFormat: function(ext) {
			switch (ext) {
				case "png":
				case "gif":
				case "jpg":
				case "jpeg":
				case "bmp":
					return "IMAGE";
				case "mp3":
				case "wav":
				case "ogg":
					return "AUDIO";
				default:
					return;
			}
		}
	};
	
	return (self);
})(Util || {});

var GameEngine = (function(self) {
	"use strict";
	
	self.CONST = Object.freeze({
		MOUSE_NONE:	-1,
		MOUSE_LEFT:	0,
		MOUSE_RIGHT:	2,
		MOUSE_MIDDLE:	1
	});
	
	self.Game = function(settings) {
		settings = settings || {};
		
		this.canvas = settings.canvas || document.createElement("canvas");
		if (!this.canvas) {
			document.write("Your browser does not support the canvas element.");
		}
		
                if (!settings.canvas) {
                    this.canvas.width = settings.width || 640;
                    this.canvas.height = settings.height || 480;
                }
		
		this.input = new self.Input(this);
		this.res = new self.ResourceLoader();
		
		this.ctx = this.canvas.getContext("2d");
		this.fullscreen = settings.fullscreen || false;
		
		this.lastDate = new Date();
		this.entityHandler = new self.EntityHandler(this);
                
                this.viewFocus = {
                    x: 0, y: 0
                };
	};
	self.Game.prototype.start = function() {
                this.entityHandler.initEntities();
		this.tick();
	};
	self.Game.prototype.tick = function() {
                this.ctx.save();
		this.render();
                this.ctx.restore();
                
		// Calculate date and delta
		var newDate = new Date();
		var delta = newDate.getTime() - this.lastDate.getTime();
		
		// In case focus is lost, try not to have teleporting  entities.  Limit it to 10FPS delta calculation.
		delta = Math.min(delta, 100);
		
		this.update(delta);
		this.lastDate = newDate;
		
		window.requestAnimationFrame(this.tick.bind(this));
	};
	self.Game.prototype.update = function(delta) {
		this.preUpdate();
		this.entityHandler.update(delta);
	};
	self.Game.prototype.preUpdate = function() {
	};
	self.Game.prototype.render = function() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.translate(Math.round(this.canvas.width / 2 - this.viewFocus.x),
                                   Math.round(this.canvas.height / 2 - this.viewFocus.y), 0);
		this.entityHandler.render(this.ctx);
	};
        self.Game.prototype.setView = function(focusX, focusY) {
            this.viewFocus = {
                x: focusX, y: focusY
            };
        };
	
	self.Input = function(game) {
		this.resetInput();
                
                this.game = game;
		
                // Don't show the right-click menu on the canvas
		this.game.canvas.addEventListener("contextmenu", function(e) {
			e.preventDefault();
		});
		
		// Mouse events
		this.game.canvas.addEventListener("mouseleave", this.resetInput.bind(this));
		this.game.canvas.addEventListener("mousemove", function(e) {
			var bounds = this.game.canvas.getBoundingClientRect();
			this.mouse.x = e.clientX - bounds.left;
			this.mouse.y = e.clientY - bounds.top;
		}.bind(this));
		this.game.canvas.addEventListener("mousedown", function(e) {
			e.preventDefault();
			this.mouse.button = e.button;
		}.bind(this));
		this.game.canvas.addEventListener("mouseup", function(e) {
			this.mouse.button = self.CONST.MOUSE_NONE;
		}.bind(this));
                
                window.addEventListener("keydown", function(e) {
                        this.keyDown[e.keyCode] = true;
                }.bind(this));
                window.addEventListener("keyup", function(e) {
                        this.keyDown[e.keyCode] = false;
                }.bind(this));
	};
	self.Input.prototype.resetInput = function() {
		this.mouse = {x: -1, y: -1, button: self.CONST.MOUSE_NONE};
                
		this.keyDown = [];
	};
	
	self.ResourceLoader = function() {
		this.res = {};
		this.callback = function() {
			throw "No callback specified";
		};
	};
	self.ResourceLoader.prototype.require = function(src) {
                if (!src)
                    return;
		if (src instanceof Array) {
			for(var i = 0; i < src.length; i ++)
				this.require(src[i]);
		} else if (typeof src === "string") {
			var type = Util.File.getFormat(Util.File.getExtension(src));
                        
			switch (type) {
				case Util.File.TYPE_IMAGE:
				case Util.File.TYPE_AUDIO:
					this.res[src] = undefined;
					break;
				default:
					throw (src + " : " + (type) + " is not a valid type for ResourceLoader parsing");
			}
		} else {
			throw (src + " : " + (typeof src) + " is not a valid type for ResourceLoader parsing");
		}
	};
	self.ResourceLoader.prototype.load = function(callback) {
		this.callback = callback || this.callback;
		this.loadNext(Object.keys(this.res)[0]);
	};
	self.ResourceLoader.prototype.loadNext = function(current) {
		switch (Util.File.getFormat(Util.File.getExtension(current))) {
			case Util.File.TYPE_IMAGE:
					this.res[current] = new Image();
					
					this.res[current].onload = (function() {
						console.log("Loaded  " + current);
						var keys = Object.keys(this.res);
						var currentIndex = keys.indexOf(current);
						if (currentIndex + 1 !== keys.length)
							this.loadNext(keys[currentIndex + 1]);
						else
							this.callback();
					}).bind(this);
					this.res[current].src = current;
					console.log("Loading " + current);
					
					break;
				case Util.File.TYPE_AUDIO:
					this.res[src] = undefined;
					break;
		}
	};
	self.ResourceLoader.prototype.get = function(src) {
		return (this.res[src]);
	};
	
	self.EntityHandler = function(game) {
		this.subsets = {};
		this.collisionSubsets = [];
		
		this.game = game;
		
		this.toRemove = [];
		
		this.defaultSubset = "default";
		this.addSubset(this.defaultSubset);
	};
	self.EntityHandler.prototype.addSubset = function(id) {
		this.subsets[id] = {};
	};
	self.EntityHandler.prototype.addEntity = function(entity, subsetId) {
		subsetId = subsetId || this.defaultSubset;
		
		if (this.subsets[subsetId][entity.uuid] !== undefined) {
			throw "Entity already defined: (" + typeof entity + '@' + entity.uuid + ") in subset " + subsetId;
			return;
		}
		// Registration time!
		entity.entityHandler = this;
		entity.game = this.game;
                
                // Load image
                if (entity.imgSrc)
                    this.game.res.require(entity.imgSrc);
                
		this.subsets[subsetId][entity.uuid] = entity;
	};
        self.EntityHandler.prototype.initEntities = function() {
            for(var subset in this.subsets)
			for(var entity in (this.subsets[subset]))
				this.subsets[subset][entity].init();
        };
	self.EntityHandler.prototype.removeEntity = function(entityId, subsetId) {
		subsetId = subsetId || this.defaultSubset;

		// Mark for deletion
		this.subsets[subsetId][entityId].exists = false;
		this.toRemove.push({
			"subsetId": subsetId,
			"entityId": entityId });
	};
	self.EntityHandler.prototype.addCollisionSubset = function(subsetA, subsetB) {
                // If an entity of subsetA collides with one of subsetB, then subsetA entity has onCollision called
		this.collisionSubsets.push({"a": subsetA, "b": subsetB});
	};
	self.EntityHandler.prototype.update = function(delta) {
		// Remove entities marked for deletion
		while (this.toRemove.length > 0) {
			var toRemoveData = this.toRemove.pop();
			delete this.subsets[toRemoveData.subsetId][toRemoveData.entityId];
		}
		
		for(var subset in this.subsets) {
			for(var entity in (this.subsets[subset])) {
				var e = this.subsets[subset][entity];
				e.update(delta);
				if (e.dynamic)
					e.bounds.setCenter(e.x, e.y);
			}
		}
		
		for(var i = 0; i < this.collisionSubsets.length; i ++) {
			this.handleCollisions(this.collisionSubsets[i].a, this.collisionSubsets[i].b);
		}
	};
	self.EntityHandler.prototype.handleCollisions = function(subsetA, subsetB) {
		for(var entityAKey in (this.subsets[subsetA])) {
			for(var entityBKey in (this.subsets[subsetB])) {
				var entityA = this.subsets[subsetA][entityAKey],
					entityB = this.subsets[subsetB][entityBKey];
				// Ensure they are different
				if (entityA.uuid === entityB.uuid)
					continue;
				
				if (entityA.bounds.intersects(entityB.bounds))
					entityA.onCollision(entityB);
			}
		}
	};
	self.EntityHandler.prototype.render = function(ctx) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		for(var subset in this.subsets) {
			for(var entity in (this.subsets[subset])) {
				this.subsets[subset][entity].render(ctx);
			}
		}
	};

	// TODO: http://jsfiddle.net/briguy37/2MVFd/
	self.generateUUID = function() {
		var d = new Date().getTime();
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (c==='x' ? r : (r&0x7|0x8)).toString(16);
		});
		return uuid;
	};

	self.Entity = function() {
		this.x = 0;
		this.y = 0;
                
                // Dynamic entities automatically update their collision bounds
		this.dynamic = true;
                
		this.uuid = self.generateUUID();
		this.bounds = new self.CircleBounds();
		
		this.game = undefined;
		this.entityHandler = undefined;
		
		this.exists = true;
	};
	self.Entity.prototype.update = function(delta) {
	};
	self.Entity.prototype.render = function(ctx) {
	};
	self.Entity.prototype.onCollision = function(other) {
	};
	self.Entity.prototype.init = function() {
            if (this.imgSrc)
                this.img = this.game.res.get(this.imgSrc);
	};
	
	self.CircleBounds = function(args) {
		args = args || {};
		this.x = args.x || 0;
		this.y = args.y || 0;
		this.radius = args.radius || 16;
	};
	self.CircleBounds.prototype.setCenter = function(x, y) {
		this.x = x;
		this.y = y;
	};
	self.CircleBounds.prototype.intersects = function(otherBounds) {
		if (otherBounds instanceof self.CircleBounds) {
			var distSqr = (otherBounds.x - this.x) * (otherBounds.x - this.x) + 
						  (otherBounds.y - this.y) * (otherBounds.y - this.y);
			return (distSqr <= (otherBounds.radius + this.radius) * (otherBounds.radius + this.radius));
		} else {
			console.log("Error: " + typeof otherBounds + " does not have collision calculation code with CircleBounds.");
		}
	};
	self.CircleBounds.prototype.contains = function(x, y) {
		return ((this.x - x) * (this.x - x) + (this.y - y) * (this.y - y) <= this.radius * this.radius);
	};
	
	self.RectangleBounds = function(args) {
		args = args || {};
		this.x = args.x || 0;
		this.y = args.y || 0;
		this.width = args.width || 32;
		this.height = args.height || 32;
	};
	self.RectangleBounds.prototype.intersects = function(otherBounds) {
		if (otherBounds instanceof self.RectangleBounds) {
			return (this.x + this.width >= otherBounds.x && otherBounds.x + otherBounds.width >= this.x &&
					this.y + this.height >= otherBounds.y && otherBounds.y + otherBounds.height >= this.y);
		} else {
			console.log("Error: " + typeof otherBounds + " does not have collision calculation code with RectangleBounds.");
		}
	};
	self.RectangleBounds.prototype.contains = function(x, y) {
		return (x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height);
	};
	
	return (self);
})(GameEngine || {});