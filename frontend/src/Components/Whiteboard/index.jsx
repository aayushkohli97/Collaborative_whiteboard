import { useEffect, useRef } from "react";

const WhiteBoard = ({ canvasRef, ctxRef, tool, color, size, saveState }) => {

    const isDrawing = useRef(false);

    useEffect(() => {

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.lineCap = "round";
        ctxRef.current = ctx;

        resizeCanvas();

        window.addEventListener("resize", resizeCanvas);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
        };

    }, []);

    const resizeCanvas = () => {

        const canvas = canvasRef.current;
        const ctx = ctxRef.current;

        if (!canvas || !ctx) return;

        const imageData = canvas.toDataURL();

        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width;
        canvas.height = rect.height;

        const img = new Image();
        img.src = imageData;

        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };

    };

    const handleMouseDown = (e) => {

        const ctx = ctxRef.current;
        if (!ctx) return;

        saveState();

        isDrawing.current = true;

        if (tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = size;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
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

    return (
        <canvas
            ref={canvasRef}
            className="border border-dark border-3 h-100 w-100"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};

export default WhiteBoard;