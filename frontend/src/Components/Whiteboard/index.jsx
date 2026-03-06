import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";

const WhiteBoard = ({ canvasRef, ctxRef, tool, color, size, saveState,isPresenter,socket }) => {

    const isDrawing = useRef(false);
    const { roomId } = useParams();

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

    useEffect(()=>{

        socket.on("whiteboardData",(data)=>{
            console.log("viewer recieved data");

            const img = new Image();
            img.src = data.img;

            img.onload = ()=>{
                const canvas = canvasRef.current;
                const ctx = ctxRef.current;

                ctx.clearRect(0,0,canvas.width,canvas.height);
                ctx.drawImage(img,0,0);
            };
        });

    },[]);

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
        if(!isPresenter) return;

        const ctx = ctxRef.current;
        if (!ctx) return;

        saveState();

        isDrawing.current = true;

        if (tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = 1.5*size;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
        }

        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const handleMouseMove = (e) => {
        if(!isPresenter) return;
        if(!isDrawing.current) return;

        const ctx = ctxRef.current;

        const x = e.nativeEvent.offsetX;
        const y = e.nativeEvent.offsetY;

        ctx.lineTo(x,y);
        ctx.stroke();

        const canvas = canvasRef.current;

        socket.emit("whiteboardData",{
            img: canvas.toDataURL(),
            roomId: roomId
        });
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