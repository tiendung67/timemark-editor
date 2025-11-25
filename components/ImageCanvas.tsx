import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SelectionBox } from '../types';

interface ImageCanvasProps {
  imageSrc: string;
  onSelectionChange: (selection: SelectionBox | null) => void;
  className?: string;
  label?: string;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ imageSrc, onSelectionChange, className = '', label }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<SelectionBox | null>(null);

  // Redraw canvas whenever image, box, or container size changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw selection box if exists
    if (currentBox) {
      // Semi-transparent dark overlay outside the box to highlight the selection
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear the "selected" area so it looks bright
      ctx.clearRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      
      // Draw border
      ctx.strokeStyle = '#00f2ff'; // Cyan neon
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height);
      
      // Label
      ctx.fillStyle = '#00f2ff';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText('Edit Zone', currentBox.x, currentBox.y - 8);
    }
  }, [currentBox]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setStartPos({ x, y });
    setIsDrawing(true);
    setCurrentBox(null); // Reset current box
    onSelectionChange(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPos || !imgRef.current) return;
    
    const rect = imgRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const currentY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const width = Math.abs(currentX - startPos.x);
    const height = Math.abs(currentY - startPos.y);
    const x = Math.min(currentX, startPos.x);
    const y = Math.min(currentY, startPos.y);

    const newBox = { x, y, width, height };
    setCurrentBox(newBox);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setStartPos(null);
    if (currentBox) {
      onSelectionChange(currentBox);
    }
  };

  return (
    <div className={`relative w-full h-full flex flex-col ${className}`}>
        {label && (
            <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                <span className="text-xs font-semibold tracking-wider text-white uppercase">{label}</span>
            </div>
        )}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 rounded-xl border-2 border-slate-800"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          ref={imgRef}
          src={imageSrc} 
          alt="Original" 
          className="max-w-full max-h-full object-contain pointer-events-none select-none"
          onLoad={() => {
             // Sync canvas size to image display size
             if (imgRef.current && canvasRef.current) {
                 canvasRef.current.width = imgRef.current.width;
                 canvasRef.current.height = imgRef.current.height;
                 draw();
             }
          }}
        />
        <canvas 
            ref={canvasRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
                width: imgRef.current?.width,
                height: imgRef.current?.height
            }}
        />
      </div>
    </div>
  );
};

export default ImageCanvas;