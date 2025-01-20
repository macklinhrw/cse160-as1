import { Color, Coordinate } from "./types";
import { gl, a_Position, u_FragColor, u_Size, program } from "./asg1";

export class Triangle {
  type: "triangle";
  position: Coordinate;
  color: Color;
  size: number;

  constructor() {
    this.type = "triangle";
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
  }

  render() {
    let xy = this.position;
    let rgba = this.color;
    let size = this.size;

    // Bug if not using this
    gl.useProgram(program);

    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

    // Draw
    const d = size / 80;
    const triangleVertices = new Float32Array([
      xy[0] - d / 4,
      xy[1] - d / 8,
      xy[0] + d / 4,
      xy[1] - d / 8,
      xy[0],
      xy[1] + d / 3,
    ]);
    drawTriangle(triangleVertices);
  }
}

export function drawTriangle(vertices: Float32Array) {
  // Bug if not using this
  gl.useProgram(program);

  const n = 3;

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object.");
    return -1;
  }

  // Bind the buffer object to the target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

  // Assign the buffer object to the a_Position variable
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
  // Enable the assignment to the a_Position variable
  gl.enableVertexAttribArray(a_Position);

  gl.drawArrays(gl.TRIANGLES, 0, n);
}
