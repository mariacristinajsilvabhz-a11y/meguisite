(() => {
 'use strict';
 const form = document.getElementById('novo-projeto');
 if (!form) return;
 const panel = document.getElementById('question-panel');
 const next = document.getElementById('next-step');
 const back = document.getElementById('previous-step');
 const error = document.getElementById('step-error');
 const data = {intent:'', audience:'', mood:[], idea:'', reference:'', quantity:'Ainda não sei', deadline:'Sem data definida', budget:'Quero orientação', name:'', email:'', phone:''};
 let step = 0;
 const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const steps = ['A faísca','Para quem?','O clima','Seu toque','Na medida','Sua ideia','Vamos conversar'];
 const titles = ['O que trouxe você aqui?','Para quem vamos criar?','Que sensação você quer provocar?','O que não pode faltar?','Vamos dar tamanho à ideia?','Olha o que estamos imaginando.','Como podemos chamar você?'];
 const hints = ['Pode ser uma ideia pronta ou só uma vontade.','Cada pessoa e cada ocasião pedem um cuidado diferente.','Escolha uma ou misture algumas. A combinação é sua.','Qual produto você imagina? Como será usado? Conte detalhes, materiais e o que deseja personalizar.','Uma estimativa já ajuda. E tudo bem ainda não saber.','Este é o ponto de partida. Revise e ajuste o que quiser.','Agora a conversa continua com gente de verdade, no WhatsApp.'];
 const photos = {
  intent: ['img/trabalhos/2026/fones-fecomercio-estudio-20261022.webp','img/hero-camisetas.webp','img/trabalhos/2026/kit-eepof-estudio-20261022.webp','img/trabalhos/2026/kit-infinix-estudio-20261022.webp'],
  audience: ['img/apresentacoes/equipe-uniformizada.webp','img/eventos/kits-evento-v4.webp','img/trabalhos/2026/kit-eepof-estudio-20261022.webp','img/trabalhos/2026/fones-fecomercio-estudio-20261022.webp','img/hero-camisetas.webp']
 };
 const options = (key, items, multiple = false) => `<div class="choice-grid ${photos[key] ? 'visual-choice-grid' : ''} ${key === 'mood' ? 'mood-grid' : ''}" role="group" aria-label="${escape(titles[step])}">${items.map(([value,sub,icon],i) => `<button type="button" class="idea-choice choice-${i}" data-key="${key}" data-value="${escape(value)}" aria-pressed="${multiple ? data[key].includes(value) : data[key] === value}"><span class="choice-art" aria-hidden="true">${photos[key] ? `<img src="/static/${photos[key][i]}" alt="" loading="lazy">` : icon}</span><span><strong>${escape(value)}</strong><small>${escape(sub)}</small></span><span class="choice-check" aria-hidden="true">✓</span></button>`).join('')}</div>`;
 const input = (key,label,placeholder='',type='text',required=false) => `<label class="field-label" for="project-${key}">${label}${required ? ' <span aria-hidden="true">*</span>' : ''}<input id="project-${key}" name="${key}" type="${type}" value="${escape(data[key])}" placeholder="${escape(placeholder)}" maxlength="${key === 'reference' ? 500 : 150}" ${required ? 'required' : ''} ${['name','email','phone'].includes(key) ? `autocomplete="${key === 'phone' ? 'tel' : key}"` : ''}></label>`;
 const practical = (key,label,choices) => `<label class="field-label" for="project-${key}">${label}<select id="project-${key}" name="${key}">${choices.map(v=>`<option ${data[key]===v?'selected':''}>${escape(v)}</option>`).join('')}</select></label>`;
 const summaryRows = () => [['O começo',data.intent,0],['Para quem',data.audience,1],['O clima',data.mood.join(' + ') || 'Vamos descobrir juntos',2],['Seu toque',data.idea || 'Quero ajuda para decidir',3],['Referência',data.reference || 'Posso enviar fotos pelo WhatsApp',3],['Quantidade',data.quantity,4],['Prazo',data.deadline,4],['Investimento',data.budget,4]];
 function render(focus=false) {
  error.textContent = '';
  panel.innerHTML = `<h2 tabindex="-1">${titles[step]}</h2><p class="question-hint">${hints[step]}</p>`;
  if(step===0) panel.innerHTML += options('intent', [['Busco um produto fora do catálogo','Já sei o que procuro, mas não encontrei.','✎'],['Quero criar minha marca ou coleção','Produtos com a minha identidade para vender.','✧'],['Quero desenvolver uma ideia','Um kit, um presente ou algo diferente.','✳'],['Preciso de inspiração','Vamos descobrir as possibilidades.','❀']]);
  if(step===1) panel.innerHTML += options('audience', [['Minha empresa','Marca, equipe ou clientes.','▦'],['Um evento','Um encontro para lembrar.','✹'],['Alguém especial','Tem uma pessoa em mente.','♡'],['Para mim','Porque também vale se presentear.','☺'],['Minha loja ou coleção','Uma linha para apresentar e vender.','✦']]);
  if(step===2) panel.innerHTML += options('mood', [['Divertido','Cor e uma dose de alegria.','✳'],['Delicado','Leve, afetivo, cheio de cuidado.','❀'],['Elegante','Detalhes que fazem a diferença.','✦'],['Diferente','Uma surpresa fora do óbvio.','〰']],true) + '<p class="choice-tip">Pode continuar sem escolher: a gente ajuda a encontrar o estilo.</p>';
  if(step===3) {
   const prompts = {'Minha empresa':'Qual é a marca? O que você quer que a equipe ou os clientes sintam?','Um evento':'Que evento é esse? Tem um tema, uma história ou uma data especial?','Alguém especial':'Quem vai receber? Conte um detalhe que tenha a cara dessa pessoa.','Para mim':'O que tem a sua cara? Como você imagina usar essa criação?','Minha loja ou coleção':'Que produtos quer vender? Já tem nome ou logo? Conte como imagina sua primeira coleção.'};
   panel.innerHTML += `<label class="field-label" for="project-idea">Conte do seu jeito <span>(opcional)</span><textarea id="project-idea" name="idea" maxlength="1800" rows="4" placeholder="${prompts[data.audience] || 'O que você gostaria de criar?'}">${escape(data.idea)}</textarea></label><button type="button" class="help-chip" id="help-idea">Quero ajuda para decidir</button>${input('reference','Tem um link de inspiração? <span>(opcional)</span>','Cole um link do Pinterest, de uma foto ou de outra referência','url')}<p class="choice-tip">Fotos e arquivos podem ser enviados na conversa do WhatsApp.</p>`;
  }
  if(step===4) panel.innerHTML += practical('quantity','Quantas peças você imagina?',['Ainda não sei','1 a 10 peças','11 a 30 peças','31 a 100 peças','101 a 300 peças','Mais de 300 peças']) + practical('deadline','Quando gostaria de receber?',['Sem data definida','Em até 15 dias','Em até 30 dias','Em 1 a 2 meses','Daqui a mais de 2 meses']) + practical('budget','Quanto imagina investir no projeto todo?',['Quero orientação','Até R$ 300','R$ 300 a R$ 1.000','R$ 1.000 a R$ 3.000','Mais de R$ 3.000']) + '<p class="choice-tip">São referências para a conversa. Valores, quantidade mínima e viabilidade do prazo dependem do projeto.</p>';
  if(step===5) panel.innerHTML += `<div class="project-summary">${summaryRows().map(([label,value,index]) => `<div class="summary-row"><div><span>${label}</span><p>${escape(value)}</p></div><button type="button" data-edit="${index}" aria-label="Editar ${label.toLowerCase()}">Editar</button></div>`).join('')}</div>`;
  if(step===6) panel.innerHTML += '<p class="choice-tip">Os três campos abaixo são obrigatórios.</p>' + input('name','Seu nome','Como você gosta de ser chamado?','text',true) + input('email','E-mail','voce@exemplo.com','email',true) + input('phone','WhatsApp com DDD','(31) 99999-9999','tel',true);
  document.getElementById('step-count').textContent = `${String(step+1).padStart(2,'0')} / 07`;
  document.getElementById('step-label').textContent = steps[step];
  document.getElementById('journey-fill').style.width = `${(step+1)/7*100}%`;
  back.hidden = step===0;
  next.innerHTML = step===6 ? 'Levar minha ideia para a Megui <span aria-hidden="true">✳</span>' : step===5 ? 'É por aqui! Vamos conversar <span aria-hidden="true">✳</span>' : 'Continuar <span aria-hidden="true">✳</span>';
  document.getElementById('journey-note').textContent = step===6 ? 'O botão abre o WhatsApp com seu resumo e seus dados. Confira a mensagem e toque em enviar para iniciar a conversa.' : 'Uma escolha de cada vez. Você pode mudar de ideia.';
  updateBoard();
  if(focus) panel.querySelector('h2').focus({preventScroll:true});
 }
 function capture() { panel.querySelectorAll('[name]').forEach(el => { data[el.name]=el.value.trim(); }); }
 function updateBoard() {
  const labels=[data.intent,data.audience,...data.mood].filter(Boolean);
  document.getElementById('idea-tags').innerHTML = labels.map(v=>`<span>${escape(v)}</span>`).join('');
  document.querySelector('.idea-scene').classList.toggle('is-opening', step>=5);
  document.querySelector('.idea-scene').classList.toggle('has-ideas',labels.length>0);
  document.getElementById('board-caption').textContent = ['Tudo começa com um “e se…”.','Já temos uma faísca.','Agora, uma dose de personalidade.','Os detalhes fazem a ideia ser sua.','Do sonho aos primeiros contornos.','Sua ideia já tem um começo.','Vamos criar o próximo capítulo?'][step];
 }
 function move(index) { capture(); step=index; render(true); form.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}); }
 panel.addEventListener('click', event => {
  const choice=event.target.closest('[data-key]');
  if(choice) {
   const {key,value}=choice.dataset;
   if(key==='mood') data.mood = data.mood.includes(value) ? data.mood.filter(v=>v!==value) : [...data.mood,value]; else data[key]=value;
   panel.querySelectorAll('[data-key]').forEach(button=>button.setAttribute('aria-pressed',String(key==='mood'?data.mood.includes(button.dataset.value):data[key]===button.dataset.value)));
   error.textContent=''; updateBoard();
  }
  const edit=event.target.closest('[data-edit]'); if(edit) move(Number(edit.dataset.edit));
  if(event.target.closest('#help-idea')) { const field=panel.querySelector('textarea'); if(!field.value.trim()) field.value='Quero ajuda para decidir.'; field.focus(); }
 });
 back.addEventListener('click',()=>move(step-1));
 function advance() {
  capture(); error.textContent='';
  if((step===0&&!data.intent)||(step===1&&!data.audience)) { error.textContent='Escolha uma opção para continuarmos.'; panel.querySelector('.idea-choice').focus(); return; }
  if(step===3 && data.reference) { try { const url=new URL(data.reference); if(!['http:','https:'].includes(url.protocol)) throw new Error(); } catch { error.textContent='Use um link completo, começando com https://, ou deixe a referência para o WhatsApp.'; panel.querySelector('[name="reference"]').focus(); return; } }
  if(step<6) { move(step+1); return; }
  const phone=panel.querySelector('[name="phone"]');
  const name=panel.querySelector('[name="name"]');
  name.setCustomValidity(data.name.length<2?'Conte como podemos chamar você.':'');
  phone.setCustomValidity(/^\+?[\d\s().-]+$/.test(data.phone)&&/^(?:55)?\d{10,11}$/.test(data.phone.replace(/\D/g,''))?'':'Informe um telefone válido com DDD (10 ou 11 dígitos; +55 é opcional).');
  if(!form.reportValidity()) return;
  const number = (form.dataset.whatsapp||'').replace(/\D/g,'');
  if(!number) { error.textContent='Não foi possível abrir o WhatsApp. Use o contato no rodapé; suas respostas continuam aqui.'; return; }
  const message=['Olá, Megui! Vamos criar algo fora da caixa?', '', ...summaryRows().map(([label,value])=>`${label}: ${value}`),'',`Nome: ${data.name}`,`E-mail: ${data.email}`,`WhatsApp: ${data.phone}`].join('\n');
  const url=`https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  window.location.assign(url);
 }
 next.addEventListener('click',advance);
 form.addEventListener('submit',event=>{event.preventDefault();advance();});
 panel.addEventListener('input',event=>{if(event.target.setCustomValidity) event.target.setCustomValidity('');});
 document.querySelectorAll('[data-project-intent]').forEach(link => link.addEventListener('click', () => {
  capture(); data.intent = link.dataset.projectIntent; step = 1; render(true);
 }));
 render();
})();
