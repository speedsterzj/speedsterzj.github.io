(() => {
  const start = () => {
    const previous = document.querySelector("canvas.particle-cat");
    if (!previous || previous.dataset.offegoParticleV2) return;

    // Detach the old canvas so its existing animation loop cannot compete with this one.
    const canvas = previous.cloneNode(false);
    canvas.dataset.offegoParticleV2 = "true";
    previous.replaceWith(canvas);

    const mobile = window.matchMedia("(max-width: 760px)").matches;
    if (mobile) {
      const style = document.createElement("style");
      style.textContent = "@media (max-width:760px){.logo-node{min-height:auto!important;padding:72px 20px 62px!important;gap:18px!important}.logo-node h2{font-size:clamp(44px,12vw,60px)!important;line-height:.88!important}.logo-node-copy p:not(.section-index){margin-top:26px!important;font-size:16px!important;line-height:1.68!important}.particle-cat{height:min(118vw,480px)!important;margin-top:4px!important}.hero-real-product,.explorer-stage figure:not(.is-isolated) img,.mosaic-card:not(.is-isolated) img,.collection-list figure:not(.is-isolated) img,.detail-media figure:not(.is-isolated) img,.design-room .design-room-object img{object-fit:contain!important;object-position:center!important}.explorer-stage figure:not(.is-isolated),.mosaic-card:not(.is-isolated) figure,.collection-list figure:not(.is-isolated),.detail-media figure:not(.is-isolated){background:#f6e9d6!important}}";
      document.head.appendChild(style);
    }

    const context = canvas.getContext("2d");
    if (!context) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const dots = [];
    let visible = false;
    let ready = false;
    let frame = 0;
    let pointer = { x: -1000, y: -1000 };

    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const scatter = () => {
      dots.forEach((dot, index) => {
        const angle = index * 2.399 + Math.random() * 0.8;
        const distance = 0.32 + Math.random() * 0.52;
        dot.x = 0.5 + Math.cos(angle) * distance;
        dot.y = 0.5 + Math.sin(angle) * distance;
      });
    };

    const draw = (time) => {
      if (!ready || !visible) return;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) * (mobile ? 0.96 : 0.9);
      const left = (width - scale) / 2;
      const top = (height - scale) / 2;
      const tick = time / 1000;

      dots.forEach((dot, index) => {
        const targetX = left + dot.tx * scale;
        const targetY = top + dot.ty * scale;
        const currentX = left + dot.x * scale;
        const currentY = top + dot.y * scale;
        const dx = currentX - pointer.x;
        const dy = currentY - pointer.y;
        const distance = Math.hypot(dx, dy);
        let repelX = 0;
        let repelY = 0;

        if (!reducedMotion.matches && distance < 130) {
          const force = ((130 - distance) / 130) * 34;
          repelX = (dx / (distance || 1)) * force;
          repelY = (dy / (distance || 1)) * force;
        }

        dot.x += ((targetX - left + repelX) / scale - dot.x) * 0.055;
        dot.y += ((targetY - top + repelY) / scale - dot.y) * 0.055;
        const x = left + dot.x * scale;
        const y = top + dot.y * scale;
        const radius = (mobile ? 1.8 : 1.35) + Math.sin(tick * 1.4 + dot.phase) * (mobile ? 0.32 : 0.38);
        context.globalAlpha = mobile ? 0.96 : 0.9;
        context.fillStyle = index % 13 === 0 ? "#4a3b5b" : index % 7 === 0 ? "#7c935f" : "#c84f3d";
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    };

    const logo = new Image();
    logo.onload = () => {
      const sample = document.createElement("canvas");
      sample.width = 220;
      sample.height = 220;
      const sampleContext = sample.getContext("2d");
      if (!sampleContext) return;
      sampleContext.fillStyle = "#fff";
      sampleContext.fillRect(0, 0, 220, 220);
      sampleContext.drawImage(logo, 0, 0, 220, 220);
      const pixels = sampleContext.getImageData(0, 0, 220, 220).data;
      const targets = [];
      for (let y = 10; y < 210; y += 4) {
        for (let x = 10; x < 210; x += 4) {
          const offset = (y * 220 + x) * 4;
          if ((pixels[offset] + pixels[offset + 1] + pixels[offset + 2]) / 3 < 90) targets.push([x / 220, y / 220]);
        }
      }
      const count = mobile ? 300 : 480;
      for (let index = 0; index < count; index += 1) {
        const targetIndex = Math.min(targets.length - 1, Math.floor(index * targets.length / count));
        const [tx, ty] = targets[targetIndex] || [0.5, 0.5];
        dots.push({ x: Math.random(), y: Math.random(), tx, ty, phase: index * 0.71 });
      }
      ready = true;
      if (visible) {
        scatter();
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(draw);
      }
    };
    logo.src = "/offego-logo-sketch.jpg";

    const observer = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && ready) {
        if (!wasVisible) scatter();
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(draw);
      }
      if (!visible) window.cancelAnimationFrame(frame);
    }, { threshold: 0.18 });

    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    });
    canvas.addEventListener("pointerleave", () => { pointer = { x: -1000, y: -1000 }; });
    window.addEventListener("resize", fit, { passive: true });
    fit();
    observer.observe(canvas);
  };

  window.addEventListener("load", () => window.setTimeout(start, 350), { once: true });
})();
