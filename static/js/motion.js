(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData;
  document.querySelectorAll('.client-ribbon').forEach(ribbon => {
    const button = ribbon.querySelector('.ribbon-toggle');
    button.addEventListener('click', () => {
      const paused = ribbon.classList.toggle('is-paused');
      button.setAttribute('aria-pressed', String(paused));
      button.textContent = paused ? 'Continuar' : 'Pausar';
      button.setAttribute('aria-label', `${paused ? 'Continuar' : 'Pausar'} movimento das marcas`);
    });
  });
  document.querySelectorAll('.acervo-gallery:not(.acervo-designs), .archive-grid').forEach((gallery, index) => {
    gallery.classList.add('motion-gallery');
    gallery.id ||= `motion-gallery-${index}`;
    gallery.setAttribute('tabindex', '0');
    gallery.setAttribute('aria-label', 'Galeria de trabalhos: deslize para ver mais');
    const controls = document.createElement('div');
    controls.className = 'motion-gallery-controls';
    controls.innerHTML = '<span>Explore os trabalhos</span><button type="button" data-step="-1" aria-label="Fotos anteriores">←</button><button type="button" class="motion-toggle" aria-pressed="false">Pausar</button><button type="button" data-step="1" aria-label="Próximas fotos">→</button>';
    controls.querySelectorAll('button').forEach(button => button.setAttribute('aria-controls', gallery.id));
    controls.querySelector('span').textContent = `${gallery.children.length} trabalhos para explorar`;
    gallery.after(controls);
    let paused = reduced.matches, hovered = false, visible = false, direction = 1;
    const toggle = controls.querySelector('.motion-toggle');
    const sync = () => {toggle.textContent = paused ? 'Continuar' : 'Pausar';toggle.setAttribute('aria-pressed', String(paused));};
    sync();
    toggle.addEventListener('click', () => {paused = !paused;sync();});
    const step = value => {
      const first = gallery.firstElementChild;
      gallery.scrollBy({left: value * (first.getBoundingClientRect().width + 28), behavior: reduced.matches ? 'instant' : 'smooth'});
    };
    controls.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {paused = true;sync();step(Number(button.dataset.step));}));
    gallery.addEventListener('mouseenter', () => hovered = true);
    gallery.addEventListener('mouseleave', () => hovered = false);
    gallery.addEventListener('focusin', () => hovered = true);
    gallery.addEventListener('focusout', () => hovered = false);
    gallery.addEventListener('pointerdown', () => {paused = true;sync();}, {passive:true});
    new IntersectionObserver(entries => visible = entries[0].isIntersecting, {threshold:.3}).observe(gallery);
    setInterval(() => {
      if (paused || hovered || !visible || document.hidden || reduced.matches) return;
      const max = gallery.scrollWidth - gallery.clientWidth;
      if (max <= 1) return;
      if (gallery.scrollLeft >= max - 4) direction = -1;
      if (gallery.scrollLeft <= 4) direction = 1;
      step(direction);
    }, 5500);
  });
  document.querySelectorAll('.video-preview').forEach(preview => {
    const video = preview.querySelector('.motion-video');
    if (!video || saveData || reduced.matches) return;
    let paused = false, visible = false;
    const control = document.createElement('button');
    control.type = 'button';control.className = 'motion-video-toggle motion-toggle';control.textContent = 'Pausar prévia';control.setAttribute('aria-pressed','false');
    preview.after(control);
    const play = () => {
      if (!visible || paused || document.hidden || reduced.matches) {video.pause();return;}
      video.src ||= preview.dataset.videoSrc;
      video.play().then(() => preview.classList.add('is-playing')).catch(() => {});
    };
    control.addEventListener('click', () => {paused = !paused;control.textContent = paused ? 'Continuar prévia' : 'Pausar prévia';control.setAttribute('aria-pressed',String(paused));play();});
    new IntersectionObserver(entries => {visible = entries[0].isIntersecting;play();}, {threshold:.4}).observe(preview);
    document.addEventListener('visibilitychange', play);
    reduced.addEventListener('change',play);
    video.addEventListener('error', () => {preview.classList.remove('is-playing');control.hidden = true;});
  });
})();
