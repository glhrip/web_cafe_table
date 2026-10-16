'use client';

import { useEffect, useRef } from 'react';

/**
 * Confetti sederhana berbasis DOM + Web Animations API.
 * Dipicu saat pesanan siap diambil. Ringan, tanpa dependensi.
 */
export default function Confetti({ fire = false }) {
  const ref = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    if (!fire || done.current) return;
    const host = ref.current;
    if (!host) return;
    done.current = true;

    const colors = ['#c2703d', '#e29a5c', '#f6c66b', '#0f9d6b', '#fdf6f0'];
    const N = 70;

    for (let i = 0; i < N; i++) {
      const el = document.createElement('span');
      const size = 6 + Math.random() * 8;
      el.style.cssText = `
        position: fixed;
        top: -20px;
        left: ${Math.random() * 100}vw;
        width: ${size}px;
        height: ${size * 0.6}px;
        background: ${colors[i % colors.length]};
        border-radius: 2px;
        pointer-events: none;
        z-index: 90;
        will-change: transform, opacity;
      `;
      host.appendChild(el);

      const drift = (Math.random() - 0.5) * 240;
      const rotate = Math.random() * 720 - 360;
      const dur = 2400 + Math.random() * 1800;

      el.animate(
        [
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          {
            transform: `translate(${drift}px, ${window.innerHeight + 60}px) rotate(${rotate}deg)`,
            opacity: 0.9,
          },
        ],
        { duration: dur, easing: 'cubic-bezier(0.2,0.6,0.4,1)', fill: 'forwards' },
      ).onfinish = () => el.remove();
    }

    return () => {
      host.replaceChildren();
    };
  }, [fire]);

  return <div ref={ref} aria-hidden="true" />;
}
