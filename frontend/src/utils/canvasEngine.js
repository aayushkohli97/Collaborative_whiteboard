/**
 * Canvas Rendering Engine
 * 
 * Provides resolution-independent drawing using normalized coordinates.
 * All coordinates are stored as values between 0.0 and 1.0,
 * then scaled to the viewer's actual canvas dimensions on render.
 * 
 * Algorithm:
 *   On draw:  x̂ = x_pixel / canvas_width,  ŷ = y_pixel / canvas_height
 *   On render: x = x̂ × canvas_width,       y = ŷ × canvas_height
 */

/**
 * Convert pixel coordinates to normalized (0-1) coordinates
 */
export const normalizePoint = (x, y, canvasWidth, canvasHeight) => ({
  x: x / canvasWidth,
  y: y / canvasHeight,
});

/**
 * Convert normalized coordinates back to pixel coordinates
 */
export const denormalizePoint = (nx, ny, canvasWidth, canvasHeight) => ({
  x: nx * canvasWidth,
  y: ny * canvasHeight,
});

/**
 * Get tool-specific drawing configuration
 */
const getToolConfig = (tool, color, size) => {
  switch (tool) {
    case "pencil":
      return {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: size,
        strokeStyle: color,
        globalAlpha: 1,
        globalCompositeOperation: "source-over",
      };
    case "pen":
      return {
        lineCap: "butt",
        lineJoin: "miter",
        lineWidth: size * 0.8,
        strokeStyle: color,
        globalAlpha: 1,
        globalCompositeOperation: "source-over",
      };
    case "brush":
      return {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: size * 2.5,
        strokeStyle: color,
        globalAlpha: 0.45,
        globalCompositeOperation: "source-over",
      };
    case "eraser":
      return {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: size * 2,
        strokeStyle: "#ffffff",
        globalAlpha: 1,
        globalCompositeOperation: "destination-out",
      };
    case "rectangle":
    case "circle":
    case "line":
      return {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: size,
        strokeStyle: color,
        globalAlpha: 1,
        globalCompositeOperation: "source-over",
      };
    default:
      return {
        lineCap: "round",
        lineJoin: "round",
        lineWidth: size,
        strokeStyle: color,
        globalAlpha: 1,
        globalCompositeOperation: "source-over",
      };
  }
};

/**
 * Apply tool configuration to a canvas context
 */
const applyToolConfig = (ctx, config) => {
  ctx.lineCap = config.lineCap;
  ctx.lineJoin = config.lineJoin;
  ctx.lineWidth = config.lineWidth;
  ctx.strokeStyle = config.strokeStyle;
  ctx.globalAlpha = config.globalAlpha;
  ctx.globalCompositeOperation = config.globalCompositeOperation;
};

/**
 * Draw a single stroke on the canvas.
 * Stroke points are in normalized coordinates and get scaled to canvas dimensions.
 */
export const drawStroke = (ctx, stroke, canvasWidth, canvasHeight) => {
  if (!stroke || !stroke.points || stroke.points.length < 1) return;

  const config = getToolConfig(stroke.tool, stroke.color, stroke.size);
  applyToolConfig(ctx, config);

  const isShape = ["rectangle", "circle", "line"].includes(stroke.tool);

  if (isShape) {
    const first = denormalizePoint(
      stroke.points[0].x,
      stroke.points[0].y,
      canvasWidth,
      canvasHeight
    );
    const last = stroke.points.length > 1
      ? denormalizePoint(
          stroke.points[stroke.points.length - 1].x,
          stroke.points[stroke.points.length - 1].y,
          canvasWidth,
          canvasHeight
        )
      : first;

    ctx.beginPath();
    if (stroke.tool === "rectangle") {
      const x = Math.min(first.x, last.x);
      const y = Math.min(first.y, last.y);
      const w = Math.abs(last.x - first.x);
      const h = Math.abs(last.y - first.y);
      ctx.strokeRect(x, y, w, h);
    } else if (stroke.tool === "circle") {
      const radiusX = Math.abs(last.x - first.x) / 2;
      const radiusY = Math.abs(last.y - first.y) / 2;
      const centerX = Math.min(first.x, last.x) + radiusX;
      const centerY = Math.min(first.y, last.y) + radiusY;
      ctx.ellipse(centerX, centerY, Math.max(radiusX, 0.1), Math.max(radiusY, 0.1), 0, 0, 2 * Math.PI);
      ctx.stroke();
    } else if (stroke.tool === "line") {
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
    ctx.closePath();
  } else {
    // Freehand drawing (pencil, pen, brush, eraser)
    ctx.beginPath();
    const first = denormalizePoint(
      stroke.points[0].x,
      stroke.points[0].y,
      canvasWidth,
      canvasHeight
    );
    ctx.moveTo(first.x, first.y);

    if (stroke.points.length === 1) {
      ctx.lineTo(first.x + 0.1, first.y + 0.1);
    } else {
      for (let i = 1; i < stroke.points.length; i++) {
        const pt = denormalizePoint(
          stroke.points[i].x,
          stroke.points[i].y,
          canvasWidth,
          canvasHeight
        );
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.stroke();
    ctx.closePath();
  }

  // Reset composite operation and alpha
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
};

/**
 * Redraw all strokes for a page on the canvas.
 * Clears the canvas first, then replays all strokes.
 */
export const redrawPage = (ctx, strokes, canvasWidth, canvasHeight) => {
  if (!ctx) return;

  // Clear to white
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  if (!strokes || strokes.length === 0) return;

  for (const action of strokes) {
    if (action.type === "clear") {
      // A clear action wipes the canvas — everything before it is gone
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    } else if (action.type === "stroke") {
      drawStroke(ctx, action, canvasWidth, canvasHeight);
    }
  }
};

/**
 * Set up a canvas with proper DPI scaling for crisp rendering on Retina displays.
 * Returns the CSS dimensions (logical pixels) for coordinate calculations.
 */
export const setupCanvasDPI = (canvas) => {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  // Set actual canvas pixel dimensions (physical pixels)
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  const ctx = canvas.getContext("2d");
  // Scale context so drawing operations are in CSS pixels
  ctx.scale(dpr, dpr);

  // Return CSS dimensions for coordinate normalization
  return {
    width: rect.width,
    height: rect.height,
    dpr,
    ctx,
  };
};
