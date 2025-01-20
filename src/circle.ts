import { Color, Coordinate } from "./types";
import { gl, u_FragColor, program } from "./asg1";
import { drawTriangle } from "./triangle";

export class Circle {
  type: "circle";
  position: Coordinate;
  color: Color;
  size: number;
  segments: number;

  constructor() {
    this.type = "circle";
    this.position = [0.0, 0.0, 0.0];
    this.color = [1.0, 1.0, 1.0, 1.0];
    this.size = 5.0;
    this.segments = 8;
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
    const d = size / 200;

    let angleStep = 360 / this.segments;
    for (let angle = 0; angle < 360; angle += angleStep) {
      let centerPt = [xy[0], xy[1]];
      let angle1 = angle;
      let angle2 = angle + angleStep;
      let vec1 = [
        Math.cos((angle1 * Math.PI) / 180) * d,
        Math.sin((angle1 * Math.PI) / 180) * d,
      ];
      let vec2 = [
        Math.cos((angle2 * Math.PI) / 180) * d,
        Math.sin((angle2 * Math.PI) / 180) * d,
      ];
      let pt1 = [centerPt[0] + vec1[0], centerPt[1] + vec1[1]];
      let pt2 = [centerPt[0] + vec2[0], centerPt[1] + vec2[1]];

      const triangleVertices = new Float32Array([
        xy[0],
        xy[1],
        pt1[0],
        pt1[1],
        pt2[0],
        pt2[1],
      ]);
      drawTriangle(triangleVertices);
    }
  }
}
