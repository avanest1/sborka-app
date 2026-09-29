(()=>{'use strict';
const products=['Сборка мангала','Сборка печки','Коптильня','Центральная секция до 2000 мм','Центральная секция 2120 мм','Центральная секция 2350 мм','Решётка для мангала','Дровник','Ручка для мангала','Подарочная доска','Выдвижной ящик','Стеллаж навесной','Шкафчик навесной','Стол','Стул с покраской в 1 слой','Стул с покраской в 2 слоя','Скручивание столов'];
const periods=['Основное время','Переработка до 3 ч','Переработка после 3 ч'];
const parts=['Столешница','Боковой экран','Дверь','Фартук','Полка','Врезка с монтажом','Большой фартук'];
const staff=['Антон','Нарик','Леня','Фил','Кореш'];
const tg=window.Telegram?.WebApp;
const el=id=>document.getElementById(id);
if(tg){tg.ready();tg.expand()}
// A visible accessory button also works with the iOS numeric keyboard.
const keyboardDone=document.createElement('button');
keyboardDone.type='button';keyboardDone.className='keyboard-done';
keyboardDone.textContent='Готово';keyboardDone.hidden=true;
keyboardDone.setAttribute('aria-label','Скрыть клавиатуру');
document.body.append(keyboardDone);
const editable=n=>n instanceof HTMLElement&&n.matches('textarea,input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]):not([type=hidden])');
function positionKeyboardDone(){
  const viewport=window.visualViewport;
  // Coordinates in the layout viewport; follow iOS keyboard resize and pan.
  keyboardDone.style.top=Math.max(8,(viewport?viewport.offsetTop+viewport.height:window.innerHeight)-56)+'px';
}
function hideInputKeyboard(){
  if(editable(document.activeElement))document.activeElement.blur();
  if(typeof tg?.hideKeyboard==='function'&&(!tg.isVersionAtLeast||tg.isVersionAtLeast('9.1'))){
    try{tg.hideKeyboard()}catch(_){/* blur is the fallback for older clients */}
  }
  keyboardDone.hidden=true;
}
keyboardDone.addEventListener('pointerdown',e=>e.preventDefault());
keyboardDone.addEventListener('click',hideInputKeyboard);
document.addEventListener('focusin',e=>{
  if(!editable(e.target))return;
  if(e.target.tagName==='INPUT')e.target.setAttribute('enterkeyhint','done');
  keyboardDone.hidden=false;positionKeyboardDone();
});
document.addEventListener('focusout',()=>setTimeout(()=>{
  if(!editable(document.activeElement))keyboardDone.hidden=true;
},0));
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&!e.isComposing&&editable(e.target)&&e.target.tagName==='INPUT'){
    e.preventDefault();hideInputKeyboard();
  }
});
window.visualViewport?.addEventListener('resize',positionKeyboardDone);
window.visualViewport?.addEventListener('scroll',positionKeyboardDone);
window.addEventListener('resize',positionKeyboardDone);

