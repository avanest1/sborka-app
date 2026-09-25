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
if(adminView){el('admin-picker').classList.remove('hide');el('hero-label').textContent='Кабинет руководителя';document.querySelector('.profile__caption').textContent='РУКОВОДИТЕЛЬ';staff.forEach(n=>option(el('admin-employee'),n))}
const day=()=>{const x=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(y=>[y.type,y.value]));return `${x.year}-${x.month}-${x.day}`};
const today=day();
el('date').value=today;el('date').max=today;
el('today-label').textContent=new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',day:'numeric',month:'long',weekday:'long'}).format(new Date());
function section(name){for(const n of ['shift','assembly']){el(n).classList.toggle('hide',n!==name);el('tab-'+n).classList.toggle('active',n===name);el('tab-'+n).setAttribute('aria-selected',String(n===name))}el('message').classList.add('hide')}
el('tab-shift').onclick=()=>section('shift');el('tab-assembly').onclick=()=>section('assembly');
function option(select,value){const item=document.createElement('option');item.value=value;item.textContent=value;select.append(item)}
products.forEach(n=>option(el('product'),n));periods.forEach(n=>option(el('period'),n));
for(const [i,name] of parts.entries()){const row=document.createElement('div');row.className='part';const label=document.createElement('label');label.htmlFor='part-'+i;label.textContent=name;const input=document.createElement('input');input.id='part-'+i;input.type='number';input.min='0';input.max='1000';input.step='1';input.value='0';input.inputMode='numeric';row.append(label,input);el('parts').append(row)}
el('product').onchange=()=>{const table=el('product').value==='Стол';el('table-parts').classList.toggle('hide',!table);el('ordinary').classList.toggle('hide',table);el('qty').required=!table};
function notice(message){const box=el('message');box.textContent=message;box.className='notice error';box.scrollIntoView({behavior:'smooth',block:'center'})}
function send(payload){if(!tg||typeof tg.sendData!=='function'||!tg.initData){notice('Откройте приложение кнопкой в личном чате с ботом.');return}if(adminView){const target=el('admin-employee').value;if(!staff.includes(target)){notice('Сначала выберите сотрудника.');el('admin-employee').focus();return}payload.employee=target}const raw=JSON.stringify(payload);if(new TextEncoder().encode(raw).length>4096){notice('Комментарий слишком длинный для отправки.');return}tg.sendData(raw)}
el('arrive').onclick=()=>send({version:1,type:'arrive'});
el('leave').onclick=()=>send({version:1,type:'leave'});
el('assembly-form').onsubmit=e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;const product=el('product').value,table=product==='Стол';const qty=Number(el('qty').value);const tableParts=parts.map((_,i)=>Number(el('part-'+i).value));if(table&&(!tableParts.some(x=>x>0)||tableParts.some(x=>!Number.isInteger(x)||x<0||x>1000))){notice('Укажите хотя бы один элемент стола и проверьте количество.');return}if(!table&&(!Number.isInteger(qty)||qty<1||qty>100000)){notice('Количество изделий должно быть от 1 до 100000.');return}send({version:1,type:'assembly',date:el('date').value,product,qty:table?1:qty,parts:table?tableParts:[],period:el('period').value,order:el('order').value.trim(),note:el('note').value.trim()})};
})();
