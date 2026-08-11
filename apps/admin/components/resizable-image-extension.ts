import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ResizableImageNode } from "@/components/resizable-image-node";
import { isValidImageWidth } from "@/src/blog/editor-controls";

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: undefined,
        parseHTML: (element) => {
          const width = Number(element.getAttribute("data-image-width"));
          return isValidImageWidth(width) ? width : undefined;
        },
        renderHTML: (attributes) => isValidImageWidth(attributes.width) ? { "data-image-width": attributes.width } : {},
      },
      height: { default: undefined, rendered: false },
      // Recognize old editor documents without adding a null legacy value to new JSON.
      displaySize: { default: undefined, rendered: false },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNode);
  },
});
