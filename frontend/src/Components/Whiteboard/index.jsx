import { useEffect, useRef } from "react";

const WhiteBoard = ({ canvasRef, ctxRef, tool, color, saveState }) => {
    const isDrawing = useRef(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";

        ctxRef.current = ctx;
    }, []);

    const handleMouseDown = (e) => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        // ⭐ save state BEFORE draw (undo fix)
        saveState();

        isDrawing.current = true;

        // ===== TOOL LOGIC =====
        if (tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = 20;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = color;
            ctx.lineWidth = tool === "pencil" ? 2 : 4;
        }

        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing.current) return;
        const ctx = ctxRef.current;

        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
        ctxRef.current.closePath();
    };

    const handleMouseLeave = () => {
        isDrawing.current = false;
    };

    return (
        <canvas
            ref={canvasRef}
            className="border border-dark border-3 h-100 w-100"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        />
    );
};

export default WhiteBoard;
