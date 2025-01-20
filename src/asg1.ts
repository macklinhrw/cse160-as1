import { initShaders } from "./lib/cuon-utils";
import { Color, Coordinate, DrawableShapes, SaveType, Shape } from "./types";
import { Point } from "./point";
import { drawTriangle, Triangle } from "./triangle";
import { Circle } from "./circle";

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  "attribute vec4 a_Position;\n" +
  "uniform float u_Size;\n" +
  "void main() {\n" +
  "  gl_Position = a_Position;\n" +
  "  gl_PointSize = u_Size;\n" +
  "}\n";

// Fragment shader program
var FSHADER_SOURCE =
  "precision mediump float;\n" +
  "uniform vec4 u_FragColor;\n" + // uniform変数
  "void main() {\n" +
  "  gl_FragColor = u_FragColor;\n" +
  "}\n";

// Globals
export let canvas: HTMLCanvasElement;
export let gl: WebGLRenderingContext;
export let a_Position: number;
export let u_FragColor: WebGLUniformLocation;
export let u_Size: WebGLUniformLocation;
export let program: WebGLProgram;

// Globals for drawing UI
let g_selectedColor: Color = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedShape: DrawableShapes = "point";
let g_selectedCircleSegments = 8;

// Globals for storing state
// var g_points: Coordinate[] = []; // The array for the position of a mouse press
// var g_colors: Color[] = []; // The array to store the color of a point
// var g_sizes: number[] = []; // The array to store the color of a point
var g_shapesList: Shape[] = [];

function setupWebGL() {
  // Retrieve <canvas> element
  let canvasTmp = document.getElementById("webgl") as HTMLCanvasElement | null;
  if (!canvasTmp) {
    console.log("Failed to get the canvas.");
    return;
  }
  canvas = canvasTmp;

  // Get the rendering context for WebGL
  // let glTmp = getWebGLContext(canvas);
  let glTmp = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!glTmp) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }
  gl = glTmp;
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to intialize shaders.");
    return;
  }
  program = gl.program;

  // // Get the storage location of a_Position
  let a_PositionTmp = gl.getAttribLocation(gl.program, "a_Position");
  if (a_PositionTmp < 0) {
    console.log("Failed to get the storage location of a_Position");
    return;
  }
  a_Position = a_PositionTmp;

  // Get the storage location of u_FragColor
  let u_FragColorTmp = gl.getUniformLocation(gl.program, "u_FragColor");
  if (!u_FragColorTmp) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }
  u_FragColor = u_FragColorTmp;

  // Get the storage location of u_Size
  let u_SizeTmp = gl.getUniformLocation(gl.program, "u_Size");
  if (!u_SizeTmp) {
    console.log("Failed to get the storage location of u_FragColor");
    return;
  }
  u_Size = u_SizeTmp;
}

function convertCoordinatesEventToGL(ev: MouseEvent) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = (ev.target as HTMLElement).getBoundingClientRect();

  x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

function addActionsForHtmlUI() {
  // Button Events
  let buttonRed = document.getElementById("b_red") as HTMLButtonElement;
  buttonRed.onclick = () => {
    g_selectedColor = [1.0, 0.0, 0.0, 1.0];
  };

  let buttonGreen = document.getElementById("b_green") as HTMLButtonElement;
  buttonGreen.onclick = () => {
    g_selectedColor = [0.0, 1.0, 0.0, 1.0];
  };

  let buttonClear = document.getElementById("b_clear") as HTMLButtonElement;
  buttonClear.onclick = () => {
    // Clear <canvas>
    g_shapesList = [];
    renderAllShapes();
  };

  let buttonPainting = document.getElementById(
    "b_painting"
  ) as HTMLButtonElement;
  buttonPainting.onclick = () => {
    // Clear <canvas>
    g_shapesList = [];
    renderAllShapes();
    makePainting();
  };

  // Button Events for selecting shape type
  let buttonSelectPoint = document.getElementById(
    "b_select_point"
  ) as HTMLButtonElement;
  buttonSelectPoint.onclick = () => {
    g_selectedShape = "point";
  };

  let buttonSelectTriangle = document.getElementById(
    "b_select_triangle"
  ) as HTMLButtonElement;
  buttonSelectTriangle.onclick = () => {
    g_selectedShape = "triangle";
  };

  let buttonSelectCircle = document.getElementById(
    "b_select_circle"
  ) as HTMLButtonElement;
  buttonSelectCircle.onclick = () => {
    g_selectedShape = "circle";
  };

  // let buttonSelectCircle = document.getElementById(
  //   "b_select_circle"
  // ) as HTMLButtonElement;
  // buttonSelectCircle.onclick = () => {
  //   g_selectedShape = "circle";
  // };

  // Save/Load Events
  let buttonSave = document.getElementById("b_save") as HTMLButtonElement;
  buttonSave.onclick = () => {
    save();
  };

  let buttonLoad = document.getElementById("i_load") as HTMLInputElement;
  buttonLoad.onchange = () => {
    let file = buttonLoad.files?.[0];
    if (file) {
      load(file);
      buttonLoad.value = "";
    }
  };

  // Slider Events
  let sliderRed = document.getElementById("slider_red") as HTMLButtonElement;
  sliderRed.addEventListener("mouseup", (event) => {
    g_selectedColor[0] = Number((event.target as HTMLInputElement).value) / 100;
  });

  let sliderGreen = document.getElementById("slider_green") as HTMLInputElement;
  sliderGreen.addEventListener("mouseup", (event) => {
    g_selectedColor[1] = Number((event.target as HTMLInputElement).value) / 100;
  });

  let sliderBlue = document.getElementById("slider_blue") as HTMLInputElement;
  sliderBlue.addEventListener("mouseup", (event) => {
    g_selectedColor[2] = Number((event.target as HTMLInputElement).value) / 100;
  });

  let sliderSize = document.getElementById("slider_size") as HTMLInputElement;
  sliderSize.addEventListener("mouseup", (event) => {
    g_selectedSize = Number((event.target as HTMLInputElement).value);
  });

  let sliderCircleSegments = document.getElementById(
    "slider_circle_segments"
  ) as HTMLInputElement;
  sliderCircleSegments.addEventListener("mouseup", (event) => {
    g_selectedCircleSegments = Number((event.target as HTMLInputElement).value);
  });
}

