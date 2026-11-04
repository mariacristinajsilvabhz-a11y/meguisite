/* Eventos vivo — movimento e interação da página de eventos (04/11/2026).
   Não altera a lógica do kit (eventos.js); só observa e anima. */
(() => {
  'use strict';
  const page = document.querySelector('.ev-artdirection');
  if (!page) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const butterfly = size => `<svg class="icon icon-butterfly" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${size};height:auto"><use href="#megui-butterfly" x="2.25" y="0" width="19.5" height="24"/></svg>`;

  /* Barra de progresso */
  const bar = document.createElement('div');
  bar.className = 'vv-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let ticking = false;
  const progress = () => {
    ticking = false;
    const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    bar.style.setProperty('--vv-p', Math.min(1, Math.max(0, scrollY / range)).toFixed(4));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(progress); } }, {passive: true});
  progress();

  setupKit();
  if (reduced) return;
  document.documentElement.classList.add('vv-motion');

  /* Borboletas da abertura */
  const hero = page.querySelector('.ev-gather');
  if (hero) {
    const sky = document.createElement('div');
    sky.className = 'vv-sky';
    sky.setAttribute('aria-hidden', 'true');
    const mobile = innerWidth < 700;
    const spots = mobile
      ? [[82, 6, 26], [8, 58, 18], [90, 52, 16]]
      : [[44, 10, 30], [52, 74, 20], [47, 42, 16], [94, 80, 24], [3, 8, 14], [97, 18, 16]];
    spots.forEach(([x, y, s], i) => {
      const fly = document.createElement('span');
      fly.className = 'vv-fly';
      fly.innerHTML = butterfly('100%');
      const r = (a, b) => (a + Math.random() * (b - a)).toFixed(2);
      fly.style.cssText = `--x:${x}%;--y:${y}%;--s:${s}px;--d:${r(7, 12)}s;--f:${r(.35, .6)}s;--delay:${(i * .35 + .8).toFixed(2)}s;--dx:${r(-40, 40)}px;--dy:${r(14, 34)}px;--o:${r(.5, .85)}`;
      sky.appendChild(fly);
    });
    hero.prepend(sky);
  }

  /* Inclinação do kit com o cursor */
  const frame = page.querySelector('.eg-kit-frame');
  if (frame && finePointer) {
    let raf = 0;
    frame.addEventListener('pointermove', event => {
      const box = frame.getBoundingClientRect();
      const px = (event.clientX - box.left) / box.width;
      const py = (event.clientY - box.top) / box.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        frame.classList.add('vv-tilting');
        frame.style.setProperty('--rx', `${((px - .5) * 12).toFixed(2)}deg`);
        frame.style.setProperty('--ry', `${((.5 - py) * 10).toFixed(2)}deg`);
        frame.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        frame.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
    });
    frame.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf);
      frame.classList.remove('vv-tilting');
      frame.style.setProperty('--rx', '0deg');
      frame.style.setProperty('--ry', '0deg');
    });
  }

  /* Revelação na rolagem, com cascata dentro de cada grupo */
  const groups = [
    ['.ev-moments-heading'], ['.ev-moment', .12],
    ['.ev-showcase-intro'], ['.ev-curated-piece', .1, true], ['.ev-showcase-explore'],
    ['.ev-worlds-heading'], ['.ev-occasion', .07],
    ['.ev-start-copy'], ['.ev-ticket', 0, false, .15]
  ];
  const targets = [];
  groups.forEach(([selector, step = 0, image = false, base = 0]) => {
    page.querySelectorAll(selector).forEach((el, index) => {
      if (el.getBoundingClientRect().top < innerHeight * .9) return;
      el.classList.add('vv-reveal');
      if (image) el.querySelector('.ev-curated-photo')?.classList.add('vv-reveal-img');
      const delay = base + (step ? (index % 3) * step : 0);
      if (delay) {
        el.style.transitionDelay = `${delay}s`;
        el.style.setProperty('--vv-delay', `${delay}s`);
      }
      targets.push(el);
    });
  });
  const reveal = el => {
    el.classList.add('vv-in');
    el.querySelector('.vv-reveal-img')?.classList.add('vv-in');
    setTimeout(() => { el.style.transitionDelay = ''; }, 1600);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { reveal(entry.target); io.unobserve(entry.target); }
    }), {rootMargin: '0px 0px -8% 0px', threshold: .08});
    targets.forEach(el => io.observe(el));
  } else targets.forEach(reveal);
  page.querySelectorAll('.ev-moment').forEach(el => { if (!el.classList.contains('vv-reveal')) el.classList.add('vv-in'); });

  /* Ocasiões: animação ao abrir e troca do nome do evento */
  page.querySelectorAll('[data-ev-panel]').forEach(panel => {
    new MutationObserver(() => {
      if (!panel.hidden) {
        panel.classList.remove('vv-opening');
        void panel.offsetWidth;
        panel.classList.add('vv-opening');
      }
    }).observe(panel, {attributes: true, attributeFilter: ['hidden']});
    panel.addEventListener('animationend', event => { if (event.target === panel) panel.classList.remove('vv-opening'); });
  });
  const label = page.querySelector('[data-ev-event-label]');
  if (label) {
    let last = label.textContent;
    new MutationObserver(() => {
      if (label.textContent === last) return;
      last = label.textContent;
      label.classList.remove('vv-swap');
      void label.offsetWidth;
      label.classList.add('vv-swap');
    }).observe(label, {childList: true, characterData: true, subtree: true});
  }

  /* Kit: bandeja de ícones, medidor e revoada de borboletas */
  function setupKit() {
  const kit = page.querySelector('[data-ev-kit]');
  if (!kit) return;
  const options = [...kit.querySelectorAll('[data-ev-item]')];
  const tray = kit.querySelector('[data-vv-tray]');
  const meter = kit.querySelector('[data-vv-meter]');
  const count = kit.querySelector('[data-ev-selection-count]');
  const burst = (button) => {
    if (reduced) return;
    const box = button.getBoundingClientRect();
    const cx = box.left + box.width - 26, cy = box.top + box.height / 2;
    for (let i = 0; i < 6; i++) {
      const b = document.createElement('span');
      b.className = 'vv-burst';
      b.innerHTML = butterfly('100%');
      const angle = (-150 + i * 24 + Math.random() * 14) * Math.PI / 180;
      const dist = 60 + Math.random() * 50;
      b.style.cssText = `left:${cx}px;top:${cy}px;--bx:${(Math.cos(angle) * dist).toFixed(1)}px;--by:${(Math.sin(angle) * dist).toFixed(1)}px;--br:${(Math.random() * 60 - 30).toFixed(0)}deg;animation-delay:${i * 25}ms`;
      document.body.appendChild(b);
      b.addEventListener('animationend', () => b.remove(), {once: true});
      setTimeout(() => b.remove(), 1600);
    }
  };
  const syncTray = () => {
    const active = options.filter(o => o.getAttribute('aria-pressed') === 'true');
    if (meter) meter.style.setProperty('--vv-fill', (active.length / options.length).toFixed(3));
    if (!tray) return;
    const present = new Map([...tray.children].filter(i => !i.classList.contains('vv-leaving')).map(i => [i.dataset.item, i]));
    active.forEach(option => {
      if (present.has(option.dataset.evItem)) { present.delete(option.dataset.evItem); return; }
      const chip = document.createElement('i');
      chip.dataset.item = option.dataset.evItem;
      chip.title = option.dataset.evItem;
      chip.innerHTML = option.querySelector('.icon')?.outerHTML || '';
      tray.appendChild(chip);
    });
    present.forEach(chip => {
      chip.classList.add('vv-leaving');
      chip.addEventListener('animationend', () => chip.remove(), {once: true});
    });
  };
  const bump = () => { count.classList.remove('vv-bump'); void count.offsetWidth; count.classList.add('vv-bump'); };
  options.forEach(option => {
    option.addEventListener('click', () => {
      requestAnimationFrame(() => {
        const on = option.getAttribute('aria-pressed') === 'true';
        option.classList.remove('vv-pop'); void option.offsetWidth; option.classList.add('vv-pop');
        if (on) burst(option);
        syncTray(); bump();
      });
    });
  });
  page.querySelectorAll('[data-ev-pick]').forEach(trigger => trigger.addEventListener('click', () => {
    const option = options.find(o => o.dataset.evItem === trigger.dataset.evPick);
    requestAnimationFrame(() => { syncTray(); bump(); });
    if (!option) return;
    setTimeout(() => {
      option.classList.remove('vv-flash'); void option.offsetWidth; option.classList.add('vv-flash');
      burst(option);
    }, 750);
  }));
  syncTray();
  }
})();
