/* Revelação na rolagem para o site inteiro.
   Percorre o conteúdo (main e rodapé) e escolhe "blocos": títulos, textos, imagens, botões
   e os cartões de grades/fileiras. O que já está na tela ao abrir fica como está (a entrada da
   página cuida disso); o que está abaixo fica esperando e aparece, em sequência, ao rolar.
   Conteúdo que entra depois (catálogo, feeds) também aparece com a mesma transição.
   Para tirar um trecho do efeito: data-no-reveal no elemento. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  const LEAF = new Set(['H1','H2','H3','H4','H5','H6','P','BLOCKQUOTE','FIGURE','PICTURE','IMG','VIDEO','IFRAME','TABLE','FORM','A','BUTTON','LABEL','SMALL','DL','HR','CANVAS']);
  const NEVER = new Set(['SCRIPT','STYLE','TEMPLATE','NOSCRIPT','DIALOG','LINK','META','BR','SOURCE','TRACK','DEFS','INPUT','SELECT','TEXTAREA','OPTION']);
  const MEDIA = new Set(['IMG','PICTURE','FIGURE','VIDEO','IFRAME','CANVAS']);
  const SKIP_SEL = '[data-no-reveal],[hidden],[aria-hidden="true"]:not(img):not(svg):not(figure),.sr-only,.visually-hidden,.whatsapp-float,.back-to-top,.toast,[role="dialog"],[aria-live]';

  const isFixedLike = cs => cs.position === 'fixed' || cs.position === 'sticky';
  const isScroller = (el, cs) => /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 8;
  const hasLoop = el => el.getAnimations ? el.getAnimations().some(a => a.effect?.getTiming?.().iterations === Infinity) : false;
  const isLayout = cs => /(grid|flex)/.test(cs.display);

  const picked = [];
  function visit(el, vh) {
    if (NEVER.has(el.tagName) || el.matches(SKIP_SEL)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || isFixedLike(cs)) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width && !rect.height && cs.display !== 'contents') return;
    const kids = [...el.children].filter(k => !NEVER.has(k.tagName));
    const parent = el.parentElement;
    const pcs = parent ? getComputedStyle(parent) : null;
    const inLayout = pcs && isLayout(pcs) && parent.children.length > 1;
    // Peças soltas sobre outras (selos, enfeites) entram com o conjunto, não sozinhas.
    if (cs.position === 'absolute' && (rect.width < 90 || rect.height < 90)) return;
    if (el.tagName === 'svg' || el.tagName === 'SVG') { if (rect.width >= 60 && rect.height >= 60) picked.push(el); return; }
    if (LEAF.has(el.tagName) || isScroller(el, cs) || hasLoop(el) || el.tagName === 'UL' && !isLayout(cs) || el.tagName === 'OL' && !isLayout(cs)) { picked.push(el); return; }
    if (!kids.length) { if (el.textContent.trim()) picked.push(el); return; }
    if (inLayout && rect.height <= vh * .6) { picked.push(el); return; }
    kids.forEach(k => visit(k, vh));
  }

  let order = 0;
  const pending = new Set();
  function reveal(el, delay) {
    pending.delete(el);
    el.classList.remove('mg-wait');
    const media = MEDIA.has(el.tagName);
    el.animate(
      media ? [{opacity:0, translate:'0 34px', scale:'.965'}, {opacity:1, translate:'0 0', scale:'1'}]
            : [{opacity:0, translate:'0 26px'}, {opacity:1, translate:'0 0'}],
      {duration: media ? 900 : 720, delay, easing:'cubic-bezier(.2,.7,.2,1)', fill:'backwards'}
    );
  }

  const io = new IntersectionObserver(entries => {
    const entering = [];
    entries.forEach(e => {
      if (!pending.has(e.target)) return io.unobserve(e.target);
      if (e.isIntersecting) entering.push(e);
      else if (e.boundingClientRect.bottom < 0) { io.unobserve(e.target); pending.delete(e.target); e.target.classList.remove('mg-wait'); }
    });
    entering.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    entering.forEach((e, i) => { io.unobserve(e.target); reveal(e.target, Math.min(i * 70, 420)); });
  }, {rootMargin:'0px 0px -1px 0px', threshold:0});

  function prepare(roots, dynamic) {
    const vh = innerHeight;
    picked.length = 0;
    roots.forEach(r => r && visit(r, vh));
    picked.forEach(el => {
      el.dataset.mg = ++order;
      const top = el.getBoundingClientRect().top;
      // Ao abrir a página, o que já está visível fica parado; conteúdo novo sempre entra animado.
      if (!dynamic && top < vh * .92) return;
      el.classList.add('mg-wait');
      pending.add(el);
      io.observe(el);
    });
  }

  function start() {
    const main = document.querySelector('main');
    if (!main) return;
    prepare([...main.children, document.querySelector('.site-footer')], false);

    // Conteúdo inserido depois (catálogo, resultados, feeds): anima ao chegar.
    let queue = new Set(), scheduled = false;
    new MutationObserver(list => {
      list.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType !== 1 || n.closest('[data-mg],[data-no-reveal]')) return;
        if (!n.closest('main, .site-footer')) return;
        queue.add(n);
      }));
      if (queue.size && !scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          scheduled = false;
          const roots = [...queue].filter(n => n.isConnected && !n.closest('[data-mg]'));
          queue = new Set();
          if (roots.length) prepare(roots, true);
        });
      }
    }).observe(main, {childList:true, subtree:true});

    // Se alguém mudar para "menos movimento" com a página aberta, mostra tudo.
    reduced.addEventListener?.('change', () => { if (reduced.matches) pending.forEach(el => reveal(el, 0)); });
  }

  // Espera o layout assentar (fontes/imagens com tamanho) para medir posições corretas.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(start));
  else requestAnimationFrame(start);
})();