function main() {
  // Set up canvas and gl variables
  setupWebGL();
  // Set up shader programs and connect GLSL variables
  connectVariablesToGLSL();

  // Set up actions for HTML UI elements
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = (ev) => {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev: MouseEvent) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  // Create and store the new shape
  if (g_selectedShape === "point") {
    let shape = new Point();
    shape.position = [x, y];
    shape.color = [...g_selectedColor];
    shape.size = g_selectedSize;
    g_shapesList.push(shape);
  } else if (g_selectedShape === "triangle") {
    let shape = new Triangle();
    shape.position = [x, y];
    shape.color = [...g_selectedColor];
    shape.size = g_selectedSize;
    g_shapesList.push(shape);
  } else if (g_selectedShape === "circle") {
    let shape = new Circle();
    shape.position = [x, y];
    shape.color = [...g_selectedColor];
    shape.size = g_selectedSize;
    shape.segments = g_selectedCircleSegments;
    g_shapesList.push(shape);
  }

  // Store the coordinates to g_points array
  // g_points.push([x, y]);

  // Store the color to the g_colors array
  // g_colors.push([...g_selectedColor]);

  // Store the color to the g_colors array
  // g_sizes.push(g_selectedSize);

  // Store the coordinates to g_points array
  // if (x >= 0.0 && y >= 0.0) {
  //   // First quadrant
  //   g_colors.push([1.0, 0.0, 0.0, 1.0]); // Red
  // } else if (x < 0.0 && y < 0.0) {
  //   // Third quadrant
  //   g_colors.push([0.0, 1.0, 0.0, 1.0]); // Green
  // } else {
  //   // Others
  //   g_colors.push([1.0, 1.0, 1.0, 1.0]); // White
  // }

  renderAllShapes();
}

function renderAllShapes() {
  const startTime = performance.now();

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    let shape = g_shapesList[i];
    shape.render();
  }

  const duration = performance.now() - startTime;

  // Performance display
  sendTextToHTML(
    "numdot: " +
      len +
      " ms: " +
      Math.floor(duration) +
      " fps: " +
      Math.floor(10000 / duration),
    "numdot"
  );
}

function sendTextToHTML(text: string, htmlID: string) {
  const htmlEl = document.getElementById(htmlID);
  if (!htmlEl) {
    console.log(`Error finding html element with ID: ${htmlID}`);
    return;
  }

  htmlEl.innerHTML = text;
}

function save() {
  const data: SaveType = { shapesList: [...g_shapesList] };
  const jsonData = JSON.stringify(data);
  download(jsonData, "beautiful_painting.json", "application/json");
}

