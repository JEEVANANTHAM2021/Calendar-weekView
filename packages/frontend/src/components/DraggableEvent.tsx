import { useRef, useState, type ReactNode, type CSSProperties } from 'react';
import type { EventDTO } from '../api/events';

interface DraggableEventProps {
  event: EventDTO;
  style?: CSSProperties;
  children: ReactNode;
  onDragStart?: (event: EventDTO) => void;
  onDrag?: (event: EventDTO, deltaY: number) => void;
  onDragEnd?: (event: EventDTO, deltaY: number) => void;
}

export default function DraggableEvent({
  event,
  style,
  children,
  onDragStart,
  onDrag,
  onDragEnd
}: DraggableEventProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [currentDeltaY, setCurrentDeltaY] = useState(0);

  const startYRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;

    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);

    startYRef.current = e.clientY;
    activePointerIdRef.current = e.pointerId;
    setIsDragging(true);
    setCurrentDeltaY(0);

    onDragStart?.(event);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    if (startYRef.current == null) return;

    const deltaY = e.clientY - startYRef.current;
    setCurrentDeltaY(deltaY);
    onDrag?.(event, deltaY);
  }

  function finishDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    if (activePointerIdRef.current !== e.pointerId) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    const finalDeltaY = currentDeltaY;
    setIsDragging(false);
    setCurrentDeltaY(0);
    startYRef.current = null;
    activePointerIdRef.current = null;

    onDragEnd?.(event, finalDeltaY);
  }

  const combinedStyle: CSSProperties = {
    ...style,
    transform: isDragging ? `translateY(${currentDeltaY}px)` : style?.transform,
    cursor: isDragging ? 'grabbing' : 'grab',
    pointerEvents: 'auto'
  };

  return (
    <div
      style={combinedStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {children}
    </div>
  );
}
