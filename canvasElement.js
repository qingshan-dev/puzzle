define('canvasElement', [ 'jquery'], function(S) {
var Canvas = window.Canvas || {};
(function () {
    Canvas.Element = function() {};   
    Canvas.Element.prototype.fillBackground = true;
    Canvas.Element.prototype.showcorners = false;
    Canvas.Element.prototype.photoborder = true;
    Canvas.Element.prototype.polaroid = false;
    Canvas.Element.prototype._backgroundImg = null;
    Canvas.Element.prototype._groupSelector = null;
    Canvas.Element.prototype._aImages = null;
    Canvas.Element.prototype._oContext = null;
    Canvas.Element.prototype._oElement = null;
    Canvas.Element.prototype._oConfig = null;
    Canvas.Element.prototype._currentTransform = null;
    Canvas.Element.prototype._prevTransform = null;
    Canvas.Element.prototype.curAngle = null;
    Canvas.Element.prototype.init = function(el, oConfig) {
        if (el == '') {
            return;
        }
        this._initElement(el);
        this._initConfig(oConfig);
        this._createCanvasBackground();
        this._createContainer();
        this._initEvents();
        this._initCustomEvents();
    };
    Canvas.Element.prototype._initElement = function(el) {
        this._oElement = document.getElementById(el);
        this._oContextTop = this._oElement.getContext('2d');
    };
    Canvas.Element.prototype._initCustomEvents = function() {
        this.onRotateStart = new Canvas.CustomEvent('onRotateStart');
        this.onRotateMove = new Canvas.CustomEvent('onRotateMove');        
        this.onRotateComplete = new Canvas.CustomEvent('onRotateComplete');
        this.onDragStart = new Canvas.CustomEvent('onDragStart');    
        this.onDragMove = new Canvas.CustomEvent('onDragMove');
        this.onDragComplete = new Canvas.CustomEvent('onDragComplete');
    };
    Canvas.Element.prototype._initConfig = function(oConfig) {
        this._oConfig = oConfig;
        this._oElement.width = this._oConfig.width;
        this._oElement.height = this._oConfig.height;
        this._oElement.style.width = this._oConfig.width + 'px';
        this._oElement.style.height = this._oConfig.height + 'px';
    };
    Canvas.Element.prototype._initEvents = function() {
        var _this=this;
        S(this._oElement).on('mousedown',function(e){
             _this.onMouseDown(e);
        });
        S(this._oElement).on( 'mouseup', function(e){
            _this.onMouseUp(e);
        });
        S(this._oElement).on('mousemove', function(e){
            _this.onMouseMove(e);
        });
    };
    Canvas.Element.prototype._createContainer = function() {
        var canvasEl = document.createElement('canvas');
        canvasEl.id = this._oElement.id + '-canvas-container';
        var oContainer = this._oElement.parentNode.insertBefore(canvasEl, this._oElement);
        oContainer.width = this._oConfig.width;
        oContainer.height = this._oConfig.height;
        oContainer.style.width = this._oConfig.width + 'px';
        oContainer.style.height = this._oConfig.height + 'px';
        this._oContextContainer = oContainer.getContext('2d'); 
    };
    Canvas.Element.prototype._createCanvasBackground = function() {
        var canvasEl = document.createElement('canvas');
        canvasEl.id = this._oElement.id + '-canvas-background';
        var oBackground = this._oElement.parentNode.insertBefore(canvasEl, this._oElement);
        oBackground.width = this._oConfig.width;
        oBackground.height = this._oConfig.height;
        oBackground.style.width = this._oConfig.width + 'px';
        oBackground.style.height = this._oConfig.height + 'px';
        this._oContextBackground = oBackground.getContext('2d'); 
    };
    Canvas.Element.prototype.setCanvasBackground = function(oImg) {
        this._backgroundImg = oImg;
        var originalImgSize = oImg.getOriginalSize();
        this._oContextBackground.drawImage(oImg._oElement, 0, 0, originalImgSize.width, originalImgSize.height);
    };
    Canvas.Element.prototype.onMouseUp = function(e) {
        if (this._aImages == null) {
            return;
        }
        if (this._currentTransform) {
            this._currentTransform.target.setImageCoords();
        }
        if (this._currentTransform != null && this._currentTransform.action == "rotate") {
            this.onRotateComplete.fire(e);
        } else if (this._currentTransform != null && this._currentTransform.action == "drag") {
            this.onDragComplete.fire(e);
        }
        this._currentTransform = null;
        this._groupSelector = null;
        this.renderTop();
    };
    Canvas.Element.prototype.onMouseDown = function(e) {
        var mp = this.findMousePosition(e);
        if (this._currentTransform != null || this._aImages == null) {
            return;
        }
        var oImg = this.findTargetImage(mp, false);
        if (!oImg) {
            this._groupSelector = { ex: mp.ex, ey: mp.ey,
                                     top: 0, left: 0 };
        }
        else { 
            var action = (!this.findTargetCorner(mp, oImg)) ? 'drag' : 'rotate';
            if (action == "rotate") {
                this.onRotateMove.fire(e);
            } else if (action == "drag") {
                this.onDragMove.fire(e);
            }
            this._prevTransform=this._currentTransform = { 
                target: oImg,
                action: action,
                scalex: oImg.scalex,
                offsetX: mp.ex - oImg.left,
                offsetY: mp.ey - oImg.top,
                ex: mp.ex, ey: mp.ey,
                left: oImg.left, top: oImg.top,
                theta: oImg.theta 
            };
          /*  $('#canvas_menu').css('transform','rotate('+oImg.theta*180/3.14+'deg)');
            $('#canvas_menu').css('left',oImg.left+"px");
            $('#canvas_menu').css('top', oImg.top+"px");
            $('#canvas_menu').css('display','block');*/
            this.renderAll(false,false);
        }
        /*if (this._currentTransform == null){
        	$('#canvas_menu').css('display','none');
        }*/
    };
    Canvas.Element.prototype.onMouseMove = function(e) {
        var mp = this.findMousePosition(e);
        if (this._aImages == null) {
            return;
        }
        if (this._groupSelector != null) {
            this._groupSelector.left = mp.ex - this._groupSelector.ex;
            this._groupSelector.top = mp.ey - this._groupSelector.ey;
            this.renderTop();
        }
        else if (this._currentTransform == null) {
            var targetImg = this.findTargetImage(mp, true);
            this.setCursor(mp, targetImg);
        }
        else {
            if (this._currentTransform.action == 'rotate') {
                this.rotateImage(mp);
                this.scaleImage(mp);
                this.onRotateMove.fire(e);
            }        
            else {
                this.translateImage(mp);
                this.onDragMove.fire(e);
            }
            this.renderTop();
        }        
    };
    Canvas.Element.prototype.translateImage = function(mp) {
        this._currentTransform.target.left = mp.ex - this._currentTransform.offsetX;
        this._currentTransform.target.top = mp.ey - this._currentTransform.offsetY;
        /*$('#canvas_menu').css('left',this._currentTransform.target.left+"px");
        $('#canvas_menu').css('top',this._currentTransform.target.top +"px");*/
    };
    Canvas.Element.prototype.scaleImage = function(mp) {
        var lastLen = 
            Math.sqrt(Math.pow(this._currentTransform.ey - this._currentTransform.top, 2) +
            Math.pow(this._currentTransform.ex - this._currentTransform.left, 2));
        var curLen = 
            Math.sqrt(Math.pow(mp.ey - this._currentTransform.top, 2) +
            Math.pow(mp.ex - this._currentTransform.left, 2));
        var curScalex= this._currentTransform.scalex * (curLen / lastLen);
        var curScaley=this._currentTransform.target.scalex;
        if(curScalex>0.7&&curScaley>0.7){
            this._currentTransform.target.scalex =curScalex;
            this._currentTransform.target.scaley = curScaley;
        }
    };
    Canvas.Element.prototype.rotateImage = function(mp) {
        var lastAngle = Math.atan2(
                this._currentTransform.ey - this._currentTransform.top,
                this._currentTransform.ex - this._currentTransform.left
        );
        
        var curAngle = Math.atan2(
            mp.ey - this._currentTransform.top,
            mp.ex - this._currentTransform.left
        );
        this._currentTransform.target.theta = (curAngle - lastAngle) + this._currentTransform.theta;
        this.curAngle=this._currentTransform.target.theta*180/3.14;
//      $('#canvas_menu').css('transform','rotate('+this.curAngle+'deg)');
    };
    Canvas.Element.prototype.setCursor = function(mp, targetImg) {
//  	debugger ;
        if (!targetImg) {
            this._oElement.style.cursor = 'default';
        }
        else { 
            var corner = this.findTargetCorner(mp, targetImg);
            if (!corner) 
            {
                this._oElement.style.cursor = 'default';
            }
            else
            {
                if(corner == 'tr') {
                    this._oElement.style.cursor = 'ne-resize';
                }
                else if(corner == 'br') {
                    this._oElement.style.cursor = 'se-resize';
                }
                else if(corner == 'bl') {
                    this._oElement.style.cursor = 'sw-resize';
                }
                else if(corner == 'tl') {
                    this._oElement.style.cursor = 'nw-resize';
                }                                    
                else {
                    this._oElement.style.cursor = 'default';
                }
            }
        }
    };
    Canvas.Element.prototype.addImage = function(oImg) {
        if(S.isEmptyObject(this._aImages)) {
            this._aImages = [];
        }
        this._aImages.push(oImg);
        this.renderAll(false,true);

    };
    Canvas.Element.prototype.renderAll = function(allOnTop,allowCorners) {
        var containerCanvas = (allOnTop) ? this._oContextTop : this._oContextContainer;
        this._oContextTop.clearRect(0,0,parseInt(this._oConfig.width), parseInt(this._oConfig.height));
        containerCanvas.clearRect(0,0,parseInt(this._oConfig.width), parseInt(this._oConfig.height));
        if (allOnTop) {
            var originalImgSize = this._backgroundImg.getOriginalSize();
            this._oContextTop.drawImage(this._backgroundImg._oElement, 0, 0, originalImgSize.width, originalImgSize.height);
        }
            for (var i = 0, l = this._aImages.length-1; i < l; i += 1) {
                this.drawImageElement(containerCanvas, this._aImages[i],allowCorners);            
            }
            this.drawImageElement(this._oContextTop, this._aImages[this._aImages.length-1],allowCorners);
    };
    Canvas.Element.prototype.renderTop = function() {
        this._oContextTop.clearRect(0,0,parseInt(this._oConfig.width), parseInt(this._oConfig.height));
        this.drawImageElement(this._oContextTop, this._aImages[this._aImages.length-1],true);
        if (this._groupSelector != null) {
            this._oContextTop.fillStyle = "rgba(0, 0, 200, 0.5)";
            this._oContextTop.fillRect(
                this._groupSelector.ex - ((this._groupSelector.left > 0) ?
                    0 : - this._groupSelector.left), 
                this._groupSelector.ey - ((this._groupSelector.top > 0) ? 
                    0 : - this._groupSelector.top), 
                Math.abs(this._groupSelector.left), 
                Math.abs(this._groupSelector.top)
            );
            this._oContextTop.strokeRect(
                this._groupSelector.ex - ((this._groupSelector.left > 0) ? 
                    0 : Math.abs(this._groupSelector.left)), 
                this._groupSelector.ey - ((this._groupSelector.top > 0) ? 
                    0 : Math.abs(this._groupSelector.top)), 
                Math.abs(this._groupSelector.left), 
                Math.abs(this._groupSelector.top)
            );
        }
    };
    Canvas.Element.prototype.drawImageElement = function(context, oImg,allowCorners) {
		if(!oImg){return ;}
        oImg.cornervisibility=allowCorners;
        var offsetY = oImg.height / 2;
        var offsetX = oImg.width / 2;
        context.save();
        context.translate(oImg.left, oImg.top);
        context.rotate(oImg.theta);
        context.scale(oImg.scalex, oImg.scaley);
        this.drawBorder(context, oImg, offsetX, offsetY);
        var originalImgSize = oImg.getOriginalSize();
        var polaroidHeight = ((oImg.height - originalImgSize.height) - (oImg.width - originalImgSize.width))/2;
        context.drawImage(
            oImg._oElement, 
            - originalImgSize.width/2,  
            ((- originalImgSize.height)/2 - polaroidHeight), 
            originalImgSize.width, 
            originalImgSize.height
        );
        if (oImg.cornervisibility) {
            this.drawCorners(context, oImg, offsetX, offsetY);
        }
        context.restore();
    };
    Canvas.Element.prototype._getImageLines = function(oCoords) {
        return {
            topline: { 
                o: oCoords.tl,
                d: oCoords.tr 
            },
            rightline: { 
                o: oCoords.tr,
                d: oCoords.br 
            },
            bottomline: { 
                o: oCoords.br,
                d: oCoords.bl 
            },
            leftline: { 
                o: oCoords.bl,
                d: oCoords.tl 
            }
        };
    };
    Canvas.Element.prototype.findTargetImage = function(mp, hovering) {
        for (var i = this._aImages.length-1; i >= 0; i -= 1) {
            var iLines = this._getImageLines(this._aImages[i].oCoords);
            var xpoints = this._findCrossPoints(mp, iLines);
            if (xpoints % 2 == 1 && xpoints != 0) {
                var target = this._aImages[i];
                if (!hovering) {
                    this._aImages.splice(i, 1);
                    this._aImages.push(target);
                }
                return target;
            }
        }
        return false;
    };    
    Canvas.Element.prototype._findCrossPoints = function(mp, oCoords) {
        var b1, b2, a1, a2, xi, yi;
        var xcount = 0;
        var iLine = null;
        for (lineKey in oCoords) {
            iLine = oCoords[lineKey];
            if ((iLine.o.y < mp.ey) && (iLine.d.y < mp.ey)) {
                continue;
            }
            if ((iLine.o.y >= mp.ey) && (iLine.d.y >= mp.ey)) {
                continue;
            }
            if ((iLine.o.x == iLine.d.x) && (iLine.o.x >= mp.ex)) { 
                xi = iLine.o.x;
                yi = mp.ey;
            }
            else {
                b1 = 0; 
                b2 = (iLine.d.y-iLine.o.y)/(iLine.d.x-iLine.o.x); 
                a1 = mp.ey-b1*mp.ex;
                a2 = iLine.o.y-b2*iLine.o.x;
                xi = - (a1-a2)/(b1-b2); 
                yi = a1+b1*xi; 
            }
            if (xi >= mp.ex) { 
                xcount += 1;
            }
            if (xcount == 2) {
                break;
            }
        }
        return xcount;
    };
    Canvas.Element.prototype.findTargetCorner = function(mp, oImg) {
        var xpoints = null;
        var corners = ['tl','tr','br','bl'];
        for (var i in oImg.oCoords) {
            xpoints = this._findCrossPoints(mp, this._getImageLines(oImg.oCoords[i].corner));
            if (xpoints % 2 == 1 && xpoints != 0) {
                return i;
            }        
        }
        return false;
    };
    Canvas.Element.prototype.findMousePosition = function(e) {
    	var _box = e.currentTarget.getBoundingClientRect(); //获得cvs元素相对于浏览器圆点的坐标
		var cvs = e.currentTarget;
		return {
			ex: e.clientX - _box.left,
			ey: e.clientY - _box.top,
			screenX: e.screenX,
			screenY: e.screenY
		}
       /* var parentNode = (e.srcElement) ? e.srcElement.parentNode : e.target.parentNode;
        var isSafari2 = !S.support.ie&&!S.support.firefox;
        var scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft;
        var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        var safariOffsetLeft = (isSafari2) ? e.target.ownerDocument.body.offsetLeft + scrollLeft : 0;
        var safariOffsetTop = (isSafari2) ? e.target.ownerDocument.body.offsetTop + scrollTop : 0;
        return {
            ex: e.clientX + scrollLeft - parentNode.offsetLeft - safariOffsetLeft,
            ey: e.clientY + scrollTop - parentNode.offsetTop - safariOffsetTop,
            screenX: e.screenX,
            screenY: e.screenY
        };*/
    };
    Canvas.Element.prototype.drawBorder = function(context, oImg, offsetX, offsetY) {
        var outlinewidth = 2;
        context.fillStyle = 'rgba(0, 0, 0, .3)';
        context.fillRect(-2 - offsetX, -2 - offsetY, oImg.width + (2 * outlinewidth), oImg.height + (2 * outlinewidth));
        context.fillStyle = '#fff';
        context.fillRect(-offsetX, -offsetY, oImg.width, oImg.height);
    };
    Canvas.Element.prototype.drawCorners = function(context, oImg, offsetX, offsetY) {
        context.fillStyle = "rgba(0, 200, 50, 0.5)";
        context.fillRect(-offsetX, -offsetY, oImg.cornersize, oImg.cornersize);
        context.fillRect(oImg.width - offsetX - oImg.cornersize, -offsetY, oImg.cornersize, oImg.cornersize);
        context.fillRect(-offsetX, oImg.height - offsetY - oImg.cornersize, oImg.cornersize, oImg.cornersize);
        context.fillRect(oImg.width - offsetX - oImg.cornersize, oImg.height - offsetY - oImg.cornersize, oImg.cornersize, oImg.cornersize);
    };
    Canvas.Element.prototype.clearCorners = function(context, oImg, offsetX, offsetY) {
        context.clearRect(-offsetX, -offsetY, oImg.cornersize, oImg.cornersize);
        context.clearRect(oImg.width - offsetX - oImg.cornersize, -offsetY, oImg.cornersize, oImg.cornersize);
        context.clearRect(-offsetX, oImg.height - offsetY - oImg.cornersize, oImg.cornersize, oImg.cornersize);
        context.clearRect(oImg.width - offsetX - oImg.cornersize, oImg.height - offsetY - oImg.cornersize, oImg.cornersize, oImg.cornersize);
        context.restore();
    };
    Canvas.Element.prototype.canvasTo = function(format) {
        this.renderAll(true,false);
        var containerCanvas =this._oContextTop;
        for (var i = 0, l = this._aImages.length; i < l; i += 1) {
            var offsetY = this._aImages[i].height / 2;
            var offsetX = this._aImages[i].width / 2;
            this.clearCorners(containerCanvas, this._aImages[i], offsetX, offsetY);
        }
        if (format == 'jpeg' || format == 'png') {
            return this._oElement.toDataURL('image/'+format);
        }
    };    
    Canvas.CustomEvent = function(type) {
        this.type = type;
        this.scope = null;
        this.handler = null;
        var self = this;
        this.fire = function(e) {
            if(this.handler != null) {
                self.handler.call(self.scope, e);
            }
        };
    };    
}());
return Canvas;
});