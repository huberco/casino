'use client';
import React from 'react';
import styled from 'styled-components';

const BattlePage = () => {
  return (
    <StyledWrapper>
      <div className="rdr-loader-demo">
        <div className="rdr-revolver-loader">
          <div className="rdr-hammer" />
          <div className="rdr-smoke-container">
            <div className="rdr-smoke" />
            <div className="rdr-smoke" />
          </div>
          <div className="rdr-sparks">
            <div className="rdr-spark" />
            <div className="rdr-spark" />
            <div className="rdr-spark" />
          </div>
          <svg className="rdr-ring-svg" viewBox="0 0 100 100">
            <circle className="rdr-ring-bg" cx={50} cy={50} r={45} />
            <circle className="rdr-ring-fill" cx={50} cy={50} r={45} />
          </svg>
          <div className="rdr-cylinder">
            <div className="rdr-chamber">
              <div className="rdr-bullet" />
              <div className="rdr-dead-eye-x" />
            </div>
            <div className="rdr-chamber">
              <div className="rdr-bullet" />
              <div className="rdr-dead-eye-x" />
            </div>
            <div className="rdr-chamber">
              <div className="rdr-bullet" />
              <div className="rdr-dead-eye-x" />
            </div>
            <div className="rdr-chamber">
              <div className="rdr-bullet" />
              <div className="rdr-dead-eye-x" />
            </div>
            <div className="rdr-chamber">
              <div className="rdr-bullet" />
              <div className="rdr-dead-eye-x" />
            </div>
            <div className="rdr-chamber">
              <div className="rdr-bullet" />
              <div className="rdr-dead-eye-x" />
            </div>
          </div>
          <div className="rdr-text-wrapper">
            <span className="rdr-text whitespace-nowrap">Battle Game is now unavailable</span>
            <span className="rdr-text-sub">Story Mode</span>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  .rdr-revolver-loader {
    /* Scoped Variables */
    --rdr-red: #cc0000;
    --rdr-red-dark: #8a0000;
    --rdr-brass: #d4af37;
    --rdr-brass-dark: #997c1f;
    --rdr-metal: #1a1a1a;
    --rdr-metal-highlight: #333;
    --rdr-paper: #e6e6e6;
    --rdr-smoke: rgba(200, 200, 200, 0.1);
    --rdr-spark: #ffaa00;
    --rdr-size: 10em;

    position: relative;
    width: var(--rdr-size);
    height: var(--rdr-size);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;

    /* Global Recoil Animation */
    animation: rdr-recoil-shock 4.5s ease-out infinite;
  }

  /* --- Hammer Mechanism --- */
  .rdr-hammer {
    position: absolute;
    top: -15%;
    width: 1.5em;
    height: 4em;
    background: linear-gradient(to bottom, #222, #000);
    border: 1px solid #333;
    border-radius: 4px;
    z-index: 0;
    transform-origin: bottom center;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
    animation: rdr-hammer-action 4.5s infinite;
  }

  /* --- Interaction Ring (Dead Eye Meter) --- */
  .rdr-ring-svg {
    position: absolute;
    width: 110%;
    height: 110%;
    transform: rotate(-90deg);
    z-index: 1;
    filter: drop-shadow(0 0 4px black);
  }

  .rdr-ring-bg {
    fill: none;
    stroke: rgba(255, 255, 255, 0.05);
    stroke-width: 1;
  }

  .rdr-ring-fill {
    fill: none;
    stroke: var(--rdr-red);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 283; /* 2 * pi * 45 */
    stroke-dashoffset: 283;
    animation: rdr-fill-ring 4.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
  }

  /* --- Smoke Effects --- */
  .rdr-smoke-container {
    position: absolute;
    top: -30%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translateX(-50%);
    pointer-events: none;
    z-index: 0;
  }

  .rdr-smoke {
    position: absolute;
    bottom: 50%;
    left: 50%;
    width: 2em;
    height: 4em;
    background: radial-gradient(
      ellipse at center,
      var(--rdr-smoke) 0%,
      transparent 70%
    );
    border-radius: 50%;
    opacity: 0;
    transform-origin: bottom center;
    animation: rdr-smoke-rise 4.5s ease-out infinite;
    filter: blur(5px);
  }

  .rdr-smoke:nth-child(2) {
    width: 3.5em;
    left: 40%;
    animation-delay: 2.2s;
  }

  /* --- Sparks --- */
  .rdr-sparks {
    position: absolute;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 5;
  }

  .rdr-spark {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 3px;
    height: 1px;
    background: var(--rdr-spark);
    box-shadow: 0 0 4px var(--rdr-spark);
    opacity: 0;
    animation: rdr-spark-fly 4.5s linear infinite;
  }

  .rdr-spark:nth-child(1) {
    transform: rotate(15deg);
    animation-delay: 1.6s;
  }
  .rdr-spark:nth-child(2) {
    transform: rotate(-45deg);
    animation-delay: 1.7s;
  }
  .rdr-spark:nth-child(3) {
    transform: rotate(80deg);
    animation-delay: 1.65s;
  }

  /* --- The Revolver Cylinder --- */
  .rdr-cylinder {
    position: relative;
    width: 60%;
    height: 60%;
    background: radial-gradient(
      circle at 30% 30%,
      var(--rdr-metal-highlight),
      var(--rdr-metal)
    );
    border-radius: 50%;
    border: 1px solid #000;
    box-shadow:
      inset 0 0 2em #000,
      0 1em 2em rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    /* Easing: "Back" easing creates a mechanical overshoot/snap effect */
    animation: rdr-spin-cylinder 4.5s cubic-bezier(0.6, -0.28, 0.735, 0.045)
      infinite;
    z-index: 2;
  }

  /* Cylinder Texture Detail */
  .rdr-cylinder::before {
    content: "";
    position: absolute;
    top: 2%;
    left: 2%;
    right: 2%;
    bottom: 2%;
    border-radius: 50%;
    border: 1px dashed rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }

  /* Central Ratchet/Axle */
  .rdr-cylinder::after {
    content: "";
    position: absolute;
    width: 1.4em;
    height: 1.4em;
    background: radial-gradient(circle, #444, #111);
    border: 1px solid #222;
    border-radius: 50%;
    box-shadow: 0 0 0.5em #000;
    z-index: 4;
  }

  /* Chambers */
  .rdr-chamber {
    position: absolute;
    width: 1.9em;
    height: 1.9em;
    background-color: #050505;
    border-radius: 50%;
    box-shadow:
      inset 1px 1px 4px rgba(0, 0, 0, 0.9),
      0 0 0 1px rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  /* Positioning Chambers */
  .rdr-chamber:nth-child(1) {
    transform: rotate(0deg) translate(2.3em) rotate(0deg);
  }
  .rdr-chamber:nth-child(2) {
    transform: rotate(60deg) translate(2.3em) rotate(-60deg);
  }
  .rdr-chamber:nth-child(3) {
    transform: rotate(120deg) translate(2.3em) rotate(-120deg);
  }
  .rdr-chamber:nth-child(4) {
    transform: rotate(180deg) translate(2.3em) rotate(-180deg);
  }
  .rdr-chamber:nth-child(5) {
    transform: rotate(240deg) translate(2.3em) rotate(-240deg);
  }
  .rdr-chamber:nth-child(6) {
    transform: rotate(300deg) translate(2.3em) rotate(-300deg);
  }

  /* The Bullet Casing (Brass) */
  .rdr-bullet {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      var(--rdr-brass) 30%,
      var(--rdr-brass-dark) 70%
    );
    position: relative;
    transform: scale(0);
    box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
    animation: rdr-load-bullet 4.5s infinite;
  }

  /* Primer */
  .rdr-bullet::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 35%;
    height: 35%;
    background: radial-gradient(circle, #e0e0e0, #888);
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.3);
    box-shadow: inset 1px 1px 1px rgba(0, 0, 0, 0.2);
  }

  /* Dead Eye "X" Mark */
  .rdr-dead-eye-x {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 5;
    opacity: 0;
    animation: rdr-paint-x 4.5s infinite;
  }

  .rdr-dead-eye-x::before,
  .rdr-dead-eye-x::after {
    content: "";
    position: absolute;
    width: 80%;
    height: 3px;
    background-color: #ff0000;
    border-radius: 2px;
    box-shadow: 0 0 4px #ff0000;
  }
  .rdr-dead-eye-x::before {
    transform: rotate(45deg);
  }
  .rdr-dead-eye-x::after {
    transform: rotate(-45deg);
  }

  /* Staggered Loading & Targeting */
  .rdr-chamber:nth-child(1) .rdr-bullet,
  .rdr-chamber:nth-child(1) .rdr-dead-eye-x {
    animation-delay: 0.1s;
  }
  .rdr-chamber:nth-child(2) .rdr-bullet,
  .rdr-chamber:nth-child(2) .rdr-dead-eye-x {
    animation-delay: 0.2s;
  }
  .rdr-chamber:nth-child(3) .rdr-bullet,
  .rdr-chamber:nth-child(3) .rdr-dead-eye-x {
    animation-delay: 0.3s;
  }
  .rdr-chamber:nth-child(4) .rdr-bullet,
  .rdr-chamber:nth-child(4) .rdr-dead-eye-x {
    animation-delay: 0.4s;
  }
  .rdr-chamber:nth-child(5) .rdr-bullet,
  .rdr-chamber:nth-child(5) .rdr-dead-eye-x {
    animation-delay: 0.5s;
  }
  .rdr-chamber:nth-child(6) .rdr-bullet,
  .rdr-chamber:nth-child(6) .rdr-dead-eye-x {
    animation-delay: 0.6s;
  }

  /* --- Text Style --- */
  .rdr-text-wrapper {
    position: absolute;
    bottom: -4em;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .rdr-text {
    color: var(--rdr-paper);
    font-size: 1.6em;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    text-shadow: 0 2px 0px #000;
    opacity: 0.9;
    filter: contrast(1.2);
  }

  .rdr-text-sub {
    color: var(--rdr-red);
    font-size: 0.85em;
    letter-spacing: 0.25em;
    font-weight: 700;
    text-transform: uppercase;
    margin-top: 0.5em;
    opacity: 0;
    animation: rdr-fade-text 2s ease-in-out infinite alternate;
  }

  /* --- Animations --- */

  /* Recoil Shock: Jolt the whole container when cylinder snaps */
  @keyframes rdr-recoil-shock {
    0%,
    54% {
      transform: translateY(0) rotate(0);
    }
    55% {
      transform: translateY(2px) rotate(1deg);
    } /* Snap! */
    58% {
      transform: translateY(-1px) rotate(-0.5deg);
    }
    62% {
      transform: translateY(0) rotate(0);
    }
  }

  /* Hammer: Cocks back then releases */
  @keyframes rdr-hammer-action {
    0% {
      transform: translateY(0);
    }
    10% {
      transform: translateY(1.5em) rotate(-10deg);
    } /* Cock back */
    15% {
      transform: translateY(1.5em) rotate(-10deg);
    }
    35% {
      transform: translateY(0) rotate(0);
    } /* Release (Fire/Spin) */
    100% {
      transform: translateY(0);
    }
  }

  @keyframes rdr-spin-cylinder {
    0% {
      transform: rotate(0deg);
    }
    15% {
      transform: rotate(-60deg);
    } /* Cocking back */
    40% {
      transform: rotate(720deg);
    } /* Fast spin */
    55% {
      transform: rotate(720deg);
    } /* Hard Stop */
    100% {
      transform: rotate(720deg);
    }
  }

  @keyframes rdr-fill-ring {
    0%,
    50% {
      stroke-dashoffset: 283;
    }
    90% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }

  @keyframes rdr-load-bullet {
    0%,
    55% {
      transform: scale(0);
      opacity: 0;
    }
    60% {
      transform: scale(1);
      opacity: 1;
    }
    65% {
      transform: scale(0.9);
    }
    90% {
      transform: scale(0.9);
      opacity: 1;
    }
    95% {
      transform: scale(0);
      opacity: 0;
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }

  @keyframes rdr-paint-x {
    0%,
    60% {
      opacity: 0;
      transform: scale(1.5);
    }
    62% {
      opacity: 1;
      transform: scale(1);
    } /* X marks the spot */
    75% {
      opacity: 1;
    }
    85% {
      opacity: 0;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes rdr-spark-fly {
    0%,
    35% {
      transform: translate(0, 0) scale(0);
      opacity: 0;
    }
    36% {
      opacity: 1;
      transform: translate(0, 0) scale(1);
    }
    45% {
      transform: translate(60px, -60px) scale(0);
      opacity: 0;
    }
    100% {
      opacity: 0;
    }
  }

  @keyframes rdr-smoke-rise {
    0% {
      transform: translateX(-50%) translateY(0) scale(0.5);
      opacity: 0;
    }
    50% {
      opacity: 0.3;
    }
    100% {
      transform: translateX(-50%) translateY(-30px) scale(1.5);
      opacity: 0;
    }
  }

  @keyframes rdr-fade-text {
    from {
      opacity: 0.5;
    }
    to {
      opacity: 1;
    }
  }`;

export default BattlePage;
