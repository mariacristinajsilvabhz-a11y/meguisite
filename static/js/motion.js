(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData;
  // Efeitos de rolagem apenas nas páginas institucionais.
  if (document.body.hasAttribute('data-scroll-experience')) {
    const chapters = [...document.querySelectorAll('main > section')].filter(section =>
      !section.querySelector('.product-grid, .quote-layout, .mockup-editor') && !section.classList.contains('mockup-page') && !section.classList.contains('client-ribbon'));
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold:0, rootMargin:'0px 0px -36px 0px'});
    let active = false, frame = 0, currentY = scrollY, targetY = scrollY, lastTime = 0;
    const paint = time => {
      frame = 0;
      if (!active || document.hidden) return;
      const elapsed = Math.min(48, time - (lastTime || time - 16));
      lastTime = time;
      currentY += (targetY - currentY) * (1 - Math.exp(-elapsed / 115));
      const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const progress = Math.max(0, Math.min(1, currentY / range));
      // Um fundo contínuo atravessa as seções sem trocar a paleta em blocos.
      document.body.style.setProperty('--flow-x', `${Math.sin(progress * Math.PI * 2) * 9}%`);
      document.body.style.setProperty('--flow-y', `${6 - progress * 12}%`);
      document.body.style.setProperty('--flow-turn', `${-3 + progress * 6}deg`);
      if (Math.abs(targetY - currentY) > .15) frame = requestAnimationFrame(paint);
      else lastTime = 0;
    };
    const schedule = () => {
      targetY = scrollY;
      if (active && !frame) frame = requestAnimationFrame(paint);
    };
    const configure = () => {
      active = !reduced.matches;
      document.body.classList.toggle('scroll-experience', active);
      if (!active) {revealObserver.disconnect();cancelAnimationFrame(frame);frame = 0;return;}
      chapters.forEach(section => {
        if (!section.classList.contains('scroll-chapter')) {
          const style = getComputedStyle(section);
          section.style.setProperty('--chapter-background-image', style.backgroundImage);
          section.style.setProperty('--chapter-background-color', style.backgroundColor);
          section.classList.add('scroll-chapter');
          const rgb = style.backgroundColor.match(/[\d.]+/g)?.map(Number) || [];
          const text = style.color.match(/[\d.]+/g)?.map(Number) || [];
          const luma = values => values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
          if ((rgb.length >= 3 && (rgb[3] ?? 1) > .5 && luma(rgb) < 120) || (text.length >= 3 && luma(text) > 190)) {
            section.classList.add('scroll-chapter-dark');
          }
          const content = section.querySelector(':scope > .container');
          if (content) {
            content.classList.add('scroll-content');
            if (section.getBoundingClientRect().top > innerHeight) content.classList.add('reveal-pending');
          }
        }
        const content = section.querySelector(':scope > .scroll-content');
        if (content && !content.classList.contains('is-revealed')) revealObserver.observe(content);
      });
      currentY = targetY = scrollY;
      schedule();
    };
    configure();
    addEventListener('scroll', schedule, {passive:true});
    addEventListener('resize', schedule, {passive:true});
    addEventListener('pageshow', schedule);
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', configure);
  }

  document.querySelectorAll('.client-ribbon').forEach(ribbon => {
    const track = ribbon.querySelector('.client-ribbon-track');
    let visible = false;
    const sync = () => track.style.animationPlayState = visible && !document.hidden && !reduced.matches ? '' : 'paused';
    new IntersectionObserver(entries => {visible = entries[0].isIntersecting;sync();}).observe(ribbon);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
  });
  const makeDot = (label, action) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', label);
    dot.addEventListener('click', action);
    return dot;
  };
  const markDot = (dot, active) => {
    dot.classList.toggle('is-current', active);
    if (active) dot.setAttribute('aria-current', 'true');
    else dot.removeAttribute('aria-current');
  };
  document.querySelectorAll('.acervo-gallery:not(.acervo-designs), .archive-grid').forEach((gallery, index) => {
    gallery.classList.add('motion-gallery');
    gallery.id ||= `motion-gallery-${index}`;
    gallery.setAttribute('tabindex', '0');
    if (!gallery.hasAttribute('aria-label')) gallery.setAttribute('aria-label', 'Galeria de trabalhos: deslize para ver mais');
    const controls = document.createElement('div');
    controls.className = 'gallery-dots motion-gallery-dots';
    controls.setAttribute('aria-label', 'Escolher grupo de fotos');
    gallery.after(controls);
    let hovered = false, focused = false, visible = false, direction = 1, holdUntil = 0;
    let targets = [], active = 0;
    const sync = () => {
      active = targets.reduce((best, left, i) => Math.abs(left - gallery.scrollLeft) < Math.abs(targets[best] - gallery.scrollLeft) ? i : best, 0);
      [...controls.children].forEach((dot, i) => markDot(dot, i === active));
    };
    const go = i => gallery.scrollTo({left: targets[i], behavior: reduced.matches ? 'instant' : 'smooth'});
    const rebuild = () => {
      const items = [...gallery.children];
      if (!items.length) return;
      const gap = parseFloat(getComputedStyle(gallery).gap) || 0;
      const width = items[0].getBoundingClientRect().width;
      const perPage = Math.max(1, Math.floor((gallery.clientWidth + gap + 1) / (width + gap)));
      const max = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
      targets = [];
      for (let i = 0; i < items.length; i += perPage) {
        const left = Math.min(max, items[i].offsetLeft - items[0].offsetLeft);
        if (!targets.length || left > targets[targets.length - 1] + 1) targets.push(left);
      }
      if (max > targets[targets.length - 1] + 1) targets.push(max);
      controls.replaceChildren();
      targets.forEach((left, i) => {
        const dot = makeDot(`Ver grupo ${i + 1} de ${targets.length} trabalhos`, () => {holdUntil = Date.now() + 8000;go(i);});
        dot.setAttribute('aria-controls', gallery.id);
        controls.append(dot);
      });
      controls.hidden = targets.length < 2;
      sync();
    };
    gallery.addEventListener('scroll', sync, {passive:true});
    gallery.addEventListener('mouseenter', () => hovered = true);
    gallery.addEventListener('mouseleave', () => hovered = false);
    const setFocus = event => {focused = gallery.contains(event.relatedTarget) || controls.contains(event.relatedTarget);};
    [gallery, controls].forEach(element => {
      element.addEventListener('focusin', () => focused = true);
      element.addEventListener('focusout', setFocus);
    });
    gallery.addEventListener('pointerdown', () => holdUntil = Date.now() + 8000, {passive:true});
    gallery.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();holdUntil = Date.now() + 8000;
      go(Math.max(0,Math.min(targets.length - 1,active + (event.key === 'ArrowRight' ? 1 : -1))));
    });
    new ResizeObserver(rebuild).observe(gallery);
    new IntersectionObserver(entries => visible = entries[0].isIntersecting, {threshold:.3}).observe(gallery);
    rebuild();
    setInterval(() => {
      if (gallery.dataset.galleryAutoplay === 'false' || hovered || focused || !visible || document.hidden || reduced.matches || Date.now() < holdUntil || targets.length < 2) return;
      if (active >= targets.length - 1) direction = -1;
      if (active <= 0) direction = 1;
      go(active + direction);
    }, 5500);
  });
  document.querySelectorAll('.video-preview').forEach(preview => {
    const video = preview.querySelector('.motion-video');
    if (!video || saveData || reduced.matches) return;
    let visible = false;
    const play = () => {
      if (!visible || document.hidden || reduced.matches) {video.pause();return;}
      video.src ||= preview.dataset.videoSrc;
      video.play().then(() => preview.classList.add('is-playing')).catch(() => {});
    };
    new IntersectionObserver(entries => {visible = entries[0].isIntersecting;play();}, {threshold:.4}).observe(preview);
    document.addEventListener('visibilitychange', play);
    reduced.addEventListener('change',play);
    video.addEventListener('error', () => preview.classList.remove('is-playing'));
  });
  document.querySelectorAll('[data-corporate-faq]').forEach(faq => {
    const buttons = [...faq.querySelectorAll('[data-faq-category]')];
    const panels = [...faq.querySelectorAll('[data-faq-panel]')];
    const select = key => {
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.faqCategory === key)));
      panels.forEach(panel => panel.hidden = panel.dataset.faqPanel !== key);
    };
    buttons.forEach(button => button.addEventListener('click', () => select(button.dataset.faqCategory)));
    select(buttons[0].dataset.faqCategory);
  });
  document.querySelectorAll('[data-shirt-showcase]').forEach(showcase => {
    const frames = [...showcase.querySelectorAll('[data-shirt-brand]')];
    const controls = showcase.querySelector('[data-shirt-dots]');
    let index = 0, visible = false, focused = false, holdUntil = 0;
    const show = next => {
      index = (next + frames.length) % frames.length;
      frames.forEach((frame, i) => {frame.classList.toggle('is-active', i === index);frame.setAttribute('aria-hidden',String(i !== index));});
      [...controls.children].forEach((dot, i) => markDot(dot, i === index));
      showcase.querySelector('[data-shirt-caption]').textContent = showcase.dataset.shirtCaptionMode === 'name' ? frames[index].dataset.shirtBrand : `${frames[index].dataset.shirtBrand} · Visualização de personalização`;
    };
    frames.forEach((frame, i) => controls.append(makeDot(`Ver camiseta ${frame.dataset.shirtBrand}`, () => {holdUntil = Date.now() + 8000;show(i);})));show(0);
    showcase.addEventListener('focusin', () => focused = Boolean(showcase.querySelector(':focus-visible')));
    showcase.addEventListener('focusout', event => focused = Boolean(event.relatedTarget && showcase.contains(event.relatedTarget) && event.relatedTarget.matches(':focus-visible')));
    new IntersectionObserver(entries => visible = entries[0].isIntersecting, {threshold:.3}).observe(showcase);
    setInterval(() => {if (visible && !focused && !document.hidden && !reduced.matches && Date.now() >= holdUntil) show(index + 1);},5500);
  });
})();

