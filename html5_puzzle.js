require([ 'jquery', 'canvasImg', 'canvasElement' ], function(
        S, canvasImg, canvasElement) {
    var img=[];
    var canvas = new canvasElement.Element();
    canvas.init('canvid1', {
        width : 800,
        height : 600
    });
    S('.puzzle_column img').on('click',function(e){
        var index=this.getAttribute('data-index');
        $('#bg').load(function() {
            var ctx=$('#canvid1-canvas-background').get(0).getContext('2d');
            ctx.clearRect(0, 0,800,600);
            img[0]=new canvasImg.Img($('#bg').get(0), {});
            canvas.setCanvasBackground(img[0]);
        });
        $('#bg').attr('src','img/'+index+'.jpg');
        e.stopPropagation();
    });
    S(document).ready(function(){
	  setBg(1);
	});
	function setBg(index){
        $('#bg').load(function() {
            var ctx=$('#canvid1-canvas-background').get(0).getContext('2d');
            ctx.clearRect(0, 0,800,600);
            img[0]=new canvasImg.Img($('#bg').get(0), {});
            canvas.setCanvasBackground(img[0]);
        });
        $('#bg').attr('src','img/'+index+'.jpg');
	}
    var CanvasDemo = function() {
        return {
            init : function() {
                var img_list=dom.query('#puzzle_canvas img');
                img[0]=new canvasImg.Img($('bg'), {});
                S.each(img_list,function(i,el){
                        el.setAttribute('data-index',i);
                        img.push(new canvasImg.Img(el, {}));
                        canvas.addImage(img[i+1]);
                });
                canvas.setCanvasBackground(img[0]);
                this.cornersvisible = (this.cornersvisible) ? false : true;
                this.modifyImages(function(image) {
                    image.setCornersVisibility(this.cornersvisible);
                });
            },
            modifyImages : function(fn) {
                for ( var i =0, l = canvas._aImages.length; i < l; i += 1) {
                    fn.call(this, canvas._aImages[i]);
                }
                canvas.renderAll(false,false);
                S('#puzzle_canvas img').remove();
                img = [];
            }
        };
    }();
    function getCurImg(){
        var oImg=canvas._prevTransform.target;
        console.clear();
        console.info("_prevTransform", oImg);
        console.info("_currentTransform", canvas._currentTransform);
        for(var i=0;i<canvas._aImages.length;i++){
	        console.info("uuids", canvas._aImages[i]._oElement.uuid, canvas._aImages[i]._oElement.src);
        }
        for(var i=0;i<canvas._aImages.length;i++){
	        if(canvas._aImages[i]._oElement.uuid==oImg._oElement.uuid){
	            return i;
	        }
        }
        return null;
    }
    S('#photo_delete').on('click',function(e){
        var i=getCurImg();
        canvas._aImages.splice(i,1);
        canvas.renderAll(true,true);
        $('#canvas_menu').css('display','none');
    });
    S('#photo_update').on('click',function(e){
        $('#test').click();
    });
    $("#canvas_menu").on("click mousedown mouseup select", function(e){
    	console.error("canvas_menu click", e);
	    canvas.onMouseUp(e);
	    e.stopPropagation();
	});
    S('#fileImage').on('change',function(e){
    	var target = e.target || e.dataTransfer;
    	var files = e.target.files || e.dataTransfer.files;
        for (var i = 0; i < files.length; i++) {
        	var ff = files[i];
        	var reader = new FileReader();
			reader.onload = (function() {
				return function(e) {
					var uuid = Math.uuid();
					var dataURL = e.target.result,
						canvas1 = document.querySelector('#test_canvas'),
						ctx = canvas1.getContext('2d'),
						img = new Image();
						img.uuid = uuid;
					img.onload = function(e) {
						canvas1.width = img.width;
						canvas1.height = img.height;
						ctx.drawImage(img, 0, 0, img.width, img.height);
						S('#canvid1').html(S('#canvid1').html() + "<img src='" + canvas1.toDataURL("image/jpeg") + "'/>");
						var imgs = $('#canvid1 img').get(0);
						imgs.width = img.width;
						imgs.height = img.height;
						imgs.uuid = uuid;
						if (img.width > 200 || img.height > 200) {
							var prop = Math.min(200 / img.width, 200 / img.height);
							imgs.width = img.width * prop;
							imgs.height = img.height * prop;
						}
						var imgss = new canvasImg.Img(imgs, {});
						if(S.isEmptyObject(canvas._aImages)) {
				            canvas._aImages = [];
				        }
						canvas._aImages.push(imgss);
						S('#canvid1 img').remove();
					    canvas.renderAll(false,true);
					    document.getElementById("fileImage").value='';
					};
					img.src = dataURL;
				};
			})();
	        reader.readAsDataURL(files[i]);
	       }
    });
    S('#test').on('change',function(e){
        var files = e.target.files || e.dataTransfer.files;
        for (var i = 0; i < files.length; i++) {
        	var ff = files[i];
        	var reader = new FileReader();
			reader.onload = (function() {
				return function(e) {
					var ii=getCurImg(),target=canvas._prevTransform.target;
				    console.log(ii, target);
				    if(ii == null){
				    	console.error("当前指定的图片不存在99", ii, target);
				    	console.dir(canvas._aImages);
				    	return ;
				    }
					var uuid = Math.uuid();
					var dataURL = e.target.result,
						canvas1 = document.querySelector('#test_canvas'),
						ctx = canvas1.getContext('2d'),
						img = new Image();
						img.uuid = uuid;
					img.onload = function(e) {
						canvas1.width = img.width;
						canvas1.height = img.height;
						ctx.drawImage(img, 0, 0, img.width, img.height);
						S('#canvid1').html(S('#canvid1').html() + "<img src='" + canvas1.toDataURL("image/jpeg") + "'/>");
						var imgs = $('#canvid1 img').get(0);
						imgs.width = img.width;
						imgs.height = img.height;
						imgs.uuid = uuid;
						if (img.width > 200 || img.height > 200) {
							var prop = Math.min(200 / img.width, 200 / img.height);
							imgs.width = img.width * prop;
							imgs.height = img.height * prop;
						}
					    var ii=getCurImg(),target=canvas._prevTransform.target;
					    console.log(ii, target);
					    if(ii == null){
					    	console.error("当前指定的图片不存在", ii, target);
					    	console.dir(canvas._aImages);
					    	return ;
					    }
					    var imgss = new canvasImg.Img(imgs, {
					        top:target.top,
					        left:target.left,
					        scalex:target.scalex,
					        scaley:target.scaley,
					        angle:canvas.curAngle
					    });
					    var a_uuids = "";
					    for(var i=0;i<canvas._aImages.length;i++){
					        a_uuids +=","+canvas._aImages[i]._oElement.uuid;
				        }
					    console.info('before', canvas._aImages.length, a_uuids);
					    //canvas._aImages.splice(ii, 1, imgss);
					    canvas._aImages.splice(ii, 1);
					    canvas._aImages.push(imgss);
					    var b_uuids = "";
					    for(var i=0;i<canvas._aImages.length;i++){
					        b_uuids +=","+canvas._aImages[i]._oElement.uuid;
				        }
					    console.info('after', canvas._aImages.length,b_uuids);
					    console.info(ii, canvas._aImages[ii], target, uuid);
					    canvas.renderTop();
					    canvas._prevTransform= { 
			                target: imgss
			            };
//					    canvas._currentTransform = { 
//			                target: imgss,
//			            };
                   		//canvas._aImages.push(imgss);
					    //canvas.renderTop();
					    //canvas.renderAll(false,false);
					    //canvas.renderIndex(ii);
					    //canvas.renderAll(false,true);
					    S('#canvid1 img').remove();
//					    document.getElementById("test").value='';
					};
					img.src = dataURL;
				};
			})();
	        reader.readAsDataURL(files[i]);
	        
        }
        
    });
    S('#upload_btn').on('click',function(){
        var imgData = canvas.canvasTo('jpeg');
        //var imgValue = imgData.substr(22);
//      S.ajax({
//          url : 'http://localhost/html5/upload1.php',
//          type : 'POST',
//          data : {
//              imgData : imgValue,
//              file_name :'mix_img.jpeg'
//          },
//          dataType : 'text',
//          success : function(data) {
//              alert("s");
//          }
//      });
    });
});