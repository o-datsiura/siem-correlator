import { useEffect } from "react";

export const useWindowDragDropBoundary = (): void => {
  useEffect(() => {
    const handleDragOver = (event: DragEvent): void => {
      event.preventDefault();
    };

    const handleDrop = (event: DragEvent): void => {
      event.preventDefault();
    };

    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, []);
};
