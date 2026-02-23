// src/pages/HomePage.jsx
// Landing page — "Chihiro's Lost Name"
// Estética: Spirited Away · aguas profundas · linternas · mundo espiritual

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* ─── FONTS ───────────────────────────────────────────────────── */
if (typeof document !== "undefined") {
  const href = "https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@300;400;700&family=DM+Mono:wght@300;400;500&display=swap";
  if (!document.querySelector(`link[href="${href}"]`)) {
    const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href });
    document.head.appendChild(link);
  }
}

/* ─── CSS ─────────────────────────────────────────────────────── */
const STYLES = `
  @keyframes float-up {
    0%   { transform: translateY(0) scale(1); opacity: 0; }
    10%  { opacity: 0.7; }
    90%  { opacity: 0.4; }
    100% { transform: translateY(-110vh) scale(0.6); opacity: 0; }
  }
  @keyframes glow-pulse {
    0%,100% { text-shadow: 0 0 20px rgba(240,192,96,0.4), 0 0 60px rgba(240,192,96,0.15); }
    50%      { text-shadow: 0 0 40px rgba(240,192,96,0.7), 0 0 120px rgba(240,192,96,0.3); }
  }
  @keyframes kanji-reveal {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 0.06; transform: translateY(0); }
  }
  @keyframes cursor-blink {
    0%,100% { opacity: 1; } 50% { opacity: 0; }
  }
  @keyframes shimmer-line {
    0%   { transform: translateX(-150%); }
    100% { transform: translateX(250%); }
  }
  @keyframes card-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-8px); }
  }
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes loader-fill {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes stars-drift {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  @keyframes water-wave {
    0%,100% { opacity: 0.07; transform: scaleX(1) translateX(0); }
    50%      { opacity: 0.14; transform: scaleX(1.03) translateX(2px); }
  }

  .lr * { box-sizing: border-box; }
  .lr {
    min-height: 100vh;
    background: #030510;
    color: #c8e0ff;
    font-family: 'DM Mono', 'Cascadia Code', monospace;
    overflow-x: hidden;
    position: relative;
  }

  /* Loader */
  .lr-loader {
    position: fixed; inset: 0; z-index: 9999;
    background: #030510;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 28px;
    transition: opacity 0.9s ease, visibility 0.9s ease;
  }
  .lr-loader.out { opacity: 0; visibility: hidden; pointer-events: none; }
  .lr-loader-kanji {
    font-family: 'Noto Serif JP', serif;
    font-size: clamp(72px, 14vw, 128px);
    color: #f0c060;
    animation: glow-pulse 2s ease-in-out infinite;
    line-height: 1; user-select: none;
  }
  .lr-loader-track {
    width: min(300px, 65vw); height: 1px;
    background: rgba(240,192,96,0.12); overflow: hidden;
  }
  .lr-loader-fill {
    height: 100%;
    background: linear-gradient(90deg, #f0c060, #40c8c0);
    animation: loader-fill 2.2s cubic-bezier(0.4,0,0.2,1) forwards;
  }
  .lr-loader-label {
    font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
    color: rgba(240,192,96,0.5);
  }

  /* BG */
  .lr-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background:
      radial-gradient(ellipse 80% 55% at 50% 0%,   rgba(30,10,80,0.55)  0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 85% 100%,  rgba(10,40,80,0.45)  0%, transparent 60%),
      linear-gradient(180deg, #03050f 0%, #060c1a 40%, #08111f 100%);
  }
  .lr-stars {
    position: fixed; top: 0; left: 0; width: 200%; height: 100vh;
    z-index: 0; pointer-events: none; opacity: 0.7;
    animation: stars-drift 90s linear infinite;
    background-image:
      radial-gradient(1px   1px   at 8%  12%, rgba(255,255,255,0.6) 0%,transparent 100%),
      radial-gradient(1px   1px   at 22% 6%,  rgba(255,255,255,0.4) 0%,transparent 100%),
      radial-gradient(1.5px 1.5px at 38% 20%, rgba(200,224,255,0.5) 0%,transparent 100%),
      radial-gradient(1px   1px   at 52% 4%,  rgba(255,255,255,0.3) 0%,transparent 100%),
      radial-gradient(1px   1px   at 67% 16%, rgba(255,255,255,0.5) 0%,transparent 100%),
      radial-gradient(1.5px 1.5px at 81% 9%,  rgba(240,192,96,0.35) 0%,transparent 100%),
      radial-gradient(1px   1px   at 91% 23%, rgba(255,255,255,0.3) 0%,transparent 100%),
      radial-gradient(1px   1px   at 14% 42%, rgba(255,255,255,0.2) 0%,transparent 100%),
      radial-gradient(1px   1px   at 58% 35%, rgba(200,224,255,0.3) 0%,transparent 100%),
      radial-gradient(1px   1px   at 76% 40%, rgba(255,255,255,0.4) 0%,transparent 100%),
      radial-gradient(1px   1px   at 44% 52%, rgba(144,96,224,0.3)  0%,transparent 100%),
      radial-gradient(1px   1px   at 30% 60%, rgba(64,200,192,0.25) 0%,transparent 100%);
  }
  .lr-orb {
    position: fixed; z-index: 0; pointer-events: none;
    border-radius: 50%;
    animation: float-up linear infinite;
  }
  .lr-wline {
    position: fixed; z-index: 0; pointer-events: none;
    height: 1px; left: 0; right: 0;
    background: linear-gradient(90deg, transparent, rgba(64,200,192,0.25), rgba(100,180,255,0.18), transparent);
    animation: water-wave ease-in-out infinite;
  }

  /* Navbar */
  .lr-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    height: 60px; padding: 0 40px;
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(180deg, rgba(3,5,16,0.96) 0%, rgba(3,5,16,0) 100%);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(100,180,255,0.05);
  }
  .lr-nav-logo {
    display: flex; align-items: center; gap: 12px;
    text-decoration: none;
  }
  .lr-nav-kanji {
    font-family: 'Noto Serif JP', serif;
    font-size: 22px; color: #f0c060;
    animation: glow-pulse 4s ease-in-out infinite;
  }
  .lr-nav-wordmark {
    font-size: 11px; letter-spacing: 4px; text-transform: uppercase;
    color: rgba(200,224,255,0.4); font-family: 'DM Mono', monospace;
  }
  .lr-nav-links {
    display: flex; align-items: center; gap: 32px;
    list-style: none; margin: 0; padding: 0;
  }
  .lr-nav-links a, .lr-nav-links button {
    color: rgba(200,224,255,0.45); text-decoration: none;
    font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    transition: color 0.2s; background: none; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace; padding: 0;
  }
  .lr-nav-links a:hover, .lr-nav-links button:hover { color: #f0c060; }
  .lr-nav-cta {
    padding: 7px 18px !important;
    border: 1px solid rgba(240,192,96,0.3) !important;
    color: #f0c060 !important;
    border-radius: 1px;
  }
  .lr-nav-cta:hover { background: rgba(240,192,96,0.08) !important; }
  .lr-nav-burger { display: none !important; font-size: 20px !important; padding: 4px !important; }
  @media (max-width: 767px) {
    .lr-nav { padding: 0 20px; }
    .lr-nav-links { display: none; }
    .lr-nav-burger { display: flex !important; }
    .lr-nav-wordmark { display: none; }
  }
  .lr-mobile-menu {
    position: fixed; top: 60px; left: 0; right: 0; z-index: 99;
    background: rgba(3,5,16,0.98);
    border-bottom: 1px solid rgba(100,180,255,0.08);
    padding: 28px 24px 36px;
    display: flex; flex-direction: column; gap: 22px;
  }
  .lr-mobile-menu a, .lr-mobile-menu button {
    color: rgba(200,224,255,0.55); font-size: 13px;
    letter-spacing: 2px; text-transform: uppercase;
    text-decoration: none; background: none; border: none;
    cursor: pointer; font-family: 'DM Mono', monospace;
    padding: 0; text-align: left;
  }

  /* Hero */
  .lr-hero {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center; padding: 120px 24px 100px;
  }
  .lr-hero-kanjibg {
    position: absolute; inset: 0; z-index: -1;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none; overflow: hidden;
  }
  .lr-hero-kanjibg span {
    font-family: 'Noto Serif JP', serif;
    font-size: clamp(180px, 32vw, 340px); color: #f0c060;
    opacity: 0; line-height: 1; user-select: none;
    animation: kanji-reveal 1.4s ease forwards 0.6s;
  }
  .lr-hero-eyebrow {
    font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
    color: rgba(240,192,96,0.55); margin-bottom: 22px;
    opacity: 0; animation: fade-in-up 0.8s ease forwards 0.9s;
  }
  .lr-hero-title {
    font-family: 'Noto Serif JP', serif;
    font-size: clamp(40px, 7.5vw, 88px); font-weight: 700;
    line-height: 1.05; margin: 0 0 10px;
    background: linear-gradient(130deg, #f0c060 0%, #e8d090 25%, #40c8c0 65%, #c8e0ff 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    opacity: 0; animation: fade-in-up 0.9s ease forwards 1.05s;
  }
  .lr-hero-sub {
    font-family: 'Noto Serif JP', serif;
    font-size: clamp(18px, 3.5vw, 36px); font-weight: 300;
    color: rgba(200,224,255,0.45); margin: 0 0 36px; letter-spacing: 2px;
    opacity: 0; animation: fade-in-up 0.8s ease forwards 1.15s;
  }
  .lr-hero-desc {
    max-width: 500px; font-size: 13px; line-height: 1.9;
    color: rgba(200,224,255,0.55); margin: 0 auto 52px;
    font-weight: 300;
    opacity: 0; animation: fade-in-up 0.8s ease forwards 1.3s;
  }
  .lr-hero-btns {
    display: flex; gap: 16px; align-items: center;
    justify-content: center; flex-wrap: wrap;
    opacity: 0; animation: fade-in-up 0.8s ease forwards 1.5s;
  }
  .lr-scroll-hint {
    position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    color: rgba(200,224,255,0.25); font-size: 9px; letter-spacing: 3px; text-transform: uppercase;
    cursor: pointer;
    opacity: 0; animation: fade-in-up 0.6s ease forwards 2.2s;
  }
  .lr-scroll-line {
    width: 1px; height: 44px;
    background: linear-gradient(180deg, rgba(100,180,255,0.45), transparent);
  }

  /* Buttons */
  .btn-p {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 34px;
    background: linear-gradient(135deg, rgba(240,192,96,0.12), rgba(64,200,192,0.08));
    border: 1px solid rgba(240,192,96,0.45);
    color: #f0c060; font-family: 'DM Mono', monospace;
    font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    text-decoration: none; cursor: pointer;
    position: relative; overflow: hidden;
    transition: border-color 0.3s, background 0.3s, transform 0.2s;
    border-radius: 1px;
  }
  .btn-p::before {
    content: ''; position: absolute; top: 0; left: -150%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(240,192,96,0.1), transparent);
    animation: shimmer-line 3.5s ease infinite;
  }
  .btn-p:hover { border-color: rgba(240,192,96,0.75); background: linear-gradient(135deg,rgba(240,192,96,0.2),rgba(64,200,192,0.12)); transform: translateY(-2px); }
  .btn-s {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 15px 26px;
    border: 1px solid rgba(100,180,255,0.18); background: transparent;
    color: rgba(200,224,255,0.5); font-family: 'DM Mono', monospace;
    font-size: 11px; letter-spacing: 2px; text-transform: uppercase;
    text-decoration: none; cursor: pointer;
    transition: border-color 0.3s, color 0.3s; border-radius: 1px;
  }
  .btn-s:hover { border-color: rgba(100,180,255,0.45); color: rgba(200,224,255,0.85); }

  /* Dividers */
  .lr-div {
    height: 1px; margin: 0;
    background: linear-gradient(90deg, transparent, rgba(100,180,255,0.08), transparent);
  }

  /* Section */
  .lr-sec {
    position: relative; z-index: 1;
    padding: 96px 24px; max-width: 1100px; margin: 0 auto;
  }
  .lr-sec-label {
    font-size: 10px; letter-spacing: 4px; text-transform: uppercase;
    color: rgba(240,192,96,0.45); margin-bottom: 14px;
  }
  .lr-sec-title {
    font-family: 'Noto Serif JP', serif;
    font-size: clamp(26px, 4.5vw, 50px); font-weight: 700;
    line-height: 1.2; color: #e8f0ff; margin: 0 0 18px;
  }
  .lr-sec-title em {
    font-style: normal;
    background: linear-gradient(135deg, #f0c060, #40c8c0);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lr-body {
    font-size: 13px; line-height: 1.9; color: rgba(200,224,255,0.55);
    font-weight: 300; max-width: 580px; margin-bottom: 20px;
  }

  /* Story */
  .lr-story-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 72px; align-items: center; margin-top: 52px;
  }
  .lr-story-orb {
    display: flex; align-items: center; justify-content: center;
    animation: card-float 7s ease-in-out infinite;
  }
  .lr-story-ring {
    width: 220px; height: 220px; border-radius: 50%;
    border: 1px solid rgba(240,192,96,0.18);
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .lr-story-ring::before { content:''; position:absolute; inset:-18px; border-radius:50%; border:1px solid rgba(64,200,192,0.09); }
  .lr-story-ring::after  { content:''; position:absolute; inset:-36px; border-radius:50%; border:1px solid rgba(100,180,255,0.05); }
  .lr-story-kanji {
    font-family: 'Noto Serif JP', serif;
    font-size: 88px; color: #f0c060; line-height: 1;
    animation: glow-pulse 3.5s ease-in-out infinite;
  }
  @media (max-width: 767px) { .lr-story-grid { grid-template-columns:1fr; } .lr-story-orb { display:none; } }

  /* Steps */
  .lr-steps { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; margin-top:52px; }
  @media (max-width: 767px)  { .lr-steps { grid-template-columns:1fr; } }
  @media (min-width:768px) and (max-width:1024px) { .lr-steps { grid-template-columns:1fr 1fr; } }
  .lr-step {
    padding: 36px 28px;
    background: rgba(8,14,30,0.7);
    border: 1px solid rgba(100,180,255,0.07);
    position: relative; overflow: hidden;
    transition: border-color 0.3s, background 0.3s;
  }
  .lr-step:hover { border-color: rgba(240,192,96,0.28); background: rgba(12,20,44,0.9); }
  .lr-step-num { font-family:'Noto Serif JP',serif; font-size:46px; color:rgba(240,192,96,0.12); line-height:1; margin-bottom:18px; font-weight:700; }
  .lr-step-icon { font-size:26px; margin-bottom:14px; }
  .lr-step-title { font-family:'Noto Serif JP',serif; font-size:17px; color:#e8f0ff; margin:0 0 10px; font-weight:700; }
  .lr-step-desc { font-size:12px; line-height:1.85; color:rgba(200,224,255,0.45); font-weight:300; }
  .lr-step-tag { display:inline-block; margin-top:16px; font-size:9px; letter-spacing:2px; text-transform:uppercase; padding:3px 10px; border:1px solid rgba(64,200,192,0.22); color:rgba(64,200,192,0.65); border-radius:1px; }

  /* Terminal */
  .lr-term { margin-top:56px; background:rgba(4,8,20,0.96); border:1px solid rgba(100,180,255,0.1); border-radius:4px; overflow:hidden; }
  .lr-term-bar { display:flex; align-items:center; gap:8px; padding:11px 16px; background:rgba(8,14,30,0.8); border-bottom:1px solid rgba(100,180,255,0.07); }
  .lr-term-dot { width:10px; height:10px; border-radius:50%; }
  .lr-term-title { flex:1; text-align:center; font-size:10px; letter-spacing:2px; text-transform:uppercase; color:rgba(200,224,255,0.25); }
  .lr-term-body { padding:22px 22px 26px; font-size:12px; line-height:2.1; }
  .t-p { color:rgba(64,200,192,0.75); }
  .t-c { color:#c8e0ff; }
  .t-o { color:rgba(200,224,255,0.4); padding-left:14px; display:block; }
  .t-h { color:rgba(240,192,96,0.55); padding-left:14px; display:block; }
  .t-cur { display:inline-block; width:7px; height:13px; background:rgba(64,200,192,0.75); vertical-align:middle; animation:cursor-blink 1s step-end infinite; }

  /* Missions */
  .lr-missions { display:flex; flex-direction:column; gap:1px; margin-top:48px; }
  .lr-mission {
    display:grid; grid-template-columns:56px 1fr auto;
    gap:24px; align-items:center;
    padding:22px 28px;
    background:rgba(8,14,30,0.5);
    border:1px solid rgba(100,180,255,0.06);
    position:relative; overflow:hidden;
    transition:background 0.3s, border-color 0.3s;
  }
  .lr-mission:hover { background:rgba(12,20,44,0.8); border-color:rgba(100,180,255,0.14); }
  .lr-mission::after { content:''; position:absolute; left:0; top:0; bottom:0; width:2px; background:linear-gradient(180deg,transparent,var(--mc,#f0c060),transparent); opacity:0; transition:opacity 0.3s; }
  .lr-mission:hover::after { opacity:1; }
  .lr-mission-num { font-family:'Noto Serif JP',serif; font-size:26px; color:rgba(240,192,96,0.18); text-align:center; font-weight:700; }
  .lr-mission-title { font-family:'Noto Serif JP',serif; font-size:15px; color:#e8f0ff; margin:0 0 5px; font-weight:700; }
  .lr-mission-desc { font-size:11px; color:rgba(200,224,255,0.4); font-weight:300; line-height:1.65; }
  .lr-mission-badge { font-size:9px; letter-spacing:1.5px; text-transform:uppercase; padding:4px 12px; border-radius:1px; white-space:nowrap; }
  @media (max-width:767px) { .lr-mission { grid-template-columns:40px 1fr; } .lr-mission-badge { display:none; } }

  /* Tech */
  .lr-tech { display:flex; flex-wrap:wrap; gap:10px; margin-top:40px; }
  .lr-tech-pill {
    display:flex; align-items:center; gap:8px; padding:9px 16px;
    background:rgba(8,14,30,0.8); border:1px solid rgba(100,180,255,0.09);
    font-size:11px; letter-spacing:1px; color:rgba(200,224,255,0.6);
    transition:border-color 0.2s, color 0.2s; border-radius:1px;
  }
  .lr-tech-pill:hover { border-color:rgba(240,192,96,0.28); color:#f0c060; }
  .lr-tech-dot { width:6px; height:6px; border-radius:50%; background:currentColor; opacity:0.5; flex-shrink:0; }

  /* CTA */
  .lr-cta {
    position:relative; z-index:1;
    padding:120px 24px; text-align:center; overflow:hidden;
  }
  .lr-cta-glow {
    position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
    width:600px; height:360px; border-radius:50%;
    background:radial-gradient(ellipse, rgba(144,96,224,0.1) 0%, transparent 70%);
    pointer-events:none;
  }
  .lr-cta-title { font-family:'Noto Serif JP',serif; font-size:clamp(30px,5.5vw,60px); font-weight:700; color:#e8f0ff; margin:0 0 18px; line-height:1.2; }
  .lr-cta-body { font-size:13px; color:rgba(200,224,255,0.45); font-weight:300; margin:0 auto 44px; max-width:460px; line-height:1.85; }

  /* Footer */
  .lr-footer {
    position:relative; z-index:1;
    padding:64px 40px 44px;
    border-top:1px solid rgba(100,180,255,0.06);
  }
  .lr-footer-grid {
    display:grid; grid-template-columns:2fr 1fr 1fr 1fr;
    gap:48px; max-width:1100px; margin:0 auto 48px;
  }
  .lr-footer-brand-name { font-family:'Noto Serif JP',serif; font-size:20px; color:#f0c060; animation:glow-pulse 4s ease-in-out infinite; margin-bottom:12px; }
  .lr-footer-brand-desc { font-size:11px; line-height:1.85; color:rgba(200,224,255,0.3); font-weight:300; max-width:260px; }
  .lr-footer-col-title { font-size:10px; letter-spacing:3px; text-transform:uppercase; color:rgba(240,192,96,0.4); margin-bottom:18px; }
  .lr-footer-links { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:11px; }
  .lr-footer-links a { font-size:11px; color:rgba(200,224,255,0.3); text-decoration:none; transition:color 0.2s; }
  .lr-footer-links a:hover { color:rgba(240,192,96,0.75); }
  .lr-footer-bottom { max-width:1100px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; padding-top:24px; border-top:1px solid rgba(100,180,255,0.05); flex-wrap:wrap; gap:12px; }
  .lr-footer-copy { font-size:10px; color:rgba(200,224,255,0.18); letter-spacing:1px; }
  .lr-footer-badges { display:flex; gap:10px; }
  .lr-footer-badge { font-size:9px; letter-spacing:2px; text-transform:uppercase; padding:3px 10px; border:1px solid rgba(100,180,255,0.1); color:rgba(200,224,255,0.25); border-radius:1px; }
  @media (max-width:767px) { .lr-footer-grid { grid-template-columns:1fr 1fr; gap:28px; } .lr-footer { padding:48px 24px 36px; } }
  @media (max-width:480px) { .lr-footer-grid { grid-template-columns:1fr; } }

  /* Scroll reveal */
  .rev { opacity:0; transform:translateY(22px); transition:opacity 0.7s ease, transform 0.7s ease; }
  .rev.vis { opacity:1; transform:translateY(0); }
  .rd1 { transition-delay:0.1s; } .rd2 { transition-delay:0.2s; } .rd3 { transition-delay:0.3s; } .rd4 { transition-delay:0.4s; }
`;

