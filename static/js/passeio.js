// Passeio pelo catálogo: carregamento contínuo, cores que trocam a foto,
// "+" que guarda no orçamento sem sair da página e volta ao ponto certo.
(() => {
  const root = document.querySelector('[data-passeio]');
  if (!root) return;
  const feed = root.querySelector('[data-feed]');
  const end = root.querySelector('[data-feed-end]');
  const tray = root.querySelector('[data-tray]');
  const status = root.querySelector('[data-tray-status]');
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const placeKey = 'megui-passeio:' + location.pathname + location.search.replace(/[?&]ate=\d+/, '');
  let loadedPages = Number(new URLSearchParams(location.search).get('ate')) || 1;

  // A barra de categorias gruda logo abaixo do cabeçalho fixo.
  const header = document.querySelector('.site-header');
  const syncSticky = () => {
    const style = header && getComputedStyle(header);
    const fixed = style && (style.position === 'sticky' || style.position === 'fixed');
    root.style.setProperty('--ps-sticky-top', fixed ? header.getBoundingClientRect().height + 'px' : '0px');
  };
  syncSticky();
  window.addEventListener('resize', syncSticky, { passive: true });

  // "Me surpreenda" sorteia uma nova ordem a cada clique.
  root.querySelector('[data-surprise]')?.addEventListener('click', event => {
    event.preventDefault();
    const url = new URL(event.currentTarget.href, location.href);
    url.searchParams.set('surpresa', Math.random().toString(36).slice(2, 10));
    location.href = url.toString();
  });

  // Carregamento contínuo: quando o link "Carregar mais" aparece, ele busca a próxima página.
  let loading = false;
  const loadMore = async link => {
    if (loading || !link?.dataset.src) return;
    loading = true;
    link.classList.add('is-loading');
    link.textContent = 'Carregando mais produtos';
    try {
      const response = await fetch(link.dataset.src, { headers: { Accept: 'text/html' } });
      if (!response.ok) throw new Error(String(response.status));
      const html = await response.text();
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      loadedPages = Number(link.dataset.page) || loadedPages + 1;
      link.replaceWith(template.content);
      const next = feed.querySelector('.ps-more');
      if (next) observe(next); else if (end) end.hidden = false;
    } catch (error) {
      link.classList.remove('is-loading');
      link.textContent = 'Carregar mais produtos';
    } finally {
      loading = false;
    }
  };
  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) loadMore(entry.target); }), { rootMargin: '900px 0px' })
    : null;
  const observe = link => {
    if (!observer) return;
    link.addEventListener('click', event => { event.preventDefault(); loadMore(link); });
    observer.observe(link);
  };
  const first = feed?.querySelector('.ps-more');
  if (first) observe(first);

  // Volta ao ponto certo: guarda quantas páginas estavam abertas e a posição.
  const savePlace = () => {
    try { sessionStorage.setItem(placeKey, JSON.stringify({ y: window.scrollY, pages: loadedPages })); } catch (_) {}
    const url = new URL(location.href);
    if (loadedPages > 1) url.searchParams.set('ate', String(Math.min(loadedPages, 5))); else url.searchParams.delete('ate');
    history.replaceState(history.state, '', url);
  };
  root.addEventListener('click', event => { if (event.target.closest('[data-keep-place], .ps-shelf-item, .ps-work a, .ps-idea a')) savePlace(); });
  window.addEventListener('pagehide', savePlace);
  try {
    const saved = JSON.parse(sessionStorage.getItem(placeKey) || 'null');
    if (saved && saved.y > 0) {
      sessionStorage.removeItem(placeKey);
      requestAnimationFrame(() => window.scrollTo(0, saved.y));
    }
  } catch (_) {}

  // Cores: trocar a bolinha troca a foto e a opção que vai para o orçamento.
  root.addEventListener('click', event => {
    const dot = event.target.closest('.ps-dot');
    if (!dot) return;
    const card = dot.closest('.ps-card');
    card.querySelectorAll('.ps-dot').forEach(other => other.setAttribute('aria-pressed', String(other === dot)));
    const input = card.querySelector('input[name="variant_id"]');
    if (input) input.value = dot.dataset.variant;
    const image = card.querySelector('[data-main-image]');
    if (image && dot.dataset.image) image.src = dot.dataset.image;
  });

  // "+": inclui no orçamento sem sair da página e a foto voa até a bandeja.
  const fly = (from, to) => {
    if (calm || !from || !to || !from.currentSrc) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const ghost = document.createElement('img');
    ghost.src = from.currentSrc;
    ghost.className = 'ps-fly';
    const size = Math.min(a.width, 120);
    Object.assign(ghost.style, { left: a.left + a.width / 2 - size / 2 + 'px', top: a.top + a.height / 2 - size / 2 + 'px', width: size + 'px', height: size + 'px' });
    document.body.append(ghost);
    const dx = b.left + 24 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.35 - 80}px) scale(.6)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.2 }
    ], { duration: 700, easing: 'cubic-bezier(.3,.6,.3,1)' }).finished.then(() => ghost.remove());
  };
  const updateTray = result => {
    if (!tray) return;
    tray.hidden = false;
    tray.querySelector('[data-tray-count]').textContent = result.count;
    const thumbs = tray.querySelector('[data-tray-thumbs]');
    thumbs.replaceChildren(...(result.thumbs || []).map(src => {
      if (!src) return document.createElement('i');
      const img = document.createElement('img'); img.src = src; img.alt = ''; return img;
    }));
    document.querySelectorAll('.quote-count').forEach(count => { count.textContent = result.count; });
    document.querySelector('.quote-button')?.setAttribute('aria-label', `Meu orçamento: ${result.count} itens`);
    if (!calm) { tray.classList.remove('is-bump'); void tray.offsetWidth; tray.classList.add('is-bump'); setTimeout(() => tray.classList.remove('is-bump'), 300); }
    if (status) status.textContent = `${result.name} incluído no orçamento. Agora são ${result.count} itens.`;
  };
  root.addEventListener('submit', async event => {
    const form = event.target.closest('.ps-add');
    if (!form) return;
    event.preventDefault();
    const button = form.querySelector('button');
    if (button.disabled) return;
    button.disabled = true;
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(String(response.status));
      const result = await response.json();
      if (tray) tray.hidden = false;
      fly(form.closest('.ps-card').querySelector('[data-main-image]'), tray);
      setTimeout(() => updateTray(result), calm ? 0 : 520);
      button.classList.add('is-added');
      button.setAttribute('aria-label', `${result.name} está no orçamento. Incluir de novo`);
    } catch (error) {
      if (status) status.textContent = 'Não foi possível incluir agora. Tente de novo em instantes.';
      form.submit();
    } finally {
      button.disabled = false;
    }
  });
})();
