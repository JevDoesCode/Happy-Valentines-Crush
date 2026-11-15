/* effects.js: floating hearts + tap bursts. Exposes window.Hearts.burst(x, y, count) */
'use strict';

(() => {
    const canvas = document.getElementById('fx');
    const ctx = canvas.getContext('2d');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const COLORS = ['#ff8fab', '#ff5d8f', '#ffb3c6', '#e63963', '#ffc2d1'];

    let width, height;
    let lastWidth = innerWidth;
    let lastScrollY = scrollY;
    let scrollSpeed = 0;
    const floaters = [];   // hearts that drift upward all the time
    const sparks = [];     // hearts thrown out when something is tapped

    const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

    /* Canvas sizing (ignores the small height changes of a phone's address bar) */
    function resize() {
        const dpr = devicePixelRatio || 1;
        width = innerWidth;
        height = innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    addEventListener('resize', () => {
        if (innerWidth !== lastWidth || Math.abs(innerHeight - height) > 160) {
            lastWidth = innerWidth;
            resize();
        }
    });

    /* Draw one heart */
    function drawHeart(x, y, size, rotation, alpha, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;

        ctx.beginPath();
        ctx.moveTo(0, size * 0.3);
        ctx.bezierCurveTo(-size * 0.8, -size * 0.2, -size * 0.5, -size * 0.9, 0, -size * 0.4);
        ctx.bezierCurveTo(size * 0.5, -size * 0.9, size * 0.8, -size * 0.2, 0, size * 0.3);
        ctx.fill();

        ctx.restore();
    }

    function makeFloater() {
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            size: 10 + Math.random() * 26,
            speed: 0.25 + Math.random() * 0.8,
            phase: Math.random() * 6.28,
            color: randomColor(),
            alpha: 0.25 + Math.random() * 0.4
        };
    }

    /* Throw a handful of hearts out from a point */
    function burst(x, y, count) {
        if (reduceMotion) return;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * 6.28;
            const power = 2 + Math.random() * 6;

            sparks.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * power,
                vy: Math.sin(angle) * power - 2,
                size: 8 + Math.random() * 16,
                life: 1,
                color: randomColor(),
                spin: Math.random() * 6
            });
        }
    }

    /* One animation frame */
    function frame(time) {
        ctx.clearRect(0, 0, width, height);

        // scrolling makes the hearts rush upward
        const delta = scrollY - lastScrollY;
        lastScrollY = scrollY;
        scrollSpeed *= 0.92;
        scrollSpeed = Math.max(scrollSpeed, Math.min(9, Math.abs(delta) * 0.2));

        for (const h of floaters) {
            h.y -= h.speed + scrollSpeed * (h.size / 20);
            h.x += Math.sin(time / 1200 + h.phase) * 0.4;

            if (h.y < -40) {
                h.y = height + 40;
                h.x = Math.random() * width;
            }

            drawHeart(h.x, h.y, h.size, Math.sin(time / 1500 + h.phase) * 0.4, h.alpha, h.color);
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
            const s = sparks[i];
            s.x += s.vx;
            s.y += s.vy;
            s.vy += 0.12;
            s.vx *= 0.98;
            s.life -= 0.014;

            if (s.life <= 0) {
                sparks.splice(i, 1);
                continue;
            }

            drawHeart(s.x, s.y, s.size, s.spin + s.life * 3, s.life, s.color);
        }

        requestAnimationFrame(frame);
    }

    /* Start */
    resize();

    const total = width < 600 ? 18 : 30;
    for (let i = 0; i < total; i++) {
        floaters.push(makeFloater());
    }

    if (reduceMotion) {
        floaters.forEach(h => drawHeart(h.x, h.y, h.size, 0, h.alpha, h.color));
    } else {
        requestAnimationFrame(frame);
    }

    window.Hearts = { burst };
})();
