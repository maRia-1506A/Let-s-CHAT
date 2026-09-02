import { useState, useEffect } from "react";

export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState(() => {
    if (typeof window !== "undefined" && window.visualViewport) {
      return window.visualViewport.height;
    }
    if (typeof window !== "undefined") {
      return window.innerHeight;
    }
    return 0;
  });

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateViewport = () => {
      const vv = window.visualViewport;
      const currentHeight = vv ? vv.height : window.innerHeight;
      setViewportHeight(currentHeight);

      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Keyboard is likely open if visualViewport height is smaller than window innerHeight
        const heightDiff = window.innerHeight - currentHeight;
        setIsKeyboardOpen(heightDiff > 150);

        // Keep body at top to prevent mobile browser scroll shifts
        if (vv && vv.offsetTop > 0) {
          window.scrollTo(0, 0);
        }
      } else {
        setIsKeyboardOpen(false);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewport);
      window.visualViewport.addEventListener("scroll", updateViewport);
    } else {
      window.addEventListener("resize", updateViewport);
    }

    updateViewport();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateViewport);
        window.visualViewport.removeEventListener("scroll", updateViewport);
      } else {
        window.removeEventListener("resize", updateViewport);
      }
    };
  }, []);

  return { viewportHeight, isKeyboardOpen };
}
