import { useState, useRef, useEffect, useCallback } from "react";

export interface CropState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface LogoCropperProps {
  imageSrc: string;
  size: number;
  borderRadius: number;
  initialCropState?: CropState;
  onCropped: (dataUrl: string) => void;
  onCropStateChange?: (state: CropState) => void;
}

export function LogoCropper({
  imageSrc,
  size,
  borderRadius,
  initialCropState,
  onCropped,
  onCropStateChange,
}: LogoCropperProps) {
  const [scale, setScale] = useState(initialCropState?.scale ?? 1);
  const [offset, setOffset] = useState({ x: initialCropState?.offsetX ?? 0, y: initialCropState?.offsetY ?? 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Load image natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      imgRef.current = img;
      setScale(initialCropState?.scale ?? 1);
      setOffset({ x: initialCropState?.offsetX ?? 0, y: initialCropState?.offsetY ?? 0 });
    };
    img.src = imageSrc;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageSrc]);

  // Render to canvas + emit cropped result
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgNatural.w) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const outSize = 512;
    canvas.width = outSize;
    canvas.height = outSize;
    ctx.clearRect(0, 0, outSize, outSize);

    // Clip to rounded rect
    const r = (borderRadius / size) * outSize;
    ctx.beginPath();
    ctx.roundRect(0, 0, outSize, outSize, r);
    ctx.clip();

    // Calculate image draw dimensions
    // Fit the image so its shortest side fills the crop area, then apply scale
    const aspect = imgNatural.w / imgNatural.h;
    let drawW: number, drawH: number;
    if (aspect >= 1) {
      drawH = outSize * scale;
      drawW = drawH * aspect;
    } else {
      drawW = outSize * scale;
      drawH = drawW / aspect;
    }

    const drawX = (outSize - drawW) / 2 + (offset.x / size) * outSize;
    const drawY = (outSize - drawH) / 2 + (offset.y / size) * outSize;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    onCropped(canvas.toDataURL("image/png"));
  }, [imgNatural, scale, offset, size, borderRadius, onCropped]);

  useEffect(() => {
    render();
  }, [render]);

  // Report crop state changes back to parent
  useEffect(() => {
    onCropStateChange?.({ scale, offsetX: offset.x, offsetY: offset.y });
  }, [scale, offset, onCropStateChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setDragging(false);

  // Preview: show the image behind a mask
  const previewSize = size;
  const aspect = imgNatural.w && imgNatural.h ? imgNatural.w / imgNatural.h : 1;
  let prevW: number, prevH: number;
  if (aspect >= 1) {
    prevH = previewSize * scale;
    prevW = prevH * aspect;
  } else {
    prevW = previewSize * scale;
    prevH = prevW / aspect;
  }

  return (
    <div className="logo-cropper">
      <div
        className="cropper-viewport"
        style={{
          width: previewSize,
          height: previewSize,
          borderRadius,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {imgNatural.w > 0 && (
          <img
            src={imageSrc}
            alt=""
            draggable={false}
            style={{
              position: "absolute",
              width: prevW,
              height: prevH,
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        )}
      </div>
      <div className="cropper-controls">
        <div className="slider-row">
          <span style={{ fontSize: 11 }}>Zoom</span>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
          />
          <span>{Math.round(scale * 100)}%</span>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
