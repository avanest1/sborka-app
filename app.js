(()=>{'use strict';
const products=['Сборка мангала','Сборка печки','Коптильня','Центральная секция до 2000 мм','Центральная секция 2120 мм','Центральная секция 2350 мм','Решётка для мангала','Дровник','Ручка для мангала','Подарочная доска','Выдвижной ящик','Стеллаж навесной','Шкафчик навесной','Стол','Стул с покраской в 1 слой','Стул с покраской в 2 слоя','Скручивание столов'];
const periods=['Основное время','Переработка до 3 ч','Переработка после 3 ч'];
const parts=['Столешница','Боковой экран','Дверь','Фартук','Полка','Врезка с монтажом','Большой фартук'];
const staff=['Антон','Нарик','Леня','Фил','Кореш'];
const tg=window.Telegram?.WebApp;
const el=id=>document.getElementById(id);
if(tg){tg.ready();tg.expand()}
const fromBot=new URLSearchParams(window.location.search).get('employee');
const employee=staff.includes(fromBot)||fromBot==='Андрей'?fromBot:null;
const adminView=employee==='Андрей';
const telegramFirstName=String(tg?.initDataUnsafe?.user?.first_name||'').trim();
const visibleName=employee||(telegramFirstName?telegramFirstName:'Откройте через бота');
el('employee-name').textContent=visibleName;
el('employee-avatar').textContent=visibleName==='Откройте через бота'?'·':Array.from(visibleName)[0].toLocaleUpperCase('ru');
if(!employee)document.querySelector('.profile__caption').textContent=telegramFirstName?'ПРОФИЛЬ TELEGRAM':'СОТРУДНИК';
if(adminView){el('admin-picker').classList.remove('hide');el('tab-admin').classList.remove('hide');el('hero-label').textContent='Кабинет руководителя';document.querySelector('.profile__caption').textContent='РУКОВОДИТЕЛЬ';staff.forEach(n=>option(el('admin-employee'),n))}
const day=()=>{const x=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(y=>[y.type,y.value]));return `${x.year}-${x.month}-${x.day}`};
const today=day();
el('date').value=today;el('date').max=today;
el('today-label').textContent=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',weekday:'long'}).format(new Date());
function section(name){for(const n of ['shift','assembly','photo','admin']){el(n).classList.toggle('hide',n!==name);el('tab-'+n).classList.toggle('active',n===name);el('tab-'+n).setAttribute('aria-selected',String(n===name))}el('message').classList.add('hide')}
el('tab-shift').onclick=()=>section('shift');el('tab-assembly').onclick=()=>section('assembly');el('tab-photo').onclick=()=>section('photo');
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
function send(payload){if(!tg||typeof tg.sendData!=='function'){notice('Не загрузилось соединение с Telegram (T1, версия 9). Откройте приложение заново через кнопку «Личный кабинет» в чате с ботом.');return}if(tg.platform==='unknown'){notice('Страница открыта вне приложения Telegram (T2, версия 9). Откройте её через кнопку «Личный кабинет» в чате с ботом.');return}if(adminView&&!['photoHelp','adminEditAssembly','adminEditAttendance'].includes(payload.type)){const target=el('admin-employee').value;if(!staff.includes(target)){notice('Сначала выберите сотрудника.');el('admin-employee').focus();return}payload.employee=target}const raw=JSON.stringify(payload);if(new TextEncoder().encode(raw).length>4096){notice('Комментарий слишком длинный для отправки.');return}tg.sendData(raw)}
el('arrive').onclick=()=>send({version:1,type:'arrive'});
el('leave').onclick=()=>send({version:1,type:'leave'});
el('assembly-form').onsubmit=e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;const product=el('product').value,table=product==='Стол';const qty=Number(el('qty').value);const tableParts=parts.map((_,i)=>Number(el('part-'+i).value));if(table&&(!tableParts.some(x=>x>0)||tableParts.some(x=>!Number.isInteger(x)||x<0||x>1000))){notice('Укажите хотя бы один элемент стола и проверьте количество.');return}if(!table&&(!Number.isInteger(qty)||qty<1||qty>100000)){notice('Количество изделий должно быть от 1 до 100000.');return}const note=assemblyNote();if(note===null)return;send({version:1,type:'assembly',date:el('date').value,product,qty:table?1:qty,parts:table?tableParts:[],period:el('period').value,order:el('order').value.trim(),note})};
el('photo-help').onclick=()=>send({version:1,type:'photoHelp'});

// Read only, signed Telegram data. The endpoint URL is supplied by the bot to
// the owner's keyboard button. Mutations always use Telegram sendData above.
const adminEndpoint=new URLSearchParams(location.search).get('api')||'';
const startWeek=()=>{
  const d=new Date(today+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));
  return d.toISOString().slice(0,10)
};
el('admin-week').value=startWeek();
el('admin-week').max=today;
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
function adminRequestData(week){
  return new Promise((resolve,reject)=>{
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(adminEndpoint))
      return reject(new Error('В проекте Apps Script нужно развернуть веб-приложение версии 9 и снова открыть кабинет кнопкой бота.'));
    if(!tg?.initData)return reject(new Error('Не получено подтверждение Telegram. Откройте кабинет кнопкой в личном чате.'));
    const callback='__tgAdm_'+Math.random().toString(36).slice(2,14);
    const url=new URL(adminEndpoint);
    url.searchParams.set('callback',callback);
    url.searchParams.set('initData',tg.initData);
    url.searchParams.set('week',week);
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
    timeout=setTimeout(()=>finish(new Error('Сервер долго отвечает. Повторите обновление.')),18000);
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
  el('admin-week').value=monday;return monday;
}
async function loadAdmin(){
  if(!adminView)return;
  const generation=++adminRequest;
  el('admin-editor').classList.add('hide');
  adminStatus('Загружаю записи…');
  try{
    const week=adminNormalizeWeek();
    const data=await adminRequestData(week);
    if(generation!==adminRequest)return;
    adminData=data;
    renderAdmin();
    adminStatus('Обновлено: '+new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(new Date())+' МСК.');
  }catch(error){if(generation===adminRequest){adminStatus(error.message);adminData=null;
    el('admin-assembly-list').replaceChildren();el('admin-attendance-list').replaceChildren()}}
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
function renderAdmin(){
  const a=el('admin-assembly-list'),t=el('admin-attendance-list');
  a.replaceChildren();t.replaceChildren();
  const assembly=adminData?.assembly||[],attendance=adminData?.attendance||[];
  if(!assembly.length)a.append(node('p','За выбранную неделю сборки не найдены.'));
  if(!attendance.length)t.append(node('p','За выбранную неделю отметок нет.'));
  assembly.forEach(r=>{
    const box=adminCard(a,r.name+' · '+r.product+' × '+r.qty,
      r.date+' · заказ № '+r.order+' · '+r.status+' · строка '+r.row,()=>editAssembly(r));
    if(r.product==='Стол')box.insertBefore(node('p',parts.map((p,i)=>r.parts[i]>0?p+' × '+r.parts[i]:'').filter(Boolean).join(', ')),box.lastChild);
    if(r.note)box.insertBefore(node('p',r.note.length>220?r.note.slice(0,220)+'…':r.note),box.lastChild);
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
  const status=field(form,'Приёмка','select',r.status,['Ожидает приёмки','Принято','Своя переделка']);
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
      period:period.value,status:status.value,order:order.value.trim(),note:note.value.trim()});
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
