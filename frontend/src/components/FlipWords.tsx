"use client";

import { useState, useEffect } from "react";

type Props = {
  words: string[];
  duration?: number;
  className?: string;
};

export function FlipWords({ words, duration = 3000, className }: Props) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 380);
    }, duration);
    return () => clearInterval(id);
  }, [duration, words.length]);

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.96)",
        filter: visible ? "blur(0px)" : "blur(6px)",
        transition: "opacity 0.38s ease, transform 0.38s ease, filter 0.38s ease",
        willChange: "opacity, transform, filter",
      }}
    >
      {words[index]}
    </span>
  );
}
