"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useRef } from "react";
import { clampImageWidth, imageWidthFromAttributes } from "@/src/blog/editor-controls";

const handles = ["nw", "ne", "se", "sw", "e", "w"] as const;

export function ResizableImageNode({ node, updateAttributes, selected }: NodeViewProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const width = imageWidthFromAttributes(node.attrs.width, node.attrs.displaySize);

  const beginResize = (event: React.PointerEvent<HTMLButtonElement>, handle: typeof handles[number]) => {
    event.preventDefault();
    event.stopPropagation();
    const container = wrapper.current?.closest(".editor-surface");
    if (!(container instanceof HTMLElement)) return;
    const startX = event.clientX;
    const startWidth = width;
    const containerWidth = container.getBoundingClientRect().width;
    const direction = handle.includes("w") ? -1 : 1;

    const move = (moveEvent: PointerEvent) => {
      const deltaPercent = ((moveEvent.clientX - startX) / containerWidth) * 100 * direction;
      updateAttributes({ width: clampImageWidth(startWidth + deltaPercent), displaySize: null });
    };
    const finish = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish, { once: true });
    window.addEventListener("pointercancel", finish, { once: true });
  };

  return (
    <NodeViewWrapper ref={wrapper} className={`resizable-image${selected ? " is-selected" : ""}`} style={{ width: `${width}%` }} data-drag-handle>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={node.attrs.src} alt={node.attrs.alt ?? ""} title={node.attrs.title ?? undefined} draggable={false} />
      {selected ? handles.map((handle) => <button key={handle} className={`resize-handle handle-${handle}`} type="button" aria-label={`Resize image from ${handle}`} onPointerDown={(event) => beginResize(event, handle)} />) : null}
    </NodeViewWrapper>
  );
}