/* ─── SCROLL REVEAL ────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".rev");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("vis"); }),
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

/* ─── AMBIENT PARTICLES ──────────────────────────── */
const ORBS = [
  { s:6,  l:"9%",  dur:18, del:0,  c:"rgba(200,224,255,0.55)" },
  { s:4,  l:"24%", dur:23, del:4,  c:"rgba(240,192,96,0.45)"  },
  { s:8,  l:"41%", dur:27, del:8,  c:"rgba(64,200,192,0.5)"   },
  { s:3,  l:"57%", dur:21, del:2,  c:"rgba(200,224,255,0.4)"  },
  { s:5,  l:"73%", dur:25, del:13, c:"rgba(240,192,96,0.38)"  },
  { s:7,  l:"87%", dur:19, del:6,  c:"rgba(144,96,224,0.42)"  },
  { s:4,  l:"32%", dur:29, del:16, c:"rgba(64,200,192,0.32)"  },
  { s:3,  l:"66%", dur:22, del:9,  c:"rgba(200,224,255,0.32)" },
  { s:5,  l:"50%", dur:31, del:20, c:"rgba(240,192,96,0.3)"   },
];
const WLINES = [
  { top:"33%", dur:9,  del:0 },
  { top:"54%", dur:12, del:3 },
  { top:"71%", dur:10, del:7 },
];

