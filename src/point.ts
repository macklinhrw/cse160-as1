import { Color, Coordinate } from "./types";
import { gl, a_Position, u_FragColor, u_Size, program } from "./asg1";

export class Point {
  type: "point";
  position: Coordinate;
  color: Color;
  size: number;

  constructor() {
    this.type = "point";
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
    // Stop using the buffer to send the attribute
    gl.disableVertexAttribArray(a_Position);
    // Note: buffers can also be used here by just passing two points, similar to Triangle.ts

    // Pass the position of a point to a_Position variable
    gl.vertexAttrib3f(a_Position, xy[0], xy[1], 0.0);
    // Pass the color of a point to u_FragColor variable
    gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
    // Pass the size of a point to u_Size variable
    gl.uniform1f(u_Size, size);
    // Draw
    gl.drawArrays(gl.POINTS, 0, 1);
  }
}