// A rolagem convida ao voo; cada passagem segue até o fim no seu próprio ritmo.
(() => {
  const section = document.querySelector('[data-butterfly-journey]');
  if (!section) return;
  const path = section.querySelector('[data-flight-path]');
  const butterfly = section.querySelector('[data-flight-butterfly]');
  const stage = section.querySelector('.corporate-flight');
  const svg = path.ownerSVGElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 4600;
  let visible = false, running = false, frame = 0, previousTime = 0;
  let elapsed = 0, progress = 0, from = 0, to = 1, length = 1;
  let lastY = scrollY, direction = 1, finishedY = scrollY, completed = false;
  butterfly.querySelector('g').setAttribute('transform','translate(-18 -18) scale(1.5)');
  const paint = () => {
    const point = path.getPointAtLength(length * progress);
    const before = path.getPointAtLength(Math.max(0,length * progress - 3));
    const after = path.getPointAtLength(Math.min(length,length * progress + 3));
    const tilt = reduced.matches ? 0 : Math.atan2(after.y-before.y,after.x-before.x) * 180 / Math.PI * .24 * (to > from ? 1 : -1);
    butterfly.setAttribute('transform',`translate(${point.x} ${point.y}) rotate(${tilt})`);
  };
  const tick = now => {
    frame = 0;
    if (!running || document.hidden) return;
    if (previousTime) elapsed += Math.max(0,now-previousTime);
    previousTime = now;
    const t = Math.min(1,elapsed / duration);
    // Smoothstep keeps the middle of the flight fluid and eases both ends.
    progress = from + (to-from) * (t*t*(3-2*t));
    paint();
    if (t < 1) frame = requestAnimationFrame(tick);
    else {
      running = false; completed = true; finishedY = scrollY;
      section.classList.remove('flight-running');
    }
  };
  const start = () => {
    if (running || !visible || document.hidden || reduced.matches) return;
    from = direction > 0 ? 0 : 1;
    to = 1-from;
    progress = from; elapsed = 0; previousTime = 0; completed = false;
    running = true;
    section.classList.add('flight-running');
    paint();
    frame = requestAnimationFrame(tick);
  };
  const resize = () => {
    const w = Math.max(280,svg.getBoundingClientRect().width);
    svg.setAttribute('viewBox',`0 0 ${w} 150`);
    path.setAttribute('d',`M28 90 C${w*.18} -20 ${w*.27} 150 ${w*.4} 75 S${w*.65} 5 ${w*.76} 75 S${w*.91} 145 ${w-28} 45`);
    length = path.getTotalLength();
    paint();
  };
  const scroll = () => {
    const delta = scrollY-lastY;
    if (Math.abs(delta) < 2) return;
    direction = delta > 0 ? 1 : -1;
    lastY = scrollY;
    // A return through the section can replay in the opposite direction.
    // Ignore scroll events during flight so trackpads cannot restart it midair.
    if (visible && completed && !running && Math.abs(scrollY-finishedY) > 100 &&
        ((progress >= 1 && direction < 0) || (progress <= 0 && direction > 0))) start();
  };
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    section.classList.toggle('journey-visible',visible);
    if (visible) {
      if (!running) start();
    } else if (!running) {
      completed = false;
    }
  },{rootMargin:'-12% 0px -12% 0px',threshold:0}).observe(stage);
  addEventListener('scroll',scroll,{passive:true});
  addEventListener('resize',resize,{passive:true});
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) {cancelAnimationFrame(frame);frame=0;previousTime=0;}
    else if (running) frame = requestAnimationFrame(tick);
    else if (visible && !completed) start();
  });
  reduced.addEventListener('change',() => {
    if (reduced.matches) {
      cancelAnimationFrame(frame);frame=0;running=false;completed=false;
      progress=.5;section.classList.remove('flight-running');paint();
    } else if (visible) start();
  });
  if (reduced.matches) progress=.5;
  resize();
})();

// Mantém a velocidade contínua do acervo, sem paradas por hover.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-case-reel]').forEach(reel => {
    let visible = false;
    const sync = () => reel.classList.toggle('is-running',visible && !document.hidden && !reduced.matches);
    new IntersectionObserver(entries => {visible=entries[0].isIntersecting;sync();},{threshold:0}).observe(reel);
    document.addEventListener('visibilitychange',sync);
    reduced.addEventListener('change',sync);
  });
})();