const fromBot=new URLSearchParams(window.location.search).get('employee');
const employee=staff.includes(fromBot)||fromBot==='Андрей'?fromBot:null;
const adminView=employee==='Андрей';
const telegramFirstName=String(tg?.initDataUnsafe?.user?.first_name||'').trim();
const visibleName=employee||(telegramFirstName?telegramFirstName:'Откройте через бота');
el('employee-name').textContent=visibleName;
el('employee-avatar').textContent=visibleName==='Откройте через бота'?'·':Array.from(visibleName)[0].toLocaleUpperCase('ru');
if(!employee)document.querySelector('.profile__caption').textContent=telegramFirstName?'ПРОФИЛЬ TELEGRAM':'СОТРУДНИК';
if(adminView){el('admin-picker').classList.remove('hide');el('tab-admin').classList.remove('hide');document.querySelector('.tabs').classList.add('admin-tabs');el('hero-label').textContent='Кабинет руководителя';document.querySelector('.profile__caption').textContent='РУКОВОДИТЕЛЬ';staff.forEach(n=>{option(el('admin-employee'),n);option(el('admin-filter-employee'),n)})}
const day=()=>{const x=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(y=>[y.type,y.value]));return `${x.year}-${x.month}-${x.day}`};
const today=day();
el('date').value=today;el('date').max=today;
el('today-label').textContent=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',weekday:'long'}).format(new Date());
function section(name){for(const n of ['shift','assembly','admin']){el(n).classList.toggle('hide',n!==name);el('tab-'+n).classList.toggle('active',n===name);el('tab-'+n).setAttribute('aria-selected',String(n===name))}el('message').classList.add('hide')}
el('tab-shift').onclick=()=>section('shift');el('tab-assembly').onclick=()=>section('assembly');
el('tab-admin').onclick=()=>{if(!adminView)return;section('admin');loadAdmin()};
function option(select,value){const item=document.createElement('option');item.value=value;item.textContent=value;select.append(item)}
products.forEach(n=>option(el('product'),n));periods.forEach(n=>option(el('period'),n));
for(const [i,name] of parts.entries()){const row=document.createElement('div');row.className='part';const label=document.createElement('label');label.htmlFor='part-'+i;label.textContent=name;const input=document.createElement('input');input.id='part-'+i;input.type='number';input.min='0';input.max='1000';input.step='1';input.value='0';input.inputMode='numeric';row.append(label,input);el('parts').append(row)}
el('product').onchange=()=>{const table=el('product').value==='Стол';el('table-parts').classList.toggle('hide',!table);el('ordinary').classList.toggle('hide',table);el('qty').required=!table};
function notice(message){const box=el('message');box.textContent=message;box.className='notice error';box.scrollIntoView({behavior:'smooth',block:'center'})}
function assemblyNote(){
  const bonus=el('note').value.trim();
  const problem=el('problem').value.trim();
  const responsible=el('responsible').value.trim();
  if(responsible&&!problem){notice('Опишите проблему перед указанием предполагаемого ответственного.');el('problem').focus();return null}
  const segments=[];
  if(bonus)segments.push('Запрос надбавки: '+bonus);
  if(problem)segments.push('Возникшие проблемы на производстве при сборке изделия: '+problem);
  if(responsible)segments.push('По мнению сборщика, ответственным может быть: '+responsible+' (требует проверки)');
  const note=segments.join('\n');
  const limit=1000-(adminView?'\nВнёс Андрей через Telegram'.length:0);
  if(note.length>limit){notice('Сократите комментарии: общий предел 1000 символов с учётом служебной подписи.');return null}
  return note;
}
function send(payload){if(!tg||typeof tg.sendData!=='function'){notice('Не загрузилось соединение с Telegram (T1, версия 12). Откройте приложение заново через кнопку «Личный кабинет» в чате с ботом.');return}if(tg.platform==='unknown'){notice('Страница открыта вне приложения Telegram (T2, версия 12). Откройте её через кнопку «Личный кабинет» в чате с ботом.');return}if(adminView&&!['photoHelp','adminEditAssembly','adminEditAttendance','adminAcceptAssembly','adminAcceptAssemblies','adminDeleteAssembly'].includes(payload.type)){const target=el('admin-employee').value;if(!staff.includes(target)){notice('Сначала выберите сотрудника.');el('admin-employee').focus();return}payload.employee=target}const raw=JSON.stringify(payload);if(new TextEncoder().encode(raw).length>4096){notice('Комментарий слишком длинный для отправки.');return}tg.sendData(raw)}
el('arrive').onclick=()=>send({version:1,type:'arrive'});
el('leave').onclick=()=>send({version:1,type:'leave'});
el('assembly-form').onsubmit=e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;const product=el('product').value,table=product==='Стол';const qty=Number(el('qty').value);const tableParts=parts.map((_,i)=>Number(el('part-'+i).value));if(table&&(!tableParts.some(x=>x>0)||tableParts.some(x=>!Number.isInteger(x)||x<0||x>1000))){notice('Укажите хотя бы один элемент стола и проверьте количество.');return}if(!table&&(!Number.isInteger(qty)||qty<1||qty>100000)){notice('Количество изделий должно быть от 1 до 100000.');return}const note=assemblyNote();if(note===null)return;send({version:1,type:'assembly',date:el('date').value,product,qty:table?1:qty,parts:table?tableParts:[],period:el('period').value,order:el('order').value.trim(),note})};