// Reference: https://stackoverflow.com/questions/5587973/javascript-upload-file
async function load(file: File) {
  // Clear shapes array
  g_shapesList = [];

  const contentsString = await file.text();
  let loadedSave: SaveType;

  try {
    let contentsJson = JSON.parse(contentsString);
    if (contentsJson) {
      loadedSave = contentsJson as SaveType;
    } else {
      console.log("Something went wrong with loading the save file.");
      return -1;
    }
  } catch (e) {
    console.error("There was an error with loading the file.");
    console.log(e);
    return -1;
  }

  if (loadedSave!.shapesList && loadedSave!.shapesList.length) {
    for (let s of loadedSave.shapesList) {
      if (s.type === "circle") {
        let shape = new Circle();
        shape.position = s.position;
        shape.segments = s.segments;
        shape.size = s.size;
        shape.color = s.color;
        g_shapesList.push(shape);
      } else if (s.type === "triangle") {
        let shape = new Triangle();
        shape.position = s.position;
        shape.size = s.size;
        shape.color = s.color;
        g_shapesList.push(shape);
      } else if (s.type === "point") {
        let shape = new Point();
        shape.position = s.position;
        shape.size = s.size;
        shape.color = s.color;
        g_shapesList.push(shape);
      }
    }
    renderAllShapes();
  } else {
    console.log("Something went wrong with loading the save file.");
    return -1;
  }
}

// Reference: https://stackoverflow.com/questions/13405129/create-and-save-a-file-with-javascript
// Note: Function type definitions generated with AI
// Function to download data to a file
function download(data: BlobPart, filename: string, type: string): void {
  var file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob)
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else {
    // Others
    var a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
}

// Painting portion of the code ===

// coordinate: 13 to left, 13 to the right, 14 tall
const pdx = 2 / 26;
const pdy = 2 / 14;
const pcenter: Coordinate = [0, 0];

// Sizes of objects
// Trees
const bigTreeWidth = 2 * pdx;
const bigTreeHeight = 3 * pdy;
const treeWidth = pdx;
const treeHeight = 2 * pdy;

function setColor(color: Color) {
  // Pass the color of a point to u_FragColor variable
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
}

// Start in bottom left
function paintRectangle(
  pos: Coordinate,
  color: Color,
  width: number,
  height: number
) {
  setColor(color);
  let posTmp = [pos[0], pos[1]];
  let vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] + width,
    posTmp[1],
    posTmp[0],
    posTmp[1] + height,
  ]);
  drawTriangle(vertices);
  posTmp = [pos[0] + width, pos[1] + height];
  vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] - width,
    posTmp[1],
    posTmp[0],
    posTmp[1] - height,
  ]);
  drawTriangle(vertices);
}

function paintMountain(pos: Coordinate, width: number, height: number) {
  let color1: Color = [0.9, 0.9, 0.9, 1.0];
  let color2: Color = [0.3, 0.3, 1.0, 1.0];

  // let width = 13 * pdx;
  // let height = 4 * pdy;

  setColor(color1);
  let posTmp = [pos[0], pos[1]];
  let vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] + width / 2,
    posTmp[1],
    posTmp[0] + width / 2,
    posTmp[1] + height,
  ]);
  drawTriangle(vertices);
  // do shading
  setColor(color2);
  posTmp = [pos[0], pos[1]];
  vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] + width / 8,
    posTmp[1],
    posTmp[0] + width / 2,
    posTmp[1] + height,
  ]);
  drawTriangle(vertices);
  // do other part of mountain
  setColor(color1);
  posTmp = [pos[0] + width / 2, pos[1]];
  vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0],
    posTmp[1] + height,
    posTmp[0] + width / 2,
    posTmp[1],
  ]);
  drawTriangle(vertices);
}

// function paintHouse(pos: Coordinate) {
//   let color: Color = [0.0, 1.0, 0.0, 1.0];
//   let colorDoor: Color = [0.0, 1.0, 0.0, 1.0];
//   // ...
// }

function paintTree(pos: Coordinate, type: "big" | "small") {
  let color: Color = [0.0, 1.0, 0.0, 1.0];
  let width = type === "big" ? bigTreeWidth : treeWidth;
  let height = type === "big" ? bigTreeHeight : treeHeight;
  setColor(color);
  let vertices = new Float32Array([
    pos[0],
    pos[1],
    pos[0] + width,
    pos[1],
    pos[0] + width / 2,
    pos[1] + height,
  ]);
  drawTriangle(vertices);
}

function paintTripleTree(pos: Coordinate) {
  paintTree(pos, "small");
  paintTree([pos[0] + treeWidth, pos[1]], "small");
  paintTree([pos[0] + 2 * treeWidth, pos[1]], "small");
}

