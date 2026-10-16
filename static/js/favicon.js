// A borboleta é a assinatura fixa; a logo aparece discretamente entre os ciclos.
(() => {
 const icon = document.getElementById('megui-favicon');
 if (!icon) return;
 const butterfly = icon.href;
 const logo = icon.dataset.logo;
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 let timer = null, showingLogo = false;
 const show = useLogo => {
  showingLogo = useLogo;
  icon.type = useLogo ? 'image/png' : 'image/svg+xml';
  icon.href = useLogo ? logo : butterfly;
 };
 const update = () => {
  clearInterval(timer); timer = null; show(false);
  if (!document.hidden && !reduced.matches && loaded) {
   timer = setInterval(() => show(!showingLogo), 5000);
  }
 };
 let loaded = false;
 const preload = new Image();
 preload.onload = () => { loaded = true; update(); };
 preload.src = logo;
 document.addEventListener('visibilitychange', update);
 reduced.addEventListener('change', update);
 addEventListener('pagehide', () => clearInterval(timer));
 addEventListener('pageshow', update);
})();
