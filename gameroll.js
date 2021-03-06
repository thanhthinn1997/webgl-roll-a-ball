var gl;
var ctx;

function initGL(canvas) {
  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert("Your browser isn't supported WebGL :D");
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
      return null;
  }
  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
      if (k.nodeType == 3) {
          str += k.textContent;
      }
      k = k.nextSibling;
  }
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
      shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
      shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
      return null;
  }
  gl.shaderSource(shader, str);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert(gl.getShaderInfoLog(shader));
      return null;
  }
  return shader;
}

var shaderProgram;

function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Could not initialise shaders :D");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
  shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
  gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
  shaderProgram.ambientColorUniform = gl.getUniformLocation(shaderProgram, "uAmbientColor");
  shaderProgram.lightingLocationUniform = gl.getUniformLocation(shaderProgram, "uLightingLocation");
  shaderProgram.lightingColorUniform = gl.getUniformLocation(shaderProgram, "uLightingColor");
}

function handleLoadedTexture(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

var primaryTexture;
var blockTexture;
var bgTexture;

function initTexture() {
  primaryTexture = gl.createTexture();
  primaryTexture.image = new Image();
  primaryTexture.image.onload = function () {
      handleLoadedTexture(primaryTexture);
  }
  primaryTexture.image.src = "img/test.gif";

  blockTexture = gl.createTexture();
  blockTexture.image = new Image();
  blockTexture.image.onload = function () {
    handleLoadedTexture(blockTexture);
  }
  blockTexture.image.src = "img/crate.gif";

  bgTexture = gl.createTexture();
  bgTexture.image = new Image();
  bgTexture.image.onload = function () {
    handleLoadedTexture(bgTexture);
  }
  bgTexture.image.src = "img/play.jpg";
}

var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);

  var normalMatrix = mat3.create();
  mat4.toInverseMat3(mvMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}

var currentlyPressedKeys = {};

function handleKeyDown(event) {
  currentlyPressedKeys[event.keyCode] = true;
}
function handleKeyUp(event) {
  currentlyPressedKeys[event.keyCode] = false;
}

var moonRotationMatrix = mat4.create();
mat4.identity(moonRotationMatrix);

var xRot = 0;
var yRot = 0;

function handleKeys() {
  if (currentlyPressedKeys[37] || currentlyPressedKeys[65]) {
      // Left cursor key or A
      xRot = -2.0;

      if(xPot<=24)
      {
        xPot +=0.2;
      }
  } else if (currentlyPressedKeys[39] || currentlyPressedKeys[68]) {
      // Right cursor key or D
      xRot = 2.0;

      if(xPot>=-24)
      {
        xPot -= 0.2;
      }
  } else {
      xRot = 0;
  }

  if (currentlyPressedKeys[38] || currentlyPressedKeys[87]) {
      // Up cursor key or W
      yRot = -2.0;

      if(zPot<=-6.5)
      {
        zPot += 0.2;
      }
  } else if (currentlyPressedKeys[40] || currentlyPressedKeys[83]) {
      // Down cursor key
      yRot = 2.0;

      if(zPot>=-54.4)
      {
        zPot -=0.2;
      }
  } else {
      yRot = 0;
  }

  var newRotationMatrix = mat4.create();
  mat4.identity(newRotationMatrix);
  mat4.rotate(newRotationMatrix, degToRad(xRot), [0, 1, 0]);
  mat4.rotate(newRotationMatrix, degToRad(yRot), [1, 0, 0]);
  mat4.multiply(newRotationMatrix, moonRotationMatrix, moonRotationMatrix);
}

var moonVertexPositionBuffer;
var moonVertexNormalBuffer;
var moonVertexTextureCoordBuffer;
var moonVertexIndexBuffer;

var cubeVertexPositionBuffer;
var cubeVertexNormalBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;

var playVertexPositionBuffer;
var playVertexTextureCoordBuffer;

function initBuffers() {
  var latitudeBands = 30;
  var longitudeBands = 30;
  var radius = 1;
  var vertexPositionData = [];
  var normalData = [];
  var textureCoordData = [];
  for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
      var theta = latNumber * Math.PI / latitudeBands;
      var sinTheta = Math.sin(theta);
      var cosTheta = Math.cos(theta);
      for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
          var phi = longNumber * 2 * Math.PI / longitudeBands;
          var sinPhi = Math.sin(phi);
          var cosPhi = Math.cos(phi);
          var x = cosPhi * sinTheta;
          var y = cosTheta;
          var z = sinPhi * sinTheta;
          var u = 1 - (longNumber / longitudeBands);
          var v = 1 - (latNumber / latitudeBands);
          normalData.push(x);
          normalData.push(y);
          normalData.push(z);
          textureCoordData.push(u);
          textureCoordData.push(v);
          vertexPositionData.push(radius * x);
          vertexPositionData.push(radius * y);
          vertexPositionData.push(radius * z);
      }
  }
  var indexData = [];
  for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
      for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
          var first = (latNumber * (longitudeBands + 1)) + longNumber;
          var second = first + longitudeBands + 1;
          indexData.push(first);
          indexData.push(second);
          indexData.push(first + 1);
          indexData.push(second);
          indexData.push(second + 1);
          indexData.push(first + 1);
      }
  }
  moonVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
  moonVertexNormalBuffer.itemSize = 3;
  moonVertexNormalBuffer.numItems = normalData.length / 3;
  moonVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
  moonVertexTextureCoordBuffer.itemSize = 2;
  moonVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;
  moonVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
  moonVertexPositionBuffer.itemSize = 3;
  moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;
  moonVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STATIC_DRAW);
  moonVertexIndexBuffer.itemSize = 1;
  moonVertexIndexBuffer.numItems = indexData.length;

cubeVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  vertices = [
      // Front face
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,
      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,
      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,
      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,
      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,
      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 3;
  cubeVertexPositionBuffer.numItems = 24;

  cubeVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
  var vertexNormals = [
      // Front face
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
       0.0,  0.0,  1.0,
      // Back face
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
       0.0,  0.0, -1.0,
      // Top face
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
       0.0,  1.0,  0.0,
      // Bottom face
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
       0.0, -1.0,  0.0,
      // Right face
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
      // Left face
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0,
      -1.0,  0.0,  0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
  cubeVertexNormalBuffer.itemSize = 3;
  cubeVertexNormalBuffer.numItems = 24;
  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  var textureCoords = [
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      // Back face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      // Top face
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      // Bottom face
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      // Right face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  cubeVertexTextureCoordBuffer.itemSize = 2;
  cubeVertexTextureCoordBuffer.numItems = 24;
  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  var cubeVertexIndices = [
      0, 1, 2,      0, 2, 3,    // Front face
      4, 5, 6,      4, 6, 7,    // Back face
      8, 9, 10,     8, 10, 11,  // Top face
      12, 13, 14,   12, 14, 15, // Bottom face
      16, 17, 18,   16, 18, 19, // Right face
      20, 21, 22,   20, 22, 23  // Left face
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 36;

  playVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, playVertexPositionBuffer);
  var vertices1 = [
       25.0,  -1.0, -25.0,
      -25.0,  -1.0, -25.0,
       25.0,  -1.0,  25.0,
      -25.0,  -1.0,  25.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices1), gl.STATIC_DRAW);
  playVertexPositionBuffer.itemSize = 3;
  playVertexPositionBuffer.numItems = 4;
  playVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, playVertexTextureCoordBuffer);
  var textureCoords1 = [
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords1), gl.STATIC_DRAW);
  playVertexTextureCoordBuffer.itemSize = 2;
  playVertexTextureCoordBuffer.numItems = 4;
}

var rBlock = 0;

function Block(startingX, startingZ) {
  this.x = startingX;
  this.z = startingZ;
}

var xPot = 0;
var zPot = -30.0;



Block.prototype.draw = function() {
  mvPushMatrix();

  mat4.translate(mvMatrix, [this.x, 0, this.z]);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, blockTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);

  mat4.rotate(mvMatrix, degToRad(rBlock), [0, 1, 0]);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();
}

var blocks = [];

function initBlocks() {
  var numBlocks = 2;

  for (var i=-numBlocks; i<=numBlocks; i++) {
    blocks.push(new Block(i * (8.0),(-35) + (Math.abs(Math.abs(i)+20))));
    blocks.push(new Block(i * (8.0),-((-35) + (Math.abs(Math.abs(i)+20)))));
  }
}

var score = 0;
var currentX;
var currentZ;

function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    gl.uniform3f(
        shaderProgram.ambientColorUniform,
        parseFloat(0.3),
        parseFloat(0.3),
        parseFloat(0.3)
    );
    gl.uniform3f(shaderProgram.lightingLocationUniform,
        parseFloat(-10.0),
        parseFloat(0.0),
        parseFloat(0.0)
    );

    gl.uniform3f(
        shaderProgram.lightingColorUniform,
        parseFloat(0.8),
        parseFloat(0.8),
        parseFloat(0.8)
    );

  mat4.identity(mvMatrix);

  mat4.rotate(mvMatrix, degToRad(50), [1, 0, 0]);

  mat4.translate(mvMatrix, [0, -30.0, 0]);

  mvPushMatrix();

  mat4.translate(mvMatrix, [0.0, 0.0, -30.0]);
  mat4.multiply(mvMatrix, moonRotationMatrix);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, primaryTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, moonVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, moonVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  mvPopMatrix();

  mat4.translate(mvMatrix, [xPot, 0.0, zPot]);

  for (var i in blocks) {
   blocks[i].draw();

   currentX = blocks[i].x*xPot;
   currentZ = blocks[i].z*(zPot+30);

   if((Math.abs(Math.abs(blocks[i].x)-Math.abs(xPot))<=1.5) && (Math.abs(Math.abs(blocks[i].z)-Math.abs(zPot+30))<=1.5) && currentX<=0 && currentZ<=0)
    {
      blocks.splice(i,1);
      score++;
    }
 }
 //lol what can I do now I'm hopeless...

  mvPushMatrix();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, bgTexture);
  gl.uniform1i(shaderProgram.samplerUniform, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, playVertexTextureCoordBuffer);
  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, playVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, playVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, playVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, playVertexPositionBuffer.numItems);
  mvPopMatrix();
}

var lastTime = 0;

function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
      var elapsed = timeNow - lastTime;
      rBlock += (90 * elapsed) / 1000.0;
  }
  lastTime = timeNow;
}

function drawScore() {
  ctx.font = "20px Arial";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText("Score: "+score, 8, 20);

  ctx.font = "40px Arial";
  var gradient = ctx.createLinearGradient(0, 0, 500, 0);
  gradient.addColorStop("0", "magenta");
  gradient.addColorStop("0.5", "blue");
  gradient.addColorStop("1.0", "red");
  ctx.fillStyle = gradient;
  if(score >= 10) {
    ctx.fillText("You win !!", 300, 260);
  }
}

function tick() {
  ctx.clearRect(0, 0, 500, 500);
  requestAnimationFrame(tick);
  handleKeys();
  drawScene();
  animate();
  drawScore();
}

function WebGLStart() {
  var canvas = document.getElementById("thecanvas");
  var canvas2 = document.getElementById("score");
  ctx = canvas2.getContext("2d");
  initGL(canvas);
  initShaders();
  initBuffers();
  initTexture();
  initBlocks();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;

  tick();
}
