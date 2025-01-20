import { initShaders } from "./lib/cuon-utils";
import { Color, DrawableShapes, SaveType, Shape } from "./types";
import { Point } from "./point";
import { Triangle } from "./triangle";
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

main();
