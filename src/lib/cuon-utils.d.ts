// Note: These type definitions were (mostly) GENERATED with AI (for bootstrapping the assignment)
// everything else, if not noted, is entirely written by hand or from course materials (no copilot, etc.)

/**
 * Create a program object and make current
 * @param gl WebGL context
 * @param vshader vertex shader program (string)
 * @param fshader fragment shader program (string)
 * @returns true if the program object was created and successfully made current
 */
export function initShaders(
  gl: WebGLRenderingContext,
  vshader: string,
  fshader: string
): boolean;

/**
 * Create the linked program object
 * @param gl WebGL context
 * @param vshader vertex shader program (string)
 * @param fshader fragment shader program (string)
 * @returns created program object, or null if the creation has failed
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vshader: string,
  fshader: string
): WebGLProgram | null;

/**
 * Create a shader object
 * @param gl WebGL context
 * @param type the type of the shader object to be created
 * @param source shader program (string)
 * @returns created shader object, or null if the creation has failed
 */
export function loadShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null;

/**
 * Initialize and get the rendering for WebGL
 * @param canvas canvas element
 * @param opt_debug flag to initialize the context for debugging
 * @returns the rendering context for WebGL
 */
export function getWebGLContext(
  canvas: HTMLCanvasElement,
  opt_debug?: boolean
): WebGLRenderingContext | null;

// Add declaration merging to extend WebGLRenderingContext
declare global {
  interface WebGLRenderingContext {
    program: WebGLProgram;
  }
}
