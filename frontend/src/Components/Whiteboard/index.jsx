import { useEffect, useRef } from "react";
import { setupCanvasDPI, normalizePoint, redrawPage } from "../../utils/canvasEngine";

const WhiteBoard = ({ 
  pageIndex, 
  strokes, 
  tool, 
  color, 
  size, 
  isPresenter, 
  socket, 
  roomId,
  isActive,
  onStrokeEnd
}) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const cssSizeRef = useRef({ width: 0, height: 0 });
  const isDrawing = useRef(false);
  const currentStroke = useRef(null); // the stroke currently being drawn

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initial setup
    handleResize();

    window.addEventListener("resize", handleResize);
    const observer = new ResizeObserver(() => handleResize());
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, []);

  // Redraw when strokes change or after resize
  useEffect(() => {
    if (ctxRef.current && cssSizeRef.current.width > 0) {
      redrawPage(ctxRef.current, strokes, cssSizeRef.current.width, cssSizeRef.current.height);
    }
  }, [strokes]);

  const strokesRef = useRef(strokes);
  useEffect(() => {
    strokesRef.current = strokes;
  }, [strokes]);

  const handleResize = () => {
    if (!canvasRef.current) return;
    const { width, height, ctx } = setupCanvasDPI(canvasRef.current);
    cssSizeRef.current = { width, height };
    ctxRef.current = ctx;
    // Redraw existing strokes at new dimensions
    redrawPage(ctx, strokesRef.current, width, height);
  };

  const handleMouseDown = (e) => {
    if (!isPresenter || !isActive) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const normPt = normalizePoint(offsetX, offsetY, cssSizeRef.current.width, cssSizeRef.current.height);

    isDrawing.current = true;
    currentStroke.current = {
      type: "stroke",
      tool,
      color,
      size,
      points: [normPt]
    };

    // Emit start so viewers see drawing begin
    socket.emit("stroke-start", {
      roomId,
      pageIndex,
      stroke: currentStroke.current
    });

    // Draw locally (optimistic)
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.beginPath();
      // Temporarily use current tool styles for drawing the ongoing line
      ctx.lineCap = tool === "pen" ? "butt" : "round";
      ctx.lineJoin = tool === "pen" ? "miter" : "round";
      ctx.lineWidth = tool === "brush" ? size * 2.5 : tool === "eraser" ? size * 2 : tool === "pen" ? size * 0.8 : size;
      ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
      ctx.globalAlpha = tool === "brush" ? 0.45 : 1;
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      
      ctx.moveTo(offsetX, offsetY);
    }
  };

  const handleMouseMove = (e) => {
    if (!isPresenter || !isActive || !isDrawing.current) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const normPt = normalizePoint(offsetX, offsetY, cssSizeRef.current.width, cssSizeRef.current.height);

    currentStroke.current.points.push(normPt);

    socket.emit("stroke-move", {
      roomId,
      pageIndex,
      point: normPt
    });

    // Draw locally
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    if (!isPresenter || !isActive || !isDrawing.current) return;
    
    isDrawing.current = false;
    
    const ctx = ctxRef.current;
    if (ctx) {
      ctx.closePath();
      // Reset composite operation
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    socket.emit("stroke-end", {
      roomId,
      pageIndex,
      stroke: currentStroke.current
    });
    
    if (onStrokeEnd) {
      onStrokeEnd(pageIndex, currentStroke.current);
    }
  };

  return (
    <div className={`canvas-wrapper ${isActive ? "active-page" : "inactive-page"}`}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={!isPresenter || !isActive ? "viewer-mode" : ""}
      />
      <div className="page-indicator">Page {pageIndex + 1}</div>
    </div>
  );
};

export default WhiteBoard;