export default function HomePage() {
  const { i18n } = useTranslation();
  const [loaded, setLoaded]   = useState(false);
  const [menuOpen, setMenu]   = useState(false);
  useReveal();

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 2450); return () => clearTimeout(t); }, []);

  const lang    = i18n.language?.startsWith("en") ? "en" : "es";
  const toggleL = () => i18n.changeLanguage(lang === "en" ? "es" : "en");
  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior:"smooth" }); setMenu(false); };

  /* ── COPY ─────────────────────────────────────── */
  const C = {
    es: {
      loaderLabel: "Cruzando el umbral…",
      eyebrow:  "Stellar Hacks · ZK Gaming Edition",
      titleMain:"千尋の名前",
      titleSub: "Chihiro's Lost Name",
      heroDesc: "Yubaba robó tu nombre. Para recuperarlo deberás dominar Git, crear ramas sagradas y probar con criptografía de conocimiento cero que recordás quién sos.",
      heroCta:  "Comenzar el ritual",
      heroSec:  "Cómo funciona",
      navPlay:"Jugar", navHow:"Cómo funciona", navMiss:"Misiones",
      storyLabel:"La historia", storyTitle:"El mundo espiritual te espera",
      storyBody:"Chihiro cruzó el umbral y olvidó su nombre. Vos sos su única esperanza.\n\nEn este mundo, los contratos de Soroban guardan secretos, los circuitos ZK prueban verdades sin revelarlas, y cada branch de Git es un paso hacia la libertad.",
      howLabel:"Cómo funciona", howTitle:"Tres rituales. Un nombre.",
      steps:[
        { num:"一", icon:"🌿", title:"La Rama Sagrada",    desc:"Inicializá el repositorio y creá la rama `chihiro-rescue`. Cada branch es un hilo del destino que no puede romperse.", tag:"git branch" },
        { num:"二", icon:"📜", title:"Los Compromisos",    desc:"Realizá los tres commits rituales en el orden exacto. El contrato de Yubaba verifica cada mensaje en la cadena.",        tag:"git commit" },
        { num:"三", icon:"🔮", title:"La Prueba ZK",       desc:"Conectá tu wallet Freighter, calculá el hash de tu nombre secreto con Poseidon2 y generá la prueba on-chain en Stellar.",tag:"ZK Proof"   },
      ],
      missLabel:"Las misiones", missTitle:"El camino de regreso",
      missions:[
        { num:"01", title:"La Rama del Destino",    desc:"Inicializá el repositorio y creá la rama sagrada donde vivirá el ritual de rescate.",                             badge:"Git Branches", color:"#40c8c0" },
        { num:"02", title:"Los Tres Compromisos",   desc:"Realizá exactamente tres commits con los mensajes rituales que Yubaba exige.",                                    badge:"Git Commits",  color:"#f0c060" },
        { num:"03", title:"La Prueba del Nombre",   desc:"Demostrá mediante ZK proof que conocés el nombre de Chihiro sin revelarlo al contrato.",                         badge:"ZK + Stellar", color:"#9060e0" },
      ],
      techLabel:"Tecnología", techTitle:"El stack del mundo espiritual",
      ctaTitle:"¿Listo para cruzar el umbral?", ctaBody:"El ritual empieza cuando escribís el primer comando. No hay vuelta atrás.",
      ctaBtn:"Entrar al mundo espiritual",
      footerDesc:"Un experimento educativo que combina Git, ZK proofs y Stellar Soroban en una aventura narrativa basada en el universo de Studio Ghibli.",
      copy:"© 2025 gitBDB · Stellar Hacks: ZK Gaming",
    },
    en: {
      loaderLabel: "Crossing the threshold…",
      eyebrow:  "Stellar Hacks · ZK Gaming Edition",
      titleMain:"千尋の名前",
      titleSub: "Chihiro's Lost Name",
      heroDesc: "Yubaba stole your name. To get it back you must master Git, create sacred branches, and prove with zero-knowledge cryptography that you remember who you are.",
      heroCta:  "Begin the ritual",
      heroSec:  "How it works",
      navPlay:"Play", navHow:"How it works", navMiss:"Missions",
      storyLabel:"The story", storyTitle:"The spirit world awaits",
      storyBody:"Chihiro crossed the threshold and forgot her name. You are her only hope.\n\nIn this world, Soroban contracts guard secrets, ZK circuits prove truths without revealing them, and every Git branch is one step toward freedom.",
      howLabel:"How it works", howTitle:"Three rituals. One name.",
      steps:[
        { num:"一", icon:"🌿", title:"The Sacred Branch",  desc:"Initialize the repository and create the `chihiro-rescue` branch. Each branch is a thread of fate that cannot be broken.", tag:"git branch" },
        { num:"二", icon:"📜", title:"The Commitments",    desc:"Make the three ritual commits in the exact order. Yubaba's contract verifies every message on-chain.",                        tag:"git commit" },
        { num:"三", icon:"🔮", title:"The ZK Proof",       desc:"Connect your Freighter wallet, hash your secret name with Poseidon2, and generate the ZK proof on-chain in Stellar.",         tag:"ZK Proof"   },
      ],
      missLabel:"The missions", missTitle:"The way back",
      missions:[
        { num:"01", title:"The Branch of Fate",     desc:"Initialize the repository and create the sacred branch where the rescue ritual will live.",             badge:"Git Branches", color:"#40c8c0" },
        { num:"02", title:"The Three Commitments",  desc:"Make exactly three commits with the ritual messages that Yubaba demands.",                              badge:"Git Commits",  color:"#f0c060" },
        { num:"03", title:"The Name Proof",         desc:"Prove via ZK proof that you know Chihiro's name without revealing it to the contract.",                badge:"ZK + Stellar", color:"#9060e0" },
      ],
      techLabel:"Technology", techTitle:"The spirit world stack",
      ctaTitle:"Ready to cross the threshold?", ctaBody:"The ritual begins when you type the first command. There is no going back.",
      ctaBtn:"Enter the spirit world",
      footerDesc:"An educational experiment combining Git, ZK proofs, and Stellar Soroban in a narrative adventure set in the Studio Ghibli universe.",
      copy:"© 2025 gitBDB · Stellar Hacks: ZK Gaming",
    },
  }[lang];

  const TECH = [
    { dot:"#40c8c0", label:"Stellar Soroban" }, { dot:"#9060e0", label:"Noir UltraHonk" },
    { dot:"#f0c060", label:"ZK Proofs"       }, { dot:"#50d890", label:"isomorphic-git"  },
    { dot:"#6ab0e0", label:"React 19"         }, { dot:"#f0c060", label:"Vite 7"           },
    { dot:"#40c8c0", label:"Protocol 25"      }, { dot:"#c8e0ff", label:"TypeScript"        },
  ];

  return (
    <div className="lr">
      <style>{STYLES}</style>

      {/* Loader */}
      <div className={`lr-loader${loaded ? " out" : ""}`}>
        <div className="lr-loader-kanji">千</div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
          <div className="lr-loader-track"><div className="lr-loader-fill" /></div>
          <div className="lr-loader-label">{C.loaderLabel}</div>
        </div>
      </div>

      {/* Background */}
      <div className="lr-bg" />
      <div className="lr-stars" />
      {ORBS.map((o,i) => (
        <div key={i} className="lr-orb" style={{ width:o.s, height:o.s, left:o.l, bottom:"-10px",
          background:`radial-gradient(circle,${o.c},transparent)`,
          boxShadow:`0 0 ${o.s*3}px ${o.c}`,
          animationDuration:`${o.dur}s`, animationDelay:`${o.del}s` }} />
      ))}
      {WLINES.map((w,i) => (
        <div key={i} className="lr-wline" style={{ top:w.top, animationDuration:`${w.dur}s`, animationDelay:`${w.del}s` }} />
      ))}

      {/* Navbar */}
      <nav className="lr-nav">
        <Link to="/" className="lr-nav-logo">
          <span className="lr-nav-kanji">千</span>
          <span className="lr-nav-wordmark">gitBDB</span>
        </Link>
        <ul className="lr-nav-links">
          <li><a href="#how"      onClick={(e) => { e.preventDefault(); scrollTo("how"); }}>{C.navHow}</a></li>
          <li><a href="#missions" onClick={(e) => { e.preventDefault(); scrollTo("missions"); }}>{C.navMiss}</a></li>
          <li><button onClick={toggleL}>{lang === "es" ? "EN" : "ES"}</button></li>
          <li><Link to="/act/chihiro" className="lr-nav-cta">{C.navPlay} →</Link></li>
        </ul>
        <button className="lr-nav-burger lr-nav-links" onClick={() => setMenu(!menuOpen)}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {menuOpen && (
        <div className="lr-mobile-menu">
          <a href="#how"      onClick={() => scrollTo("how")}>{C.navHow}</a>
          <a href="#missions" onClick={() => scrollTo("missions")}>{C.navMiss}</a>
          <button onClick={toggleL} style={{ color:"rgba(200,224,255,0.45)" }}>{lang === "es" ? "EN" : "ES"}</button>
          <Link to="/act/chihiro" style={{ color:"#f0c060", border:"1px solid rgba(240,192,96,0.3)", padding:"10px 18px", display:"inline-block", letterSpacing:2, textTransform:"uppercase", fontSize:12, textDecoration:"none" }}>{C.navPlay} →</Link>
        </div>
      )}

      {/* Hero */}
      <section className="lr-hero">
        <div className="lr-hero-kanjibg"><span>{C.titleMain}</span></div>
        <div className="lr-hero-eyebrow">{C.eyebrow}</div>
        <h1 className="lr-hero-title">{C.titleMain}</h1>
        <h2 className="lr-hero-sub">{C.titleSub}</h2>
        <p className="lr-hero-desc">{C.heroDesc}</p>
        <div className="lr-hero-btns">
          <Link to="/act/chihiro" className="btn-p"><span>🌊</span>{C.heroCta}</Link>
          <button className="btn-s" onClick={() => scrollTo("how")}>{C.heroSec}</button>
        </div>
        <div className="lr-scroll-hint" onClick={() => scrollTo("story")}>
          <div className="lr-scroll-line" />
          <span>scroll</span>
        </div>
      </section>

      <div className="lr-div" />

      {/* Story */}
      <section className="lr-sec" id="story">
        <div className="rev"><div className="lr-sec-label">{C.storyLabel}</div><h2 className="lr-sec-title"><em>{C.storyTitle}</em></h2></div>
        <div className="lr-story-grid">
          <div className="rev rd1">
            {C.storyBody.split("\n\n").map((p,i) => <p key={i} className="lr-body">{p}</p>)}
          </div>
          <div className="lr-story-orb rev rd2">
            <div className="lr-story-ring"><span className="lr-story-kanji">千</span></div>
          </div>
        </div>
      </section>

      <div className="lr-div" />

      {/* How */}
      <section className="lr-sec" id="how">
        <div className="rev"><div className="lr-sec-label">{C.howLabel}</div><h2 className="lr-sec-title">{C.howTitle}</h2></div>
        <div className="lr-steps">
          {C.steps.map((s,i) => (
            <div key={i} className={`lr-step rev rd${i+1}`}>
              <div className="lr-step-num">{s.num}</div>
              <div className="lr-step-icon">{s.icon}</div>
              <h3 className="lr-step-title">{s.title}</h3>
              <p className="lr-step-desc">{s.desc}</p>
              <span className="lr-step-tag">{s.tag}</span>
            </div>
          ))}
        </div>
        {/* Terminal demo */}
        <div className="lr-term rev rd1">
          <div className="lr-term-bar">
            <div className="lr-term-dot" style={{background:"#e06060"}} />
            <div className="lr-term-dot" style={{background:"#f0c060"}} />
            <div className="lr-term-dot" style={{background:"#50d890"}} />
            <div className="lr-term-title">gitBDB · terminal</div>
          </div>
          <div className="lr-term-body">
            <div><span className="t-p">chihiro@spirit-world ~ $&nbsp;</span><span className="t-c">git init</span></div>
            <span className="t-o">{lang==="es" ? "Repositorio Git inicializado en /chihiro-repo/.git/" : "Initialized empty Git repository in /chihiro-repo/.git/"}</span>
            <span className="t-h">💡 {lang==="es" ? "git init crea la carpeta .git donde vive toda la historia" : "git init creates the .git folder where all history lives"}</span>
            <div style={{marginTop:8}}><span className="t-p">chihiro@spirit-world ~ $&nbsp;</span><span className="t-c">git checkout -b chihiro-rescue</span></div>
            <span className="t-o">{lang==="es" ? "Cambiado a nueva rama 'chihiro-rescue'" : "Switched to new branch 'chihiro-rescue'"}</span>
            <div style={{marginTop:8}}><span className="t-p">chihiro@spirit-world ~ $&nbsp;</span><span className="t-c">git commit -m "chihiro trabajó en las calderas"</span></div>
            <span className="t-o">[chihiro-rescue a4f2b91] chihiro trabajó en las calderas</span>
            <span className="t-h">✨ {lang==="es" ? "Misión 2 completada · 2/3 commits" : "Mission 2 complete · 2/3 commits"}</span>
            <div style={{marginTop:8}}><span className="t-p">chihiro@spirit-world ~ $&nbsp;</span><span className="t-cur" /></div>
          </div>
        </div>
      </section>

      <div className="lr-div" />

      {/* Missions */}
      <section className="lr-sec" id="missions">
        <div className="rev"><div className="lr-sec-label">{C.missLabel}</div><h2 className="lr-sec-title">{C.missTitle}</h2></div>
        <div className="lr-missions">
          {C.missions.map((m,i) => (
            <div key={i} className={`lr-mission rev rd${i+1}`} style={{"--mc":m.color}}>
              <div className="lr-mission-num">{m.num}</div>
              <div>
                <div className="lr-mission-title">{m.title}</div>
                <div className="lr-mission-desc">{m.desc}</div>
              </div>
              <span className="lr-mission-badge" style={{border:`1px solid ${m.color}40`, color:m.color, background:`${m.color}10`}}>{m.badge}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="lr-div" />

      {/* Tech */}
      <section className="lr-sec">
        <div className="rev"><div className="lr-sec-label">{C.techLabel}</div><h2 className="lr-sec-title">{C.techTitle}</h2></div>
        <div className="lr-tech rev rd1">
          {TECH.map((t,i) => (
            <div key={i} className="lr-tech-pill">
              <div className="lr-tech-dot" style={{background:t.dot}} />
              {t.label}
            </div>
          ))}
        </div>
      </section>

      <div className="lr-div" />

      {/* CTA */}
      <section className="lr-cta">
        <div className="lr-cta-glow" />
        <div className="rev">
          <h2 className="lr-cta-title">{C.ctaTitle}</h2>
          <p className="lr-cta-body">{C.ctaBody}</p>
          <Link to="/act/chihiro" className="btn-p" style={{margin:"0 auto", display:"inline-flex"}}><span>🌊</span>{C.ctaBtn}</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="lr-footer">
        <div className="lr-footer-grid">
          <div>
            <div className="lr-footer-brand-name">千尋の名前</div>
            <p className="lr-footer-brand-desc">{C.footerDesc}</p>
          </div>
          <div>
            <div className="lr-footer-col-title">{C.navPlay}</div>
            <ul className="lr-footer-links">
              <li><Link to="/act/chihiro">Chihiro's Lost Name</Link></li>
              <li><a href="#how" onClick={(e)=>{e.preventDefault();scrollTo("how")}}>{C.navHow}</a></li>
              <li><a href="#missions" onClick={(e)=>{e.preventDefault();scrollTo("missions")}}>{C.navMiss}</a></li>
            </ul>
          </div>
          <div>
            <div className="lr-footer-col-title">Stack</div>
            <ul className="lr-footer-links">
              {["Stellar Soroban","Noir UltraHonk","isomorphic-git","React 19"].map((t,i)=><li key={i}><a href="#">{t}</a></li>)}
            </ul>
          </div>
          <div>
            <div className="lr-footer-col-title">Links</div>
            <ul className="lr-footer-links">
              <li><a href="https://stellar.org/developers" target="_blank" rel="noopener noreferrer">Stellar Docs</a></li>
              <li><a href="https://noir-lang.org" target="_blank" rel="noopener noreferrer">Noir Lang</a></li>
              <li><a href="https://freighter.app" target="_blank" rel="noopener noreferrer">Freighter Wallet</a></li>
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="lr-footer-bottom">
          <span className="lr-footer-copy">{C.copy}</span>
          <div className="lr-footer-badges">
            <span className="lr-footer-badge">Stellar Hacks</span>
            <span className="lr-footer-badge">ZK Gaming</span>
            <span className="lr-footer-badge">Protocol 25</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
