"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { GripVertical, RotateCcw, X } from "lucide-react";
import styles from "./DraggableResizableWidget.module.css";

export interface DraggableResizableWidgetProps {
  id: string;
  index: number;
  title: string;
  type: "card" | "chart";
  width?: string | number;
  height?: number;
  x?: number;
  y?: number;
  onResize?: (id: string, width: string, height: number) => void;
  onPositionChange?: (id: string, x: number, y: number) => void;
  onRemove?: () => void;
  highlighted?: boolean;
  children: React.ReactNode;
}

export default function DraggableResizableWidget({
  id,
  index,
  title,
  type,
  width,
  height,
  x = 0,
  y = 0,
  onResize,
  onPositionChange,
  onRemove,
  highlighted = false,
  children,
}: DraggableResizableWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Default width and height based on type
  const requestedWidth = width
    ? (typeof width === "number" ? `${width}px` : width)
    : (type === "card" ? "440px" : "100%");
  const defaultWidth = requestedWidth;
  const requestedHeight = height && height > 0 ? height : (type === "card" ? 0 : 380);
  const defaultHeight = requestedHeight;

  const [currentWidth, setCurrentWidth] = useState<string>(defaultWidth);
  const [currentHeight, setCurrentHeight] = useState<number>(defaultHeight);
  const [posX, setPosX] = useState<number>(x);
  const [posY, setPosY] = useState<number>(y);

  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<"horizontal" | "vertical" | "both" | null>(null);
  const [livePixelSize, setLivePixelSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (width) {
      const nextWidth = typeof width === "number" ? `${width}px` : width;
      setCurrentWidth(nextWidth);
    }
    if (height && height > 0) {
      setCurrentHeight(height);
    }
  }, [width, height]);

  useEffect(() => {
    if (typeof x === "number") setPosX(x);
  }, [x]);

  useEffect(() => {
    if (typeof y === "number") setPosY(y);
  }, [y]);

  // Handle Free Drag & Move anywhere on canvas
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag if clicking buttons, inputs, or resize handles
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest(`.${styles.resizeHandleRight}`) ||
        target.closest(`.${styles.resizeHandleBottom}`) ||
        target.closest(`.${styles.resizeHandleCorner}`)
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const el = containerRef.current;
      if (!el) return;

      const parentEl = el.parentElement;
      const parentRect = parentEl?.getBoundingClientRect();
      const parentWidth = parentRect ? parentRect.width : window.innerWidth;

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const startPosX = posX;
      const startPosY = posY;

      let lastX = startPosX;
      let lastY = startPosY;

      setIsMoving(true);

      function onMouseMove(moveEvent: MouseEvent) {
        const deltaX = moveEvent.clientX - startMouseX;
        const deltaY = moveEvent.clientY - startMouseY;

        const elRect = el?.getBoundingClientRect();
        const currentW = elRect ? elRect.width : 400;

        // Allow moving anywhere within canvas width, min 0
        const maxAllowedX = Math.max(0, parentWidth - currentW - 8);
        const newX = Math.max(0, Math.min(startPosX + deltaX, maxAllowedX));
        const newY = Math.max(0, startPosY + deltaY);

        lastX = Math.round(newX);
        lastY = Math.round(newY);

        setPosX(lastX);
        setPosY(lastY);
      }

      function onMouseUp() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        setIsMoving(false);

        if (onPositionChange) {
          onPositionChange(id, lastX, lastY);
        }
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [id, posX, posY, onPositionChange]
  );

  // Handle Free Resize (Horizontal, Vertical, and Both)
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, direction: "horizontal" | "vertical" | "both") => {
      e.preventDefault();
      e.stopPropagation();

      const el = containerRef.current;
      if (!el) return;

      const parentEl = el.parentElement;
      const parentRect = parentEl?.getBoundingClientRect();
      const parentWidth = parentRect ? parentRect.width : window.innerWidth;

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = el.getBoundingClientRect().width;
      const startHeight = el.getBoundingClientRect().height;

      let lastW = startWidth;
      let lastH = startHeight;

      setIsResizing(direction);
      setLivePixelSize({ w: Math.round(startWidth), h: Math.round(startHeight) });

      function onMouseMove(moveEvent: MouseEvent) {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        let newW = startWidth;
        let newH = startHeight;

        if (direction === "horizontal" || direction === "both") {
          const maxW = Math.max(1, parentWidth - posX - 8);
          newW = Math.max(1, Math.min(startWidth + deltaX, maxW));
          lastW = newW;
          setCurrentWidth(`${Math.round(newW)}px`);
        }

        if (direction === "vertical" || direction === "both") {
          newH = Math.max(1, startHeight + deltaY);
          lastH = newH;
          setCurrentHeight(Math.round(newH));
        }

        setLivePixelSize({ w: Math.round(newW), h: Math.round(newH) });
      }

      function onMouseUp() {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        setIsResizing(null);
        setLivePixelSize(null);

        // Commit final dimensions
        const finalWidthStr = `${Math.round(lastW)}px`;
        const finalHeightNum = Math.round(lastH);
        setCurrentWidth(finalWidthStr);
        setCurrentHeight(finalHeightNum);

        if (onResize) {
          onResize(id, finalWidthStr, finalHeightNum);
        }
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [id, posX, onResize]
  );

  // Quick preset sizes
  function applyWidthPreset(preset: "1/3" | "1/2" | "Full" | "Auto") {
    const parentEl = containerRef.current?.parentElement;
    const parentW = parentEl?.getBoundingClientRect().width || 1000;

    let newW = "100%";
    let newH = type === "card" ? 0 : 380;

    if (preset === "1/3") {
      newW = `${Math.round((parentW - 32) / 3)}px`;
    } else if (preset === "1/2") {
      newW = `${Math.round((parentW - 24) / 2)}px`;
    } else if (preset === "Full") {
      const fullWidth = Math.round(parentW - 4);
      newW = `${fullWidth}px`;
      setPosX(0);
      if (onPositionChange) onPositionChange(id, 0, posY);
    } else {
      // Auto
      if (type === "card") {
        newW = `${Math.round(parentW - 4)}px`;
        newH = 0;
      } else {
        newW = `${Math.round(parentW - 4)}px`;
        newH = 380;
      }
    }

    setCurrentWidth(newW);
    setCurrentHeight(newH);
    if (onResize) {
      onResize(id, newW, newH);
    }
  }

  return (
    <div
      ref={containerRef}
      className={`${styles.widgetWrapper} ${isMoving ? styles.isMoving : ""} ${highlighted ? styles.highlighted : ""}`}
      data-widget-id={id}
      data-widget-type={type}
      style={{
        position: "absolute",
        left: `${posX}px`,
        top: `${posY}px`,
        width: currentWidth,
        height: currentHeight && currentHeight > 0 ? `${currentHeight}px` : "auto",
        minWidth: 0,
        minHeight: 0,
        zIndex: isMoving || isResizing ? 40 : 1,
      }}
    >
      {/* Top Drag & Control Bar - Click and drag anywhere here to move freely */}
      <div
        className={styles.widgetControlBar}
        onMouseDown={handleDragStart}
        title="Klik & tahan untuk menggeser kartu/grafik ke samping, atas, atau bawah secara bebas"
      >
        <div className={styles.dragHandleGroup}>
          <GripVertical size={14} className={styles.dragIcon} />
          <span className={styles.dragTitleText}>{title}</span>
          <span className={styles.freeDragHint}>• Geser Bebas</span>
        </div>

        {/* Dimension Quick Presets & Controls */}
        <div className={styles.dimensionPresets}>
          <button
            type="button"
            className={`${styles.presetBtn} ${
              currentWidth.includes("33") ? styles.presetBtnActive : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              applyWidthPreset("1/3");
            }}
            title="Ubah lebar menjadi 1/3 (33%)"
          >
            1/3
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${
              currentWidth.includes("50") ? styles.presetBtnActive : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              applyWidthPreset("1/2");
            }}
            title="Ubah lebar menjadi 1/2 (50%)"
          >
            1/2
          </button>
          <button
            type="button"
            className={`${styles.presetBtn} ${
              currentWidth === "100%" ? styles.presetBtnActive : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              applyWidthPreset("Full");
            }}
            title="Ubah lebar menjadi Penuh (100%)"
          >
            Full
          </button>
          <button
            type="button"
            className={styles.presetBtn}
            onClick={(e) => {
              e.stopPropagation();
              applyWidthPreset("Auto");
            }}
            title="Reset ukuran otomatis menyesuaikan isinya"
          >
            <RotateCcw size={10} />
          </button>

          {onRemove && (
            <button
              type="button"
              className={styles.presetBtn}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Hapus widget dari dashboard"
              style={{ color: "#d92d20", borderColor: "#fca5a5", marginLeft: "4px" }}
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Widget Content Body */}
      <div className={styles.widgetInnerContent}>{children}</div>

      {/* Resize Handle: Right (Horizontal only) */}
      <div
        className={`${styles.resizeHandleRight} ${
          isResizing === "horizontal" ? styles.isResizingHorizontal : ""
        }`}
        onMouseDown={(e) => handleResizeStart(e, "horizontal")}
        title="Tarik ke kiri/kanan untuk mengubah lebar secara bebas"
      />

      {/* Resize Handle: Bottom (Vertical only) */}
      <div
        className={`${styles.resizeHandleBottom} ${
          isResizing === "vertical" ? styles.isResizingVertical : ""
        }`}
        onMouseDown={(e) => handleResizeStart(e, "vertical")}
        title="Tarik ke atas/bawah untuk mengubah tinggi secara bebas"
      />

      {/* Resize Handle: Bottom-Right Corner (2D Both Horizontal & Vertical) */}
      <div
        className={`${styles.resizeHandleCorner} ${
          isResizing === "both" ? styles.isResizingBoth : ""
        }`}
        onMouseDown={(e) => handleResizeStart(e, "both")}
        title="Tarik sudut ini untuk memperbesar/memperkecil horizontal & vertikal secara bebas"
      >
        <div className={styles.cornerLines} />
      </div>

      {/* Live Size Tooltip while dragging resize handles */}
      {livePixelSize && (
        <div className={styles.sizeTooltipBadge}>
          {livePixelSize.w}px × {livePixelSize.h}px
        </div>
      )}

      {/* Live Position Tooltip while moving */}
      {isMoving && (
        <div className={styles.positionTooltipBadge}>
          📍 X: {posX}px · Y: {posY}px
        </div>
      )}
    </div>
  );
}