// Read only, signed Telegram data. The endpoint URL is supplied by the bot to
// the owner's keyboard button. Mutations always use Telegram sendData above.
const adminEndpoint=new URLSearchParams(location.search).get('api')||'';
const adminReadToken=new URLSearchParams((location.hash||'').replace(/^#/, '')).get('adminRead')||'';
const startWeek=()=>{
  const d=new Date(today+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
  return d.toISOString().slice(0,10)
};
el('admin-week').value=startWeek();
el('admin-week').max=today;
const selectedAssemblies=new Map();
function bulkSelectionStatus(){
  const count=selectedAssemblies.size;
  el('admin-bulk-count').textContent='Выбрано: '+count+' из 8';
  el('admin-bulk-accept').disabled=count<2;
}
el('admin-bulk-accept').onclick=()=>{
  const chosen=[...selectedAssemblies.values()];
  if(chosen.length<2||chosen.length>8)return;
  const summary=chosen.map(r=>'• '+r.name+' · '+r.product+' × '+r.qty+
    ' · заказ № '+r.order+' · ID '+r.key).join('\n');
  if(!window.confirm('Принять '+chosen.length+' заявок и учесть их в зарплате?\n\n'+summary))return;
  send({version:1,type:'adminAcceptAssemblies',status:'Принято',
    items:chosen.map(r=>({row:r.row,key:r.key,link:r.link,rev:r.rev}))});
  adminStatus('Запрос передан боту. Дождитесь подтверждения в чате, затем обновите список.');
};
const node=(tag,content,klass)=>{
  const n=document.createElement(tag);
  if(content!=null)n.textContent=String(content);
  if(klass)n.className=klass;
  return n;
};
function field(parent,label,type,value,options){
  const wrap=node('label',label,'admin-fields');
  let control;
  if(options){
    control=document.createElement('select');
    options.forEach(v=>option(control,v));
  }else if(type==='textarea')control=document.createElement('textarea');
  else{control=document.createElement('input');control.type=type}
  control.value=value==null?'':String(value);
  wrap.append(control);parent.append(wrap);
  return control;
}
function adminStatus(value){
  el('admin-status').textContent=value;
}
let adminData=null,adminRequest=0;
function adminRequestData(week, extra={}){
  return new Promise((resolve,reject)=>{
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(adminEndpoint))
      return reject(new Error('Обновите веб-приложение Apps Script и снова откройте кабинет кнопкой бота.'));
    if(!adminReadToken&&!tg?.initData)return reject(new Error('Обновите кнопку: отправьте боту /menu и откройте новый «Личный кабинет».'));
    const callback='__tgAdm_'+Math.random().toString(36).slice(2,14);
    const url=new URL(adminEndpoint);
    url.searchParams.set('callback',callback);
    if(adminReadToken)url.searchParams.set('readToken',adminReadToken);
    else url.searchParams.set('initData',tg.initData);
    if(week)url.searchParams.set('week',week);
    for(const [key,value] of Object.entries(extra))url.searchParams.set(key,value);
    const script=document.createElement('script');
    script.referrerPolicy='no-referrer';
    let done=false,timeout;
    function finish(error,data){
      if(done)return;done=true;clearTimeout(timeout);
      delete window[callback];script.remove();
      error?reject(error):resolve(data);
    }
    window[callback]=r=>r?.ok?finish(null,r.data):finish(new Error(r?.message||'Нет ответа сервера.'));
    script.onerror=()=>finish(new Error('Не удалось загрузить данные. Проверьте развертывание веб-приложения.'));
    timeout=setTimeout(()=>finish(new Error('Сервер долго отвечает. Повторите обновление.')),30000);
    script.src=url.toString();document.head.append(script);
  });
}
function adminNormalizeWeek(){
  const date=el('admin-week').value;
  const d=new Date(date+'T12:00:00Z');
  if(!date||!Number.isFinite(d.getTime()))throw new Error('Выберите дату недели.');
  d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
  const monday=d.toISOString().slice(0,10);
  if(monday<'2026-09-14'||monday>today)throw new Error('Выберите неделю с 14.09.2026.');
  const end=new Date(d);end.setUTCDate(end.getUTCDate()+6);
  el('admin-period').textContent='Период: '+monday.split('-').reverse().join('.')+' — '+end.toISOString().slice(0,10).split('-').reverse().join('.');
  return monday;
}
function accountingIssue(r){
  return (r.payCheck!==undefined&&r.payCheck!=='OK')||
    (r.bonusCheck!==undefined&&r.bonusCheck!=='OK');
}
function accountingSummary(r){
  if(r.payCheck===undefined)return null;
  if(accountingIssue(r))return {warning:true,text:'Проверьте расчёт: '+
    [r.payCheck!=='OK'?r.payCheck||'проверка сделки недоступна':'',
      r.bonusCheck!=='OK'?r.bonusCheck||'проверка надбавки недоступна':'']
      .filter(Boolean).join(' · ')};
  const amount=Number(r.payAmount),bonus=Number(r.payBonus);
  if(!Number.isFinite(amount)||!Number.isFinite(bonus))
    return {warning:true,text:'Проверьте расчёт: сумма по заявке недоступна.'};
  const rubles=value=>new Intl.NumberFormat('ru-RU',{
    style:'currency',currency:'RUB',maximumFractionDigits:2}).format(value);
  return {warning:false,text:'В расчёте по заявке: сделка '+rubles(amount)+
    ' · надбавка '+rubles(bonus)};
}
function addAccountingStatus(box,r){
  const result=accountingSummary(r);
  if(result)box.append(node('p',result.text,result.warning?'admin-warning':'admin-accounting'));
}
function filterAssemblyRows(rows,filters){
  const query=filters.query.trim().toLocaleLowerCase('ru');
  return rows.filter(r=>{
    if(filters.status==='attention'&&!r.statusMismatch&&!accountingIssue(r)&&
        r.status!=='Ожидает приёмки'&&r.status!=='Своя переделка')return false;
    if(filters.status!=='attention'&&filters.status!=='all'&&r.status!==filters.status)return false;
    if(filters.employee&&r.name!==filters.employee)return false;
    return !query||[r.key,r.order,r.product,r.name].some(value=>
      String(value||'').toLocaleLowerCase('ru').includes(query));
  });
}
function queueFilters(){
  return {status:el('admin-filter-status').value,employee:el('admin-filter-employee').value,
    query:el('admin-filter-query').value};
}
function updateAdminQueue(){
  if(selectedAssemblies.size)adminStatus('Фильтр изменён. Выбор заявок сброшен.');
  selectedAssemblies.clear();bulkSelectionStatus();
  if(adminData)renderAdmin();
}
el('admin-filter-status').onchange=updateAdminQueue;
el('admin-filter-employee').onchange=updateAdminQueue;
el('admin-filter-query').oninput=updateAdminQueue;
async function loadAdmin(){
  if(!adminView)return;
  const generation=++adminRequest;
  el('admin-editor').classList.add('hide');
  selectedAssemblies.clear();bulkSelectionStatus();el('admin-bulk').classList.add('hide');
  adminData=null;el('admin-assembly-list').replaceChildren();el('admin-attendance-list').replaceChildren();el('admin-checks').replaceChildren();
  el('admin-queue-summary').textContent='Загружаю очередь приёмки…';
  el('admin-queue-result').textContent='';
  adminStatus('Загружаю записи…');
  try{
    const week=adminNormalizeWeek();
    const data=await adminRequestData(week);
    if(generation!==adminRequest)return;
    adminData=data;
    renderAdmin();
    adminStatus('Обновлено: '+new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(new Date())+' МСК.');
  }catch(error){if(generation===adminRequest){adminStatus(error.message);adminData=null;
    el('admin-queue-summary').textContent='Очередь приёмки не загружена.';
    el('admin-assembly-list').replaceChildren();el('admin-attendance-list').replaceChildren();el('admin-checks').replaceChildren()}}
}
el('admin-refresh').onclick=loadAdmin;
el('admin-week').onchange=loadAdmin;
function adminCard(root,title,details,edit){
  const box=node('div',null,'admin-card');
  box.append(node('strong',title),node('small',details));
  const button=node('button','Исправить');
  button.type='button';button.onclick=edit;box.append(button);root.append(box);
  return box;
}
function addPhotoButton(box,r){
  if(!r.photo)return;
  const button=node('button','Показать фото');button.type='button';
  let errorNode=null;
  button.onclick=async()=>{
    button.disabled=true;button.textContent='Загружаю фото…';
    if(errorNode){errorNode.remove();errorNode=null}
    try{
      const photo=await adminRequestData('',{view:'photo',key:r.key});
      if(!box.isConnected)return;
      const img=document.createElement('img');img.className='order-photo';
      img.alt='Фото изделия · '+r.product+' · заказ № '+r.order;
      img.src=photo.src;button.replaceWith(img);
    }catch(error){
      if(!box.isConnected)return;
      button.disabled=false;button.textContent='Повторить загрузку фото';
      errorNode=node('p',error.message,'admin-warning');box.append(errorNode);
    }
  };
  box.append(button);
}
function acceptAssembly(r,status){
  const message=r.statusMismatch&&status===r.status?'Согласовать статус в двух журналах?':
    status==='Принято'?'Принять изделие и учесть его в зарплате?':
    status==='Своя переделка'?'Отправить изделие на переделку и исключить его из начисления?':
    'Вернуть изделие на приёмку и исключить его из начисления?';
  if(!window.confirm('Заявка '+r.key+' · заказ № '+r.order+'.\n'+message))return;
  send({version:1,type:'adminAcceptAssembly',row:r.row,key:r.key,
    link:r.link,rev:r.rev,status});
  adminStatus('Запрос отправлен боту. Дождитесь подтверждения в чате, затем обновите список.');
}
function acceptanceChoices(r){
  if(r.statusMismatch)return [['Синхронизировать',r.status]];
  if(r.status==='Ожидает приёмки')return [['Принять','Принято'],['На переделку','Своя переделка']];
  if(r.status==='Принято')return [['Вернуть на приёмку','Ожидает приёмки'],['На переделку','Своя переделка']];
  if(r.status==='Своя переделка')return [['Принять','Принято'],['Вернуть на приёмку','Ожидает приёмки']];
  return [];
}
function addAcceptanceButtons(actions,r){
  for(const [caption,status] of acceptanceChoices(r)){
    const button=node('button',caption);
    button.type='button';button.onclick=()=>acceptAssembly(r,status);
    actions.append(button);
  }
}
function deleteAssembly(r){
  if(!adminView)return;
  const summary='Заявка '+r.key+' · '+r.name+' · '+r.product+' × '+r.qty+
    ' · заказ № '+r.order+' · '+r.date+'.';
  const warning='Удалить запись из сборки и начисления? Действие запишется в историю удалений. '+
    'Фото из карточки исчезнет, но сообщение с фото в группе останется. '+
    'Если неделя закрыта или есть выплата, удаление будет запрещено.';
  if(!window.confirm(summary+'\n\n'+warning))return;
  const confirmId=window.prompt('Для подтверждения введите ID заявки целиком:\n'+r.key);
  if(confirmId===null)return;
  if(confirmId.trim()!==r.key){adminStatus('ID заявки не совпал. Запись сохранена.');return}
  send({version:1,type:'adminDeleteAssembly',row:r.row,key:r.key,
    link:r.link,rev:r.rev,name:r.name,order:String(r.order),
    photo:Boolean(r.photo),confirmId:confirmId.trim()});
  adminStatus('Запрос на удаление передан боту. Дождитесь подтверждения в чате и обновите список.');
}
function addDeleteButton(actions,r){
  if(r.canDelete!==true)return;
  const button=node('button','Удалить запись','admin-delete');
  button.type='button';button.onclick=()=>deleteAssembly(r);actions.append(button);
}
let orderRequest=0,orderData=null;
let globalRequest=0;
el('global-search').onsubmit=e=>{e.preventDefault();loadGlobalSearch()};
async function loadGlobalSearch(){
  if(!adminView)return;
  const generation=++globalRequest,query=el('global-query').value.trim();
  el('global-results').replaceChildren();
  if(query.length<2||query.length>80){el('global-status').textContent='Укажите не меньше двух символов.';return}
  el('global-status').textContent='Ищу во всей истории сборки…';
  try{
    const data=await adminRequestData('',{view:'search',query});
    if(generation!==globalRequest)return;
    renderGlobalSearch(data);
  }catch(error){if(generation===globalRequest)el('global-status').textContent=error.message}
}
function renderGlobalSearch(data){
  const root=el('global-results');root.replaceChildren();
  const entries=data.entries||[];
  el('global-status').textContent='Найдено: '+data.total+' операций'+
    (data.total>entries.length?' · показаны первые '+entries.length:'');
  if(!entries.length)return;
  for(const r of entries){
    const box=adminCard(root,r.product+' × '+r.qty,
      r.date+' · '+r.name+' · заказ № '+r.order+' · '+r.status+' · строка '+r.row,
      ()=>editAssembly(r));
    if(r.product==='Стол')box.insertBefore(node('p',parts.map((p,i)=>
      r.parts[i]>0?p+' × '+r.parts[i]:'').filter(Boolean).join(', ')),box.lastChild);
    if(r.note)box.insertBefore(node('p',r.note,'order-note'),box.lastChild);
    addAccountingStatus(box,r);
    addPhotoButton(box,r);
    if(r.statusMismatch)box.append(node('p','Статусы журналов расходятся; действует решение основной таблицы.','admin-warning'));
    const actions=node('div',null,'admin-accept-actions');
    const order=node('button','Карточка заказа');order.type='button';
    order.onclick=()=>{el('order-number').value=String(r.order).split(/[,;\n]/)[0].trim();
      loadOrder();el('order-search').scrollIntoView({behavior:'smooth',block:'start'})};
    actions.append(order);
    addAcceptanceButtons(actions,r);
    addDeleteButton(actions,r);
    box.append(actions);
  }
}
el('order-search').onsubmit=e=>{e.preventDefault();loadOrder()};
async function loadOrder(){
  if(!adminView)return;
  const generation=++orderRequest;
  const order=el('order-number').value.trim();
  orderData=null;el('order-card').replaceChildren();
  if(!order||order.length>80||order.split(/[,;\n]/).length!==1){
    el('order-status').textContent='Укажите один номер заказа.';return;
  }
  el('order-status').textContent='Ищу изделия и фото по заказу…';
  try{
    const data=await adminRequestData('',{view:'order',order});
    if(generation!==orderRequest)return;
    orderData=data;renderOrder(data);
  }catch(error){if(generation===orderRequest)el('order-status').textContent=error.message}
}
function renderOrder(data){
  const root=el('order-card');root.replaceChildren();
  const entries=data.entries||[];
  if(!entries.length){el('order-status').textContent='Заказ № '+data.order+': изделий не найдено.';return}
  el('order-status').textContent='Заказ № '+data.order+' · '+entries.length+' операций';
  const counts=new Map();
  for(const r of entries)counts.set(r.product,(counts.get(r.product)||0)+Number(r.qty||0));
  const states=['Принято','Ожидает приёмки','Своя переделка'];
  const summary=node('div',null,'order-summary');
  summary.append(node('strong','Изделия: '+[...counts].map(([name,qty])=>name+' — '+qty+' шт.').join('; ')));
  summary.append(node('div',states.map(s=>s+': '+entries.filter(r=>r.status===s)
    .reduce((n,r)=>n+Number(r.qty||0),0)+' шт.').join(' · ')));
  root.append(summary);
  for(const r of entries){
    const box=node('div',null,'admin-card');
    box.append(node('strong',r.product+' × '+r.qty),
      node('small',r.date+' · '+r.name+' · '+r.status));
    if(r.product==='Стол')box.append(node('p','Состав стола: '+parts.map((name,i)=>
      Number(r.parts[i])>0?name+' × '+r.parts[i]:'').filter(Boolean).join(', ')));
    if(r.note)box.append(node('p','Комментарий сборщика: '+r.note,'order-note'));
    addAccountingStatus(box,r);
    if(r.statusMismatch)box.append(node('p','Статусы журналов расходятся; показано решение основной таблицы.','admin-warning'));
    if(r.photo){
      addPhotoButton(box,r);
      if(r.photoOrder&&r.photoOrder!==r.order)box.append(node('small','При отправке фото был указан заказ № '+r.photoOrder));
    }else box.append(node('small','Фото к этой заявке не привязано.'));
    const actions=node('div',null,'admin-accept-actions');
    const change=node('button','Исправить запись');change.type='button';change.onclick=()=>editAssembly(r);
    actions.append(change);
    addAcceptanceButtons(actions,r);
    addDeleteButton(actions,r);
    box.append(actions);root.append(box);
  }
  root.append(node('p','После решения по приёмке дождитесь ответа бота и повторно найдите заказ: карточка показывает данные на момент последней загрузки.','admin-warning'));
}
function renderAdmin(){
  const a=el('admin-assembly-list'),t=el('admin-attendance-list');
  const alerts=el('admin-checks');a.replaceChildren();t.replaceChildren();alerts.replaceChildren();
  const allAssembly=adminData?.assembly||[];
  const assembly=filterAssemblyRows(allAssembly,queueFilters());
  const attendance=adminData?.attendance||[];
  el('admin-bulk').classList.toggle('hide',adminData?.bulkAccept!==true);
  bulkSelectionStatus();
  const pending=allAssembly.filter(r=>r.status==='Ожидает приёмки').length;
  const rework=allAssembly.filter(r=>r.status==='Своя переделка').length;
  const mismatches=allAssembly.filter(r=>r.statusMismatch).length;
  const accountingProblems=allAssembly.filter(accountingIssue).length;
  el('admin-queue-summary').textContent='Ожидают приёмки: '+pending+' · На переделке: '+rework+
    ' · Расхождения: '+mismatches+' · Ошибки расчёта: '+accountingProblems;
  el('admin-queue-result').textContent='Показано '+assembly.length+' из '+allAssembly.length+' заявок за неделю';
  if(!assembly.length)a.append(node('p',allAssembly.length?'По выбранным фильтрам заявок нет.':'За выбранную неделю сборки не найдены.'));
  if(!attendance.length)t.append(node('p','За выбранную неделю отметок нет.'));
  const checks=(adminData?.checks||[]).filter(message=>!message.startsWith('Проверьте возможный повтор изделия:'));
  alerts.append(node('strong',checks.length?'Проверьте записи: '+checks.length:'Расхождений и незакрытых прошлых смен за неделю не найдено.'));
  checks.forEach(message=>alerts.append(node('p',message,'admin-warning')));
  assembly.forEach(r=>{
    const box=adminCard(a,r.name+' · '+r.product+' × '+r.qty,
      r.date+' · заказ № '+r.order+' · '+r.status+' · строка '+r.row,()=>editAssembly(r));
    if(adminData?.bulkAccept===true&&!r.statusMismatch&&
        (r.status==='Ожидает приёмки'||r.status==='Своя переделка')){
      const choice=node('label',null,'admin-select');
      const checkbox=document.createElement('input');checkbox.type='checkbox';
      choice.append(checkbox,node('span','Выбрать для приёмки'));
      checkbox.onchange=()=>{
        if(checkbox.checked){
          if(selectedAssemblies.size>=8){checkbox.checked=false;
            adminStatus('За один раз можно принять не больше восьми заявок.');return}
          selectedAssemblies.set(r.key,r);
        }else selectedAssemblies.delete(r.key);
        bulkSelectionStatus();
      };
      box.insertBefore(choice,box.firstChild);
    }
    if(r.product==='Стол')box.insertBefore(node('p',parts.map((p,i)=>r.parts[i]>0?p+' × '+r.parts[i]:'').filter(Boolean).join(', ')),box.lastChild);
    if(r.note)box.insertBefore(node('p',r.note.length>220?r.note.slice(0,220)+'…':r.note),box.lastChild);
    if(r.statusMismatch)box.insertBefore(node('p','Статусы двух таблиц различаются. Решение в закрытой таблице имеет приоритет.','admin-warning'),box.lastChild);
    addAccountingStatus(box,r);
    addPhotoButton(box,r);
    const openOrder=node('button','Карточка заказа');openOrder.type='button';
    openOrder.onclick=()=>{el('order-number').value=String(r.order).split(/[,;\n]/)[0].trim();
      loadOrder();el('order-search').scrollIntoView({behavior:'smooth',block:'start'})};
    box.append(openOrder);
    const actions=node('div',null,'admin-accept-actions');
    addAcceptanceButtons(actions,r);
    addDeleteButton(actions,r);
    box.append(actions);
  });
  attendance.forEach(r=>adminCard(t,r.name+' · '+r.date,
    'Пришёл '+(r.arrival?.slice(11,16)||'—')+' · ушёл '+(r.leave?.slice(11,16)||'—')+
    ' · переработка '+(r.overtime||0)+' ч · '+r.status+' · строка '+r.row,()=>editAttendance(r)));
}
function editAssembly(r){
  const box=el('admin-editor');box.replaceChildren();
  box.append(node('h3','Исправить сборку · строка '+r.row));
  const form=document.createElement('form');box.append(form);
  const date=field(form,'Дата сборки','date',r.date);
  date.min='2026-09-14';date.max=today;
  const name=field(form,'Сотрудник','select',r.name,staff);
  const product=field(form,'Изделие','select',r.product,products);
  const qty=field(form,'Количество изделий','number',r.qty);qty.min='1';qty.max='100000';qty.step='1';
  const table=node('div',null,'admin-fields');form.append(table);
  const partInputs=parts.map((p,i)=>{
    const input=field(table,p+', шт.','number',r.parts[i]||0);
    input.min='0';input.max='1000';input.step='1';return input;
  });
  const toggle=()=>{const isTable=product.value==='Стол';table.classList.toggle('hide',!isTable);qty.disabled=isTable};
  product.onchange=toggle;toggle();
  const period=field(form,'Период работы','select',r.period,periods);
  box.append(node('p','Статус приёмки меняется отдельными кнопками в карточке изделия.','admin-warning'));
  const order=field(form,'№ заказа','text',r.order);order.maxLength=80;order.required=true;
  const note=field(form,'Комментарий, проблемы и просьба о надбавке','textarea',r.note);note.maxLength=1000;
  const save=node('button','Сохранить исправление','submit');save.type='submit';form.append(save);
  form.onsubmit=e=>{
    e.preventDefault();const isTable=product.value==='Стол';
    const values=partInputs.map(x=>Number(x.value));
    if(isTable&&(!values.some(n=>n>0)||values.some(n=>!Number.isInteger(n)||n<0||n>1000))){
      adminStatus('Проверьте количество элементов стола.');return;
    }
    const count=isTable?1:Number(qty.value);
    if(!isTable&&(!Number.isInteger(count)||count<1||count>100000)){
      adminStatus('Проверьте количество изделий.');return;
    }
    send({version:1,type:'adminEditAssembly',row:r.row,key:r.key,rev:r.rev,date:date.value,
      name:name.value,product:product.value,qty:count,parts:isTable?values:[],
      period:period.value,status:r.status,order:order.value.trim(),note:note.value.trim()});
  };
  box.classList.remove('hide');box.scrollIntoView({behavior:'smooth',block:'start'});
}
function editAttendance(r){
  const box=el('admin-editor');box.replaceChildren();
  box.append(node('h3','Исправить смену · '+r.name+' · '+r.date));
  box.append(node('p','Исправление времени изменит автоматическую переработку. Если часы за день внесены вручную, бот попросит сверить их в таблице.','admin-warning'));
  const form=document.createElement('form');box.append(form);
  const arrival=field(form,'Пришёл (МСК)','datetime-local',r.arrival?.slice(0,16));
  arrival.required=true;
  const leave=field(form,'Ушёл (МСК, если смена закрыта)','datetime-local',r.leave?.slice(0,16));
  const save=node('button','Сохранить время','submit');save.type='submit';form.append(save);
  form.onsubmit=e=>{e.preventDefault();
    send({version:1,type:'adminEditAttendance',row:r.row,key:r.key,rev:r.rev,
      arrival:arrival.value,leave:leave.value});
  };
  box.classList.remove('hide');box.scrollIntoView({behavior:'smooth',block:'start'});
}
})();
