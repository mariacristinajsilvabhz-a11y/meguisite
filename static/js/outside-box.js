(() => {
 const form = document.getElementById('novo-projeto');
 if (!form) return;
 form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const value = (key) => String(data.get(key) || '').trim();
  const message = [
   'Olá, Megui! Quero criar um projeto Fora da caixa.',
   '', 'Nome: ' + value('name'), 'E-mail: ' + value('email'), 'Telefone: ' + value('phone'),
   '', 'Minha ideia:', value('idea'),
   '', 'Quantidade: ' + (value('quantity') || 'A definir'),
   'Prazo: ' + (value('deadline') || 'A definir'),
   'Investimento: ' + (value('budget') || 'Gostaria de orientação')
  ].join('\n');
  window.location.assign('https://wa.me/' + form.dataset.whatsapp + '?text=' + encodeURIComponent(message));
 });
})();
