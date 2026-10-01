(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    nav?.classList.toggle('open', open);
  });

  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const shell = document.querySelector('[data-product-search]');
  const input = shell?.querySelector('input');
  const dropdown = shell?.querySelector('.search-dropdown');
  const list = shell?.querySelector('[role="listbox"]');
  const clear = shell?.querySelector('.search-clear');
  const products = JSON.parse(document.querySelector('#search-product-data')?.textContent || '[]');
  const grid = document.querySelector('#product-grid');
  const empty = document.querySelector('#empty-search');
  let matches = [];
  let active = -1;

  const closeSearch = () => {
    if (!input) return;
    dropdown.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const select = index => {
    const options = [...list.querySelectorAll('[role="option"]')];
    active = index;
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    if (options[index]) {
      input.setAttribute('aria-activedescendant', options[index].id);
      options[index].scrollIntoView({ block: 'nearest' });
    }
  };
  const renderSearch = () => {
    const query = normalize(input.value);
    const terms = query.split(/\s+/).filter(Boolean);
    clear.hidden = !query;
    if (grid) {
      let visible = 0;
      grid.querySelectorAll(':scope > [data-search]').forEach(item => {
        const text = normalize(item.dataset.search);
        item.hidden = !terms.every(term => text.includes(term));
        if (!item.hidden) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
      const count = document.querySelector('#catalog-result-count');
      count.textContent = `${visible} ${visible === 1 ? 'produto' : 'produtos'}${query ? ' nesta seleção' : ' para sua marca'}`;
    }
    list.replaceChildren();
    active = -1;
    input.removeAttribute('aria-activedescendant');
    if (!query) { closeSearch(); return; }
    matches = products.filter(product => {
      const text = normalize(`${product.name} ${product.sku} ${product.line} ${product.short}`);
      return terms.every(term => text.includes(term));
    }).sort((a, b) => {
      const rank = product => normalize(product.name).startsWith(query) ? 0 : normalize(product.name).split(/\s+/).some(word => word.startsWith(query)) ? 1 : 2;
      return (a.stock_priority ?? 1) - (b.stock_priority ?? 1) || rank(a) - rank(b) || a.name.localeCompare(b.name, 'pt-BR');
    }).slice(0, 8);
    matches.forEach((product, i) => {
      const item = document.createElement('li');
      item.setAttribute('role', 'presentation');
      const link = document.createElement('a');
      link.href = product.url;
      link.id = `suggestion-${i}`;
      link.setAttribute('role', 'option');
      link.setAttribute('aria-selected', 'false');
      link.tabIndex = -1;
      const symbol = document.createElement('span');
      symbol.className = 'suggestion-icon';
      const categoryIcon = document.querySelector(`[data-category="${product.category}"] svg`);
      if (categoryIcon) symbol.append(categoryIcon.cloneNode(true));
      else symbol.textContent = '↗';
      const description = document.createElement('span');
      const name = document.createElement('strong');
      name.textContent = product.name;
      const detail = document.createElement('small');
      detail.textContent = `${product.line} · ${product.sku}`;
      description.append(name, detail);
      const arrow = document.createElement('span');
      arrow.className = 'suggestion-arrow';
      arrow.textContent = '↗';
      link.append(symbol, description, arrow);
      link.addEventListener('mouseenter', () => select(i));
      item.append(link);
      list.append(item);
    });
    shell.querySelector('.search-no-results').hidden = matches.length > 0;
    dropdown.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };
  input?.addEventListener('input', renderSearch);
  input?.addEventListener('focus', renderSearch);
  clear?.addEventListener('click', () => { input.value = ''; renderSearch(); input.focus(); });
  input?.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeSearch(); return; }
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      if (dropdown.hidden) renderSearch();
      if (!matches.length) return;
      select(event.key === 'ArrowDown' ? (active + 1) % matches.length : (active <= 0 ? matches.length - 1 : active - 1));
    }
    if (event.key === 'Enter' && !dropdown.hidden && matches.length) {
      event.preventDefault();
      window.location.assign(matches[active < 0 ? 0 : active].url);
    }
  });
  document.addEventListener('click', event => { if (shell && !shell.contains(event.target)) closeSearch(); });
  shell?.addEventListener('focusout', event => { if (!shell.contains(event.relatedTarget)) closeSearch(); });

  document.querySelectorAll('[data-view]').forEach(button => {
    button.addEventListener('click', () => {
      grid?.classList.toggle('list-view', button.dataset.view === 'list');
      document.querySelectorAll('[data-view]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    });
  });

  const toast = document.querySelector('.quote-toast');
  let toastTimer;
  toast?.querySelector('button').addEventListener('click', () => { toast.hidden = true; });
  document.querySelectorAll('.quick-quote-form').forEach(form => {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const button = form.querySelector('button');
      if (button.disabled) return;
      button.disabled = true;
      button.textContent = 'Adicionando…';
      try {
        const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Falha no envio');
        const result = await response.json();
        document.querySelectorAll('.quote-count').forEach(count => { count.textContent = result.count; count.classList.remove('count-pop'); void count.offsetWidth; count.classList.add('count-pop'); });
        const added = document.createElement('a');
        added.className = 'mini-quote is-added';
        added.href = result.quote_url;
        added.title = 'Ver ou editar este produto no orçamento';
        added.textContent = '✓ Adicionado';
        form.replaceWith(added);
        toast.querySelector('strong').textContent = 'Adicionado ao orçamento';
        toast.querySelector('.toast-name').textContent = result.name;
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.hidden = true; }, 6500);
      } catch (error) {
        button.disabled = false;
        button.textContent = 'Tentar novamente';
        toast.querySelector('strong').textContent = 'Não foi possível adicionar';
        toast.querySelector('.toast-name').textContent = 'Confira sua conexão e tente novamente.';
        toast.hidden = false;
      }
    });
  });

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.section-heading, .category-card, .line-card, .solution-card, .b2b-card, .reason-card').forEach((element, i) => {
      element.classList.add('reveal');
      element.style.setProperty('--delay', `${Math.min(i % 3 * 60, 120)}ms`);
      observer.observe(element);
    });
  }
  const videoDialog = document.querySelector('.video-dialog');
  if (videoDialog && typeof videoDialog.showModal === 'function') {
    const player = videoDialog.querySelector('video');
    const videoError = videoDialog.querySelector('.video-load-error');
    player.addEventListener('error', () => { if (player.getAttribute('src') && videoError) videoError.hidden = false; });
    let videoTrigger;
    document.querySelectorAll('[data-video-src]').forEach(trigger => {
      trigger.addEventListener('click', () => {
        videoTrigger = trigger;
        videoDialog.querySelector('h2').textContent = trigger.dataset.videoTitle;
        player.src = trigger.dataset.videoSrc;
        player.poster = trigger.dataset.videoPoster;
        if (videoError) {
          videoError.hidden = true;
          videoError.querySelector('a').href = trigger.dataset.videoSrc;
        }
        videoDialog.showModal();
        player.load();
        player.play().catch(() => {});
      });
    });
    videoDialog.querySelector('.video-dialog-close').addEventListener('click', () => videoDialog.close());
    videoDialog.addEventListener('click', event => {
      const bounds = videoDialog.getBoundingClientRect();
      if (event.target === videoDialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) videoDialog.close();
    });
    videoDialog.addEventListener('close', () => {
      player.pause();
      player.removeAttribute('src');
      player.load();
      videoTrigger?.focus();
    });
  } else {
    document.querySelectorAll('[data-video-src]').forEach(trigger => trigger.addEventListener('click', () => { window.location.href = trigger.dataset.videoSrc; }));
  }
})();
