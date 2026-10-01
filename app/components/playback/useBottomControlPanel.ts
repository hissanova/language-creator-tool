"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useBottomControlPanel(
  registerForAutoFollow: (element: HTMLDivElement | null) => void,
) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [obstruction, setObstruction] = useState(0);

  const measure = useCallback(() => {
    const rect = elementRef.current?.getBoundingClientRect();
    setObstruction(rect ? Math.max(0, window.innerHeight - rect.top) : 0);
  }, []);

  const register = useCallback((element: HTMLDivElement | null) => {
    elementRef.current = element;
    registerForAutoFollow(element);
    if (element) measure();
    else setObstruction(0);
  }, [measure, registerForAutoFollow]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return { register, obstruction };
}
