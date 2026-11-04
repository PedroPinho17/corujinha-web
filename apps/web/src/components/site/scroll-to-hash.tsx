"use client";

import { useEffect } from "react";

/**
 * Next tries to scroll to the hash while the route's loading state is showing, when the target
 * section does not exist yet, so links like /#contact from another page stay at the top.
 * Rendered inside the page: its effect only runs once the sections are in the DOM.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  return null;
}
