(()=>{'use strict';
const products=['Сборка мангала','Сборка печки','Коптильня','Центральная секция до 2000 мм','Центральная секция 2120 мм','Центральная секция 2350 мм','Решётка для мангала','Дровник','Ручка для мангала','Подарочная доска','Выдвижной ящик','Стеллаж навесной','Шкафчик навесной','Стол','Столешница','Фартук','Фартук большой','Бутылочница','Цоколь HPL','Стул с покраской в 1 слой','Стул с покраской в 2 слоя','Скручивание столов'];
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
const workerView=staff.includes(employee);
const workerReadToken=new URLSearchParams((location.hash||'').replace(/^#/, '')).get('workerRead')||'';
const telegramFirstName=String(tg?.initDataUnsafe?.user?.first_name||'').trim();
const visibleName=employee||(telegramFirstName?telegramFirstName:'Откройте через бота');
el('employee-name').textContent=visibleName;
el('employee-avatar').textContent=visibleName==='Откройте через бота'?'·':Array.from(visibleName)[0].toLocaleUpperCase('ru');
if(!employee)document.querySelector('.profile__caption').textContent=telegramFirstName?'ПРОФИЛЬ TELEGRAM':'СОТРУДНИК';
if(adminView){el('admin-picker').classList.remove('hide');el('tab-admin').classList.remove('hide');document.querySelector('.tabs').classList.add('admin-tabs');el('hero-label').textContent='Кабинет руководителя';document.querySelector('.profile__caption').textContent='РУКОВОДИТЕЛЬ';staff.forEach(n=>{option(el('admin-employee'),n);option(el('admin-filter-employee'),n)})}
if(workerView){el('tab-history').classList.remove('hide');el('tab-earnings').classList.remove('hide');el('worker-day').classList.remove('hide');el('tab-shift').textContent='◷  Мой день';el('shift-title').textContent='Мой день'}
const day=()=>{const x=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(y=>[y.type,y.value]));return `${x.year}-${x.month}-${x.day}`};
const today=day();
if(adminView){el('tab-finance').classList.remove('hide');staff.forEach(n=>option(el('finance-employee'),n))}
el('date').value=today;el('date').max=today;
el('today-label').textContent=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',weekday:'long'}).format(new Date());
function section(name){for(const n of ['shift','assembly','history','earnings','admin','finance']){el(n).classList.toggle('hide',n!==name);el('tab-'+n).classList.toggle('active',n===name);el('tab-'+n).setAttribute('aria-selected',String(n===name))}el('message').classList.add('hide')}
el('tab-shift').onclick=()=>{section('shift');if(workerView)loadWorker()};el('tab-assembly').onclick=()=>section('assembly');
el('tab-history').onclick=()=>{if(!workerView)return;section('history');loadWorker()};
el('tab-earnings').onclick=()=>{if(!workerView)return;section('earnings');loadWorker()};
el('tab-admin').onclick=()=>{if(!adminView)return;section('admin');loadAdmin()};
el('tab-finance').onclick=()=>{if(!adminView)return;section('finance');loadFinance()};
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
let mutationPending=false,repeatSource=null;
function loadingForm(){
  const loading=el('work-kind').value==='Загрузка машины',table=!loading&&el('product').value==='Стол';
  for(const id of ['product','qty','period']){el(id).disabled=loading;el(id).classList.toggle('hide',loading)}
  for(const id of ['product','period'])document.querySelector('label[for="'+id+'"]').classList.toggle('hide',loading);
  el('ordinary').classList.toggle('hide',loading||table);el('table-parts').classList.toggle('hide',!table);
  el('product').required=!loading;el('qty').required=!loading&&!table;
  el('order').required=!loading;el('loading-hint').classList.toggle('hide',!loading);
  document.querySelector('label[for="order"]').textContent=loading?'№ заказа (необязательно)':'№ заказа';
  el('assembly-photo-hint').textContent=loading?'700 ₽ каждому участнику после приёмки. Фото необязательно.':'Надбавку утверждает руководитель. После подтверждения заявки ботом отправьте фото изделия в этот чат.';
}
el('work-kind').onchange=loadingForm;el('product').onchange=loadingForm;
function send(payload){
  if(mutationPending){notice('Запрос уже передан боту. Дождитесь подтверждения в чате.');return}
  if(!tg||typeof tg.sendData!=='function'){notice('Не загрузилось соединение с Telegram. Откройте кабинет заново кнопкой бота.');return}
  if(tg.platform==='unknown'){notice('Откройте приложение через кнопку «Личный кабинет» в чате с ботом.');return}
  if(adminView&&['adminEditAssembly','adminEditAttendance','adminAcceptAssembly','adminAcceptAssemblies','adminDeleteAssembly'].includes(payload.type)&&!adminDataFresh){adminStatus('Данные устарели. Дождитесь успешного обновления, прежде чем менять записи.');return}
  if(payload.type==='adminBonusDecision'&&!bonusDataFresh){el('bonus-status').textContent='Список надбавок устарел. Сначала обновите его.';return}
  if(adminView&&!['photoHelp','adminAccounting','adminBonusDecision','adminEditAssembly','adminEditAttendance','adminAcceptAssembly','adminAcceptAssemblies','adminDeleteAssembly'].includes(payload.type)){
    const target=el('admin-employee').value;
    if(!staff.includes(target)){notice('Сначала выберите сотрудника.');el('admin-employee').focus();return}
    payload.employee=target;
  }
  const raw=JSON.stringify(payload);
  if(new TextEncoder().encode(raw).length>4096){notice('Комментарий слишком длинный для отправки.');return}
  mutationPending=true;
  try{tg.sendData(raw)}catch(_){mutationPending=false;notice('Не удалось отправить запрос. Данные формы сохранены — попробуйте снова.');return}
  notice('Запрос передан боту. Запись считается сохранённой только после подтверждения в чате.');
}
el('arrive').onclick=()=>send({version:1,type:'arrive'});
el('leave').onclick=()=>send({version:1,type:'leave'});
el('assembly-form').onsubmit=e=>{
  e.preventDefault();if(mutationPending)return;
  if(!e.currentTarget.reportValidity())return;
  const loading=el('work-kind').value==='Загрузка машины';
  const product=loading?'Загрузка машины':el('product').value,table=product==='Стол';
  const qty=Number(el('qty').value),tableParts=parts.map((_,i)=>Number(el('part-'+i).value));
  if(table&&(!tableParts.some(x=>x>0)||tableParts.some(x=>!Number.isInteger(x)||x<0||x>1000))){notice('Укажите хотя бы один элемент стола и проверьте количество.');return}
  if(!loading&&!table&&(!Number.isInteger(qty)||qty<1||qty>100000)){notice('Количество изделий должно быть от 1 до 100000.');return}
  const note=assemblyNote();if(note===null)return;
  const payload={version:1,type:'assembly',date:el('date').value,kind:el('work-kind').value,product,qty:loading||table?1:qty,parts:table?tableParts:[],period:loading?periods[0]:el('period').value,order:el('order').value.trim(),note};
  if(repeatSource){
    const composition=table?'\nСостав: '+parts.map((name,i)=>tableParts[i]>0?name+' × '+tableParts[i]:'').filter(Boolean).join(', '):'';
    if(!window.confirm('Создать НОВУЮ заявку по образцу '+repeatSource+'?\n'+payload.kind+' · '+product+' × '+payload.qty+'\nЗаказ № '+payload.order+' · '+payload.date+'\n'+payload.period+composition+'\n\nЭто не исправление старой заявки. Убедитесь, что это новая выполненная работа.'))return;
  }
  send(payload);
};

// Read only, signed Telegram data. The endpoint URL is supplied by the bot to
// the owner's keyboard button. Mutations always use Telegram sendData above.
// Pin the read endpoint so an older keyboard URL cannot send a valid session
// back to the superseded Google-login deployment.
const adminEndpoint=
  'https://script.google.com/macros/s/AKfycbz2ZOC_Pibu90pl6edNIMf0krFJKy_3HPj7MreiDk39psF5gsUtQoW4FCSWEUa3VSBz/exec';
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
let adminData=null,adminRequest=0,adminLoadedWeek='',adminDataFresh=false;
function transientAdminError(message){const error=new Error(message);error.retryable=true;return error}
function adminRequestOnce(week,extra,authKey,authToken){
  return new Promise((resolve,reject)=>{
    const callback='__tgAdm_'+Math.random().toString(36).slice(2,14);
    const url=new URL(adminEndpoint);
    url.searchParams.set('callback',callback);
    url.searchParams.set(authKey,authToken);
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
    script.onerror=()=>finish(transientAdminError('Ответ не дошёл до приложения. Проверьте соединение и повторите обновление.'));
    script.onload=()=>{if(!done)finish(transientAdminError('Приложение не получило ответ. Повторите обновление.'))};
    timeout=setTimeout(()=>finish(transientAdminError('Ответ не получен вовремя. Проверьте соединение и повторите обновление.')),25000);
    script.src=url.toString();document.head.append(script);
  });
}
async function adminRequestData(week,extra={},onRetry,worker=false){
  if(worker&&!workerReadToken)
    throw new Error('Нет личного ключа. Отправьте боту /menu и откройте новый «Личный кабинет».');
  if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(adminEndpoint))
    throw new Error('Обновите веб-приложение Apps Script и снова откройте кабинет кнопкой бота.');
  if(!worker&&!adminReadToken&&!tg?.initData)
    throw new Error('Обновите кнопку: отправьте боту /menu и откройте новый «Личный кабинет».');
  const authKey=worker?'workerRead':adminReadToken?'readToken':'initData';
  const authToken=worker?workerReadToken:adminReadToken||tg.initData;
  for(let attempt=0;attempt<2;attempt++){
    try{return await adminRequestOnce(week,extra,authKey,authToken)}
    catch(error){if(!error.retryable||attempt===1)throw error;onRetry?.()}
  }
}
let workerData=null,workerLoading=false,workerFetchedAt=0,workerDataFresh=false;
const rubles=value=>new Intl.NumberFormat('ru-RU',{
  style:'currency',currency:'RUB',maximumFractionDigits:2}).format(value);
const shortDate=value=>String(value||'').split('-').reverse().join('.');
const workTitle=r=>r.kind==='Загрузка машины'?'Загрузка машины · 700 ₽':(r.kind==='Переделка'?'Переделка · ':'')+r.product+' × '+r.qty;
function renderWorker(){
  if(!workerData)return;
  const data=workerData;
  el('employee-name').textContent=data.name;
  el('employee-avatar').textContent=Array.from(data.name)[0].toLocaleUpperCase('ru');
  const entries=data.entries||[];
  const updated=data.updated?data.updated.slice(11,16)+' МСК':'только что';
  el('history-status').textContent='Всего заявок: '+data.total+
    (data.total>entries.length?' · показаны последние '+entries.length:'')+
    ' · обновлено '+updated+'.';
  const list=el('history-list');list.replaceChildren();
  if(!entries.length)list.append(node('p','Пока нет отправленных заявок.','worker-empty'));
  for(const r of entries){
    const card=node('article',null,'worker-card');
    card.append(node('strong',workTitle(r)),
      node('small',shortDate(r.date)+' · заказ № '+r.order+' · '+r.key),
      node('span',r.status,'worker-badge'));
    if(r.needsReview)card.append(node('p','Статусы журналов расходятся — уточните у руководителя.','admin-warning'));
    if(r.photo)addPhotoButton(card,r,true);
    addRepeatButton(card,r);
    list.append(card);
  }
  el('earnings-week').textContent='Неделя '+shortDate(data.week)+' — '+shortDate(data.weekEnd);
  const pay=data.payroll||{};
  el('earnings-earned').textContent=pay.ready?rubles(pay.earned):'—';
  el('earnings-balance').textContent=pay.ready?rubles(pay.balance):'—';
  el('earnings-detail').textContent=pay.ready?
    'На начало недели: '+rubles(pay.opening)+' · выплачено: '+rubles(pay.paid)+
    '. Остаток = на начало + начислено − выплачено.':
    (pay.message||'Расчёт пока недоступен.');
  el('earnings-status').textContent='Обновлено '+updated+'.'+
    (pay.ready?' Суммы могут измениться до закрытия недели.':' Расчёт не подтверждён.');
  renderWorkerDay(data,updated);
  renderPayBreakdown(pay);
  renderWorkerMonths();
}
function renderWorkerDay(data,updated){
  const d=data.day||{},state=d.state;
  const labels={none:'Смена ещё не начата',open:'Вы на работе',closed:'Смена завершена',review:'Нужна проверка отметок',unavailable:'Отметки не загружены'};
  el('day-shift-label').textContent=labels[state]||'Обновление сводки ещё не подключено';
  const time=value=>value?shortDate(value.slice(0,10))+' '+value.slice(11,16)+' МСК':'';
  const details=[];
  if(d.arrival)details.push('Приход: '+time(d.arrival));
  if(d.leave)details.push('Уход: '+time(d.leave));
  if(d.hours!=null)details.push('На работе: '+Number(d.hours).toFixed(2)+' ч');
  if(d.message)details.push(d.message);
  el('day-shift-detail').textContent=details.join(' · ')||'Нажмите «Обновить мой день». Отметки всегда подтверждает бот.';
  el('day-status').textContent='Обновлено '+updated+'.'+(d.date&&d.date!==day()?' Сводка за '+shortDate(d.date)+', обновите её.':'');
  el('day-total').textContent=d.todayCount??'—';
  el('day-pending').textContent=d.pending??'—';el('day-rework').textContent=d.rework??'—';
  el('day-earned').textContent=data.payroll?.ready?rubles(data.payroll.earned):'—';
  const known=workerDataFresh&&d.date===day();
  el('arrive').disabled=known&&['open','closed','review'].includes(state);
  el('leave').disabled=known&&['none','closed','review'].includes(state);
  const list=el('day-list');list.replaceChildren();
  for(const r of d.entries||[]){
    const card=node('article',null,'worker-card');
    card.append(node('strong',workTitle(r)),node('small','Заказ № '+r.order),node('span',r.status,'worker-badge'));
    addRepeatButton(card,r);list.append(card);
  }
  if(!d.entries?.length)list.append(node('p',data.day?'За сегодня заявок пока нет.':'Сводка появится после обновления сервера.','worker-empty'));
}
function renderPayBreakdown(pay){
  const root=el('earnings-breakdown');root.replaceChildren();
  const detail=pay.breakdown;
  if(!pay.ready||!detail?.ready){el('earnings-breakdown-note').textContent=detail?.message||pay.message||'Подробный расчёт появится после обновления сервера.';return}
  const row=(label,amount,total=false)=>{
    const item=node('div',null,'pay-breakdown-row'+(total?' pay-breakdown-row--total':''));
    item.append(node('span',label),node('strong',rubles(amount)));root.append(item);
  };
  for(const component of detail.components||[])row(component.label,component.amount);
  row('Начислено за неделю',pay.earned,true);
  row('Остаток на начало недели',pay.opening);row('Выплачено',pay.paid);
  row('Текущий остаток',pay.balance,true);
  el('earnings-breakdown-note').textContent=[detail.days!=null?'Засчитано дней: '+detail.days+'.':'',
    detail.overtimeHours!=null?'Переработка: '+Number(detail.overtimeHours).toFixed(2)+' ч.':'',
    detail.message||'', 'Сборка учитывается после приёмки. Остаток = на начало + начислено − выплачено.'].filter(Boolean).join(' ');
}
const monthLabel=value=>new Intl.DateTimeFormat('ru-RU',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(value+'-01T12:00:00Z'));
function monthOptions(select,months){
  const previous=select.value;select.replaceChildren();
  for(const month of months){const item=node('option',monthLabel(month));item.value=month;select.append(item)}
  select.value=months.includes(previous)?previous:(months.includes(day().slice(0,7))?day().slice(0,7):months[0]||'');
}
function financialRow(root,label,amount){const row=node('div',null,'pay-breakdown-row');row.append(node('span',label),node('strong',Number.isFinite(amount)?rubles(amount):'—'));root.append(row)}
function weeklyFinancialCard(r){
  const card=node('article',null,'worker-card');card.append(node('strong',shortDate(r.week)+' — '+shortDate(r.weekEnd)));
  if(!r.ready){card.append(node('p',r.message||'Расчёт требует проверки.','admin-warning'));return card}
  for(const [key,label] of [['opening','На начало недели'],['earned','Начислено'],['paid','Выплачено за неделю'],['balance','Остаток на конец недели']])financialRow(card,label,r[key]);
  return card;
}
function renderWorkerMonths(){
  const f=workerData?.finances;
  const current=f?.months?.find(m=>m.month===day().slice(0,7));
  el('earnings-month-earned').textContent=current?.ready?rubles(current.earned):'—';
  el('earnings-current-month-note').textContent=current?.message||'';
  const summary=el('earnings-month-summary'),list=el('earnings-weeks');summary.replaceChildren();list.replaceChildren();
  if(!f||f.name!==employee||!Array.isArray(f.months)||!Array.isArray(f.weeks)){summary.append(node('p','Месячная история появится после обновления сервера.'));return}
  monthOptions(el('earnings-month'),f.months.map(m=>m.month));
  const selected=f.months.find(m=>m.month===el('earnings-month').value);
  financialRow(summary,'Начислено за выбранный месяц',selected?.ready?selected.earned:null);
  financialRow(summary,'Выплачено по неделям месяца',selected?.ready?selected.paid:null);
  if(selected?.message)summary.append(node('p',selected.message,'worker-pay-detail'));
  for(const r of f.weeks.filter(r=>r.month===selected?.month))list.append(weeklyFinancialCard(r));
}
el('earnings-month').onchange=renderWorkerMonths;
let financeData=null,financeLoading=false,financeFetchedAt=0;
function renderFinance(){
  const employees=financeData?.employees||[];
  monthOptions(el('finance-month'),Array.from(new Set(employees.flatMap(e=>e.months.map(m=>m.month)))).sort().reverse());
  const selected=el('finance-month').value,name=el('finance-employee').value;
  const visible=employees.filter(e=>!name||e.name===name),summary=el('finance-summary'),list=el('finance-list');summary.replaceChildren();list.replaceChildren();
  const monthly=visible.map(e=>e.months.find(m=>m.month===selected));
  const ready=monthly.length>0&&monthly.every(m=>m?.ready);
  financialRow(summary,'Начислено за месяц',ready?monthly.reduce((s,m)=>s+m.earned,0):null);
  financialRow(summary,'Выплачено по неделям месяца',ready?monthly.reduce((s,m)=>s+m.paid,0):null);
  if(!ready)summary.append(node('p','Нет расчётов за этот месяц либо есть неподтверждённые недели.','worker-pay-detail'));
  for(const e of visible){
    const card=node('article',null,'worker-pay-card');card.append(node('h3',e.name));
    const latest=e.weeks[0];financialRow(card,'Остаток на конец последней недели',latest?.ready?latest.balance:null);
    if(latest)card.append(node('small','Неделя с '+shortDate(latest.week)));
    const weeks=e.weeks.filter(r=>r.month===selected);
    for(const r of weeks)card.append(weeklyFinancialCard(r));
    if(!weeks.length)card.append(node('p','Нет недельных расчётов за выбранный месяц.'));
    list.append(card);
  }
}
async function loadFinance(force=false){
  if(!adminView||financeLoading||(!force&&financeData&&Date.now()-financeFetchedAt<120000))return;
  financeLoading=true;el('finance-status').textContent='Загружаю начисления и выплаты…';
  try{
    const data=await adminRequestData('',{view:'finance'});
    if(data?.apiVersion<24||!Array.isArray(data?.employees)||data.employees.length!==staff.length||
      new Set(data.employees.map(e=>e.name)).size!==staff.length||data.employees.some(e=>!staff.includes(e.name)||!Array.isArray(e.weeks)||!Array.isArray(e.months)))throw new Error('Ответ финансового раздела неполный.');
    financeData=data;financeFetchedAt=Date.now();renderFinance();el('finance-status').textContent='Обновлено '+data.updated.slice(11,16)+' МСК. Только просмотр.';
  }catch(error){financeFetchedAt=0;el('finance-status').textContent=error.message+(financeData?' Показаны предыдущие данные.':'')}
  finally{financeLoading=false}
}
el('finance-refresh').onclick=()=>loadFinance(true);el('finance-month').onchange=renderFinance;el('finance-employee').onchange=renderFinance;
function canRepeatRecord(r){
  if(workerView&&r.canRepeat===true&&!r.needsReview&&r.kind==='Загрузка машины')
    return r.product==='Загрузка машины'&&r.qty===1&&r.period===periods[0]&&typeof r.order==='string'&&r.order.length<=80;
  return workerView&&r.canRepeat===true&&!r.needsReview&&products.includes(r.product)&&
    ['Сборка','Переделка'].includes(r.kind)&&periods.includes(r.period)&&
    typeof r.order==='string'&&r.order.trim().length>0&&r.order.length<=80&&
    (r.product==='Стол'?r.qty===1&&Array.isArray(r.parts)&&r.parts.length===parts.length&&
      r.parts.every(v=>Number.isInteger(v)&&v>=0&&v<=1000)&&r.parts.some(v=>v>0):
      Number.isInteger(r.qty)&&r.qty>0&&r.qty<=100000);
}
function addRepeatButton(card,r){
  if(!canRepeatRecord(r))return;
  const button=node('button','Повторить','repeat-button');button.type='button';
  button.disabled=!workerDataFresh;button.onclick=()=>repeatAssembly(r);card.append(button);
}
function repeatAssembly(r){
  if(!workerDataFresh||!canRepeatRecord(r)){notice('Сначала обновите ваши заявки.');return}
  const dirty=repeatSource||el('order').value.trim()||['note','problem','responsible'].some(id=>el(id).value.trim())||
    el('date').value!==day()||
    Boolean(el('product').value)||Number(el('qty').value)!==1||
    el('work-kind').value!=='Сборка'||el('period').value!==periods[0]||
    parts.some((_,i)=>Number(el('part-'+i).value)>0);
  if(dirty&&!window.confirm('Заменить введённые данные формы новой заявкой по этому образцу?'))return;
  repeatSource=r.key;
  el('date').value=day();el('date').max=day();
  el('product').value=r.product;el('qty').value=String(r.qty);
  el('work-kind').value=r.kind;el('period').value=r.period;el('order').value=r.order;
  parts.forEach((_,i)=>{el('part-'+i).value=String(r.product==='Стол'?r.parts[i]:0)});
  for(const id of ['note','problem','responsible'])el(id).value='';
  el('product').onchange();section('assembly');
  el('repeat-context').textContent='Новая заявка по образцу '+r.key+'. Проверьте дату, количество и номер заказа. Старые фото и надбавки не перенесены.';
  el('repeat-context').classList.remove('hide');
  el('assembly-form').scrollIntoView({behavior:'smooth',block:'start'});
}
async function loadWorker(force=false){
  if(!workerView||workerLoading||(!force&&workerData&&Date.now()-workerFetchedAt<120000))return;
  workerLoading=true;
  workerDataFresh=false;
  if(workerData)renderWorker();
  el('day-status').textContent='Загружаю ваш день…';
  el('history-status').textContent='Загружаю ваши заявки…';
  el('earnings-status').textContent='Загружаю ваш расчёт…';
  try{
    const data=await adminRequestData('',{view:'mine'},()=>{
      el('history-status').textContent='Ответ не пришёл. Повторяю загрузку…';
      el('earnings-status').textContent='Ответ не пришёл. Повторяю загрузку…';
      el('day-status').textContent='Ответ не пришёл. Повторяю загрузку…';
    },true);
    if(data?.name!==employee||!staff.includes(data?.name)||!Array.isArray(data?.entries))throw new Error('Ответ сервера неполный. Повторите загрузку.');
    workerData=data;workerDataFresh=true;workerFetchedAt=Date.now();renderWorker();
  }catch(error){
    workerFetchedAt=0;
    if(!workerData){
      el('history-list').replaceChildren();el('day-list').replaceChildren();
      el('earnings-earned').textContent='—';el('earnings-balance').textContent='—';
      el('earnings-detail').textContent='Данные не загружены.';
    }
    const message=error.message+(workerData?' Показаны предыдущие данные; повторение заявок отключено до обновления.':'');
    el('history-status').textContent=message;el('earnings-status').textContent=message;el('day-status').textContent=message;
  }finally{workerLoading=false}
}
el('history-refresh').onclick=()=>loadWorker(true);
el('earnings-refresh').onclick=()=>loadWorker(true);
el('day-refresh').onclick=()=>loadWorker(true);
el('day-all-history').onclick=()=>{section('history');loadWorker()};
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
  let requestedWeek='';
  el('admin-editor').classList.add('hide');
  selectedAssemblies.clear();bulkSelectionStatus();el('admin-bulk').classList.add('hide');
  adminDataFresh=false;
  try{
    const week=adminNormalizeWeek();requestedWeek=week;
    const keepSnapshot=adminData!==null&&week===adminLoadedWeek;
    if(!keepSnapshot){adminData=null;el('admin-assembly-list').replaceChildren();el('admin-attendance-list').replaceChildren();el('admin-checks').replaceChildren();
      el('admin-queue-summary').textContent='Загружаю очередь приёмки…';el('admin-queue-result').textContent=''}
    adminStatus(keepSnapshot?'Обновляю записи… Пока показан предыдущий список; действия недоступны.':'Загружаю записи…');
    const data=await adminRequestData(week,{},()=>{if(generation===adminRequest)adminStatus('Ответ не пришёл. Повторяю загрузку…')});
    if(generation!==adminRequest)return;
    adminData=data;adminLoadedWeek=week;adminDataFresh=true;
    renderAdmin();
    el('bonus-section').classList.toggle('hide',data.bonusDecisions!==true);
    if(data.bonusDecisions===true)loadBonuses();
    adminStatus('Обновлено: '+new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(new Date())+' МСК.');
  }catch(error){if(generation===adminRequest){
    const keepSnapshot=adminData!==null&&requestedWeek===adminLoadedWeek;
    adminStatus(error.message+(keepSnapshot?' Показан предыдущий список; изменение записей недоступно.':''));
    if(!keepSnapshot){adminData=null;el('admin-queue-summary').textContent='Очередь приёмки не загружена.';
      el('admin-assembly-list').replaceChildren();el('admin-attendance-list').replaceChildren();el('admin-checks').replaceChildren()}
  }}
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
function addPhotoButton(box,r,worker=false){
  if(!r.photo)return;
  const button=node('button','Показать фото');button.type='button';
  let errorNode=null;
  button.onclick=async()=>{
    button.disabled=true;button.textContent='Загружаю фото…';
    if(errorNode){errorNode.remove();errorNode=null}
    try{
      const photo=await adminRequestData('',{view:worker?'workerPhoto':'photo',key:r.key},undefined,worker);
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
    const button=node('button',caption,status==='Принято'?'admin-primary':'');
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
    const box=adminCard(root,workTitle(r),
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
    box.append(node('strong',workTitle(r)),
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
    const box=adminCard(a,r.name+' · '+workTitle(r),
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
  const kind=field(form,'Тип работы','select',r.kind||'Сборка',['Сборка','Переделка','Загрузка машины']);
  const product=field(form,'Изделие','select',r.product,products.concat(['Загрузка машины']));
  const qty=field(form,'Количество изделий','number',r.qty);qty.min='1';qty.max='100000';qty.step='1';
  const table=node('div',null,'admin-fields');form.append(table);
  const partInputs=parts.map((p,i)=>{
    const input=field(table,p+', шт.','number',r.parts[i]||0);
    input.min='0';input.max='1000';input.step='1';return input;
  });
  const period=field(form,'Период работы','select',r.period,periods);
  box.append(node('p','Статус приёмки меняется отдельными кнопками в карточке изделия.','admin-warning'));
  const order=field(form,'№ заказа','text',r.order);order.maxLength=80;order.required=true;
  const toggle=()=>{
    const loading=kind.value==='Загрузка машины',isTable=!loading&&product.value==='Стол';
    table.classList.toggle('hide',!isTable);qty.disabled=isTable||loading;product.disabled=loading;period.disabled=loading;order.required=!loading;
  };
  kind.onchange=toggle;product.onchange=toggle;toggle();
  const note=field(form,'Комментарий, проблемы и просьба о надбавке','textarea',r.note);note.maxLength=1000;
  const save=node('button','Сохранить исправление','submit');save.type='submit';form.append(save);
  form.onsubmit=e=>{
    e.preventDefault();const loading=kind.value==='Загрузка машины',isTable=!loading&&product.value==='Стол';
    const values=partInputs.map(x=>Number(x.value));
    if(isTable&&(!values.some(n=>n>0)||values.some(n=>!Number.isInteger(n)||n<0||n>1000))){
      adminStatus('Проверьте количество элементов стола.');return;
    }
    const count=isTable||loading?1:Number(qty.value);
    if(!isTable&&(!Number.isInteger(count)||count<1||count>100000)){
      adminStatus('Проверьте количество изделий.');return;
    }
    send({version:1,type:'adminEditAssembly',row:r.row,key:r.key,rev:r.rev,date:date.value,
      name:name.value,kind:kind.value,product:loading?'Загрузка машины':product.value,qty:count,parts:isTable?values:[],
      period:loading?periods[0]:period.value,status:r.status,order:order.value.trim(),note:note.value.trim()});
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
// Bonus requests have their own freshness and include all weeks.
let bonusData=null,bonusDataFresh=false,bonusGeneration=0;
el('bonus-refresh').onclick=loadBonuses;
el('bonus-filter').onchange=renderBonuses;
async function loadBonuses(){
  if(!adminView)return;
  const generation=++bonusGeneration;bonusDataFresh=false;
  el('bonus-status').textContent='Загружаю запросы…';
  renderBonuses();
  try{
    const data=await adminRequestData('',{view:'bonuses'});
    if(generation!==bonusGeneration)return;
    if(data.supported!==true)throw new Error(data.message||'Для надбавок требуется обновлённый Apps Script.');
    bonusData=data;bonusDataFresh=true;renderBonuses();
    const pending=(data.entries||[]).filter(r=>r.decision==='На рассмотрении').length;
    el('bonus-status').textContent='На рассмотрении: '+pending+'. Данные по всем неделям.';
  }catch(error){if(generation===bonusGeneration){
    el('bonus-status').textContent=error.message+' Решения недоступны до успешного обновления.';renderBonuses();
  }}
}
function renderBonuses(){
  const root=el('bonus-list');root.replaceChildren();
  if(!bonusData)return;
  const entries=(bonusData.entries||[]).filter(r=>el('bonus-filter').value==='all'||r.decision==='На рассмотрении');
  if(!entries.length){root.append(node('p','Просьб на рассмотрении нет.'));return}
  for(const r of entries){
    const card=node('article',null,'admin-record bonus-record');
    card.append(node('h4',r.name+' · '+r.product+' × '+r.qty));
    card.append(node('p',shortDate(r.date)+' · Заказ № '+r.order+' · '+r.status));
    card.append(node('p',r.request,'bonus-request'));
    card.append(node('p',r.decision+(Number(r.amount)>0?' · '+rubles(r.amount):'')));
    if(r.result)card.append(node('p',r.result,'admin-warning'));
    if(r.decision==='Одобрено')card.append(node('p','К выплате по этой заявке: '+rubles(Number(r.payBonus)||0)));
    const edit=node('button',r.decision==='На рассмотрении'?'Рассмотреть просьбу':'Изменить решение');edit.type='button';
    edit.disabled=!bonusDataFresh||!r.canDecide;card.append(edit);
    edit.onclick=()=>editBonus(card,r,edit);
    root.append(card);
  }
}
function editBonus(card,r,button){
  if(!bonusDataFresh||!r.canDecide)return;
  button.disabled=true;
  const form=node('form',null,'bonus-form');
  const amount=field(form,'Согласованная сумма за заявку, ₽','number',Number(r.amount)>0?r.amount:r.suggested);
  amount.min='0.01';amount.max='1000000';amount.step='0.01';amount.inputMode='decimal';
  const reason=field(form,'Основание решения','textarea',String(r.reason||r.request).replace(/^Отказ:\s*/i,'').slice(0,600));
  reason.required=true;reason.maxLength=600;
  const hint=node('p','Сумма из просьбы - подсказка. Проверьте её: она не должна повторять оплату элементов стола.','admin-warning');form.append(hint);
  const actions=node('div',null,'bonus-actions');
  const approve=node('button','Одобрить');approve.type='button';
  const decline=node('button','Отклонить');decline.type='button';decline.className='bonus-decline';
  const cancel=node('button','Отмена');cancel.type='button';
  actions.append(approve,decline,cancel);form.append(actions);card.append(form);
  form.onsubmit=e=>e.preventDefault();
  cancel.onclick=()=>{form.remove();button.disabled=!bonusDataFresh};
  const decide=decision=>{
    if(!bonusDataFresh){el('bonus-status').textContent='Обновите запросы перед решением.';return}
    if(!reason.value.trim()){reason.reportValidity();reason.focus();return}
    if(decision==='Одобрено'&&(!amount.value||!amount.reportValidity())){amount.focus();return}
    const sum=decision==='Одобрено'?Number(amount.value):0;
    if(!window.confirm(r.name+' · Заказ № '+r.order+'\n'+(decision==='Одобрено'?'Согласовать '+rubles(sum)+' за эту заявку?':'Отклонить надбавку?')))return;
    send({version:1,type:'adminBonusDecision',key:r.key,link:r.link,rev:r.rev,decision,amount:sum,reason:reason.value.trim()});
  };
  approve.onclick=()=>decide('Одобрено');decline.onclick=()=>decide('Отклонено');
}
if(workerView)loadWorker();
})();