function paintGround(pos: Coordinate) {
  let colorSky: Color = [0.0, 0.0, 0.0, 1.0];
  let colorWater: Color = [0.0, 0.0, 1.0, 1.0];

  setColor(colorWater);
  // -1, -7
  let posTmp = [pos[0] - 1 * pdx, pos[1] - 7 * pdy];
  let vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] - 2 * pdx,
    posTmp[1] + 3 * pdy,
    posTmp[0] + 2 * pdx,
    posTmp[1] + 5 * pdy,
  ]);
  drawTriangle(vertices);
  // 1, -2
  posTmp = [pos[0] + 1 * pdx, pos[1] - 2 * pdy];
  vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] - 1 * pdx,
    posTmp[1] + 1 * pdy,
    posTmp[0] + 8 * pdx,
    posTmp[1] + 3 * pdy,
  ]);
  drawTriangle(vertices);
  // 9, 1
  posTmp = [pos[0] + 9 * pdx, pos[1] + 1 * pdy];
  vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] - 1 * pdx,
    posTmp[1] + 0.4 * pdy,
    posTmp[0] + 4 * pdx,
    posTmp[1] + 1 * pdy,
  ]);
  drawTriangle(vertices);
  // Fill in lake
  // 9, 1
  posTmp = [pos[0] + 9 * pdx, pos[1] + 1 * pdy];
  vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] + 4 * pdx,
    posTmp[1] + 0 * pdy,
    posTmp[0] + 4 * pdx,
    posTmp[1] + 1 * pdy,
  ]);
  drawTriangle(vertices);
  // 1, -2
  posTmp = [pos[0] + 1 * pdx, pos[1] - 2 * pdy];
  vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] + 8 * pdx,
    posTmp[1] + 0 * pdy,
    posTmp[0] + 8 * pdx,
    posTmp[1] + 3 * pdy,
  ]);
  drawTriangle(vertices);
  paintRectangle(
    [posTmp[0] + 8 * pdx, posTmp[1]],
    colorWater,
    4 * pdx,
    3 * pdy
  );
  // -1, -7
  posTmp = [pos[0] - 1 * pdx, pos[1] - 7 * pdy];
  vertices = new Float32Array([
    posTmp[0],
    posTmp[1],
    posTmp[0] + 2 * pdx,
    posTmp[1] + 0 * pdy,
    posTmp[0] + 2 * pdx,
    posTmp[1] + 5 * pdy,
  ]);
  drawTriangle(vertices);
  paintRectangle(
    [posTmp[0] + 2 * pdx, posTmp[1]],
    colorWater,
    14 * pdx,
    5 * pdy
  );

  // Paint sky
  // y=4-7
  paintRectangle([-13 * pdx, 5 * pdy], colorSky, 26 * pdx, 2 * pdy);
}

function makePainting() {
  // Seem to need to setup webgl here again
  // Specify the ground color (clear color)
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  // gl.useProgram(program);
  gl.enableVertexAttribArray(a_Position);

  paintGround(pcenter);
  let posTmp = pcenter;

  // Paint mountains
  posTmp = [pcenter[0] - 4 * pdx, pcenter[1] + 4 * pdy];
  paintMountain(posTmp as Coordinate, 9 * pdx, 3 * pdy);
  posTmp = [pcenter[0] - 11 * pdx, pcenter[1] + 3 * pdy];
  paintMountain(posTmp as Coordinate, 13 * pdx, 4 * pdy);

  // Paint trees
  posTmp = [pcenter[0] - 0 * pdx, pcenter[1] - 0 * pdy];
  paintTripleTree(posTmp);
  posTmp = [pcenter[0] + treeWidth * 3 + 0.5 * pdx, pcenter[1] + 1 * pdy];
  paintTree(posTmp, "small");
  posTmp = [pcenter[0] + treeWidth * 4 + 1 * pdx, pcenter[1] + 2 * pdy];
  paintTripleTree(posTmp);

  posTmp = [pcenter[0] - 9 * pdx, pcenter[1] - 3 * pdy];
  paintTree(posTmp, "big");
  posTmp = [pcenter[0] - 9 * pdx + bigTreeWidth, pcenter[1] - 2.5 * pdy];
  paintTree(posTmp, "big");
  posTmp = [pcenter[0] - 9 * pdx + bigTreeWidth * 2, pcenter[1] - 2 * pdy];
  paintTree(posTmp, "big");

  posTmp = [pcenter[0] - 10 * pdx, pcenter[1] - 6.5 * pdy];
  paintTree(posTmp, "big");
  posTmp = [pcenter[0] - 10 * pdx + bigTreeWidth, pcenter[1] - 6.5 * pdy];
  paintTree(posTmp, "big");
  posTmp = [pcenter[0] - 10 * pdx + bigTreeWidth * 2, pcenter[1] - 6 * pdy];
  paintTree(posTmp, "big");

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
}

main();
