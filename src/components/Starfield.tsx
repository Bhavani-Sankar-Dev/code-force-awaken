import React, { useEffect, useRef } from 'react';

export const Starfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.35 + 0.05,
      color:
        Math.random() > 0.8
          ? '#00f0ff'
          : Math.random() > 0.6
          ? '#a855f7'
          : '#ffffff',
      alpha: Math.random() * 0.8 + 0.2
    }));

    let meteor = {
      x: 0,
      y: 0,
      length: 80,
      speed: 12,
      angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
      opacity: 0,
      active: false
    };

    const triggerMeteor = () => {
      meteor = {
        x: Math.random() * width * 0.8,
        y: Math.random() * height * 0.3,
        length: Math.random() * 60 + 50,
        speed: Math.random() * 6 + 10,
        angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
        opacity: 1,
        active: true
      };
    };

    const meteorInterval = setInterval(() => {
      if (!meteor.active && Math.random() > 0.35) {
        triggerMeteor();
      }
    }, 3800);

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep galactic nebula radial glows
      const purpleGlow = ctx.createRadialGradient(
        width * 0.2,
        height * 0.25,
        40,
        width * 0.2,
        height * 0.25,
        450
      );
      purpleGlow.addColorStop(0, 'rgba(124, 58, 237, 0.09)');
      purpleGlow.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = purpleGlow;
      ctx.fillRect(0, 0, width, height);

      const cyanGlow = ctx.createRadialGradient(
        width * 0.8,
        height * 0.75,
        40,
        width * 0.8,
        height * 0.75,
        500
      );
      cyanGlow.addColorStop(0, 'rgba(6, 182, 212, 0.09)');
      cyanGlow.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = cyanGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw drifting stars
      stars.forEach(star => {
        star.y -= star.speed;
        if (star.y < 0) {
          star.y = height;
          star.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.shadowBlur = star.size > 1.8 ? 6 : 0;
        ctx.shadowColor = star.color;
        ctx.fill();
      });

      // Draw meteor streak if active
      if (meteor.active) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 240, 255, ${meteor.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00f0ff';
        const endX = meteor.x - Math.cos(meteor.angle) * meteor.length;
        const endY = meteor.y - Math.sin(meteor.angle) * meteor.length;
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();

        meteor.x += Math.cos(meteor.angle) * meteor.speed;
        meteor.y += Math.sin(meteor.angle) * meteor.speed;
        meteor.opacity -= 0.015;

        if (meteor.opacity <= 0 || meteor.x > width || meteor.y > height) {
          meteor.active = false;
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(meteorInterval);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
    />
  );
};
