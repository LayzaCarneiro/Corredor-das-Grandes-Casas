var teximg = [];
var texSrc = ["gato.jpg", "cachorro.png"];
var loadTexs = 0;
var gl;
var prog;

var angle = 0;

function getGL(canvas)
{
    var gl = canvas.getContext("webgl");
    if(gl) return gl;
    
    gl = canvas.getContext("experimental-webgl");
    if(gl) return gl;
    
    alert("Contexto WebGL inexistente! Troque de navegador!");
    return false;
}

function createShader(gl, shaderType, shaderSrc)
{
	var shader = gl.createShader(shaderType);
	gl.shaderSource(shader, shaderSrc);
	gl.compileShader(shader);
	
	if(gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		return shader;
	
	alert("Erro de compilação: " + gl.getShaderInfoLog(shader));
	
	gl.deleteShader(shader);
}

function createProgram(gl, vtxShader, fragShader)
{
	var prog = gl.createProgram();
	gl.attachShader(prog, vtxShader);
	gl.attachShader(prog, fragShader);
	gl.linkProgram(prog);
	
	if(gl.getProgramParameter(prog, gl.LINK_STATUS))
		return prog;

    alert("Erro de linkagem: " + gl.getProgramInfoLog(prog));
	
	gl.deleteProgram(prog);	
}

function init()
{
    for(i = 0; i < texSrc.length; i++)
    {
        teximg[i] = new Image();
        teximg[i].src = texSrc[i];
        teximg[i].onload = function()
        {
            loadTexs++;
    	    loadTextures();
        }
    }
}

function loadTextures()
{
    if(loadTexs == texSrc.length)
    {
       initGL();
       configScene();
       draw();
    }
}
    
function initGL()
{

	var canvas = document.getElementById("glcanvas1");
	
	gl = getGL(canvas);
	if(gl)
	{
        //Inicializa shaders
 		var vtxShSrc = document.getElementById("vertex-shader").text;
		var fragShSrc = document.getElementById("frag-shader").text;

        var vtxShader = createShader(gl, gl.VERTEX_SHADER, vtxShSrc);
        var fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragShSrc);
        prog = createProgram(gl, vtxShader, fragShader);	
        
        gl.useProgram(prog);

        //Inicializa área de desenho: viewport e cor de limpeza; limpa a tela
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

    }
}    

function configScene()
{    
        //Define coordenadas dos triângulos
        var coordTriangles = new Float32Array([
        									 -0.5,  0.5, 0.0, 0.0, 
        									 -0.5, -0.5, 0.0, 1.0, 
        									  0.5, -0.5, 1.0, 1.0,
        									  0.5,  0.5, 1.0, 0.0, 
        									 -0.5,  0.5, 0.0, 0.0
        									 ]);
        									
        //Cria buffer na GPU e copia coordenadas para ele
        var bufPtr = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufPtr);
        gl.bufferData(gl.ARRAY_BUFFER, coordTriangles, gl.STATIC_DRAW);
        
        //Pega ponteiro para o atributo "position" do vertex shader
        var positionPtr = gl.getAttribLocation(prog, "position");
        gl.enableVertexAttribArray(positionPtr);
        //Especifica a cópia dos valores do buffer para o atributo
        gl.vertexAttribPointer(positionPtr, 
        					   2,        //quantidade de dados em cada processamento
        					   gl.FLOAT, //tipo de cada dado (tamanho)
        					   false,    //não normalizar
        					   4*4,      //tamanho do bloco de dados a processar em cada passo
        					             //0 indica que o tamanho do bloco é igual a tamanho
        					             //lido (2 floats, ou seja, 2*4 bytes = 8 bytes)
        					   0         //salto inicial (em bytes)
        					  );
        
        var texcoordPtr = gl.getAttribLocation(prog, "texCoord");
        gl.enableVertexAttribArray(texcoordPtr);
        //Especifica a cópia dos valores do buffer para o atributo
        gl.vertexAttribPointer(texcoordPtr, 
        					   2,        //quantidade de dados em cada processamento
        					   gl.FLOAT, //tipo de cada dado (tamanho)
        					   false,    //não normalizar
        					   4*4,      //tamanho do bloco de dados a processar em cada passo
        					             //0 indica que o tamanho do bloco é igual a tamanho
        					             //lido (2 floats, ou seja, 2*4 bytes = 8 bytes)
        					   2*4       //salto inicial (em bytes)
        					  );
        					  
        //submeter textura para gpu
        var tex0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximg[0]);
        
        var tex1 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, tex1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximg[1]);
}                

function draw()
{
        var matrot = [Math.cos(angle*Math.PI/180.0), -Math.sin(angle*Math.PI/180.0), 0.0, 0.0, 
                      Math.sin(angle*Math.PI/180.0),  Math.cos(angle*Math.PI/180.0), 0.0, 0.0,
                      0.0,    0.0,   1.0, 0.0,
                      0.0,    0.0,   0.0, 1.0];
                      
        transfPtr = gl.getUniformLocation(prog, "transf");
        gl.uniformMatrix4fv(transfPtr, false, matrot);
        
        gl.clear( gl.COLOR_BUFFER_BIT);
        
        //desenha triângulos - executa shaders
        var texPtr = gl.getUniformLocation(prog, "tex");
        gl.uniform1i(texPtr, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.uniform1i(texPtr, 1);
        gl.drawArrays(gl.TRIANGLES, 2, 3);
        
        angle++;
	    
	    requestAnimationFrame(draw);
}
