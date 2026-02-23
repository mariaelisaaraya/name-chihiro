// src/components/chihiro/SpiritWorldBackground.jsx
// Animated Spirit World / Spirited Away background
// Only renders when Chihiro activity is active

import React, { useEffect } from "react";
import "./chihiro.css";

export default function SpiritWorldBackground({ active = false }) {
  useEffect(() => {
    const body = document.body;
    const root = document.getElementById("root");
    if (active) {
      body.classList.add("activity-chihiro");
      if (root) root.classList.add("activity-chihiro");
    } else {
      body.classList.remove("activity-chihiro");
      if (root) root.classList.remove("activity-chihiro");
    }
    return () => {
      body.classList.remove("activity-chihiro");
      if (root) root.classList.remove("activity-chihiro");
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className="spirit-world-bg"
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
    >
      {/* Night sky gradient */}
      <div className="spirit-sky" />

      {/* Stars */}
      <div className="spirit-stars" />

      {/* Floating spirit orbs */}
      <div className="spirit-orb" />
      <div className="spirit-orb" />
      <div className="spirit-orb" />
      <div className="spirit-orb" />
      <div className="spirit-orb" />

      {/* Bathhouse silhouette */}
      <div className="spirit-castle" />

      {/* Water */}
      <div className="spirit-water" />

      {/* Moon */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          right: "15%",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 35%, #fffde0, #f0d880 40%, #c8a830 100%)",
          boxShadow:
            "0 0 20px rgba(240, 200, 100, 0.4), 0 0 60px rgba(240, 200, 100, 0.1)",
          opacity: 0.9,
        }}
      />

      {/* Subtle vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
