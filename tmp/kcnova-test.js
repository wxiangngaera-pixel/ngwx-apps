/* Peter 26th Nov 2026 : Nova ( his voice assistant ) and + New Order.
   Opening /kitchen/?app=no&nova=<draft>#neworder fills + New Order with the client, menu Meals and Bundles, date, time slot,
   Delivery or Pickup, address, packaging, Cooked or Raw weight, salt and spice levels, note and payment.
   27th Nov 2026 : auto:1 ( "Yes, submit to Kitchen" in Nova's 7-step form ) gets the Lalamove fee, saves the order the normal way
   ( noSave ) and goes back to Nova with the Order Number and price. If the fee can't be found nothing is saved. dry:1 = test only.
   Sponsored = "This Order only", full amount.
   27th Nov 2026 : copy:[order ids] / plans:[Saved Meal Plan ids] / cart:1 load the client's Past Orders, Saved Meal Plans and Cart.
   27th Nov 2026 : draft:1 ( "Save as Draft" in Nova ) keeps the order in Drafts ( kc_docs nova_drafts ) and goes back to Nova.
   Drafts shows at the top of + New Order : Submit ( saves it like Nova does ), Open to edit ( fills the form; the draft goes once
   the order is saved ) or Delete. */
(function(){if(window.__kcNova)return;window.__kcNova=1;
function say(m,bad){try{if(typeof window.toast==='function')window.toast(m,bad?1:0)}catch(e){}}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function ready(){return typeof window.noReset==='function'&&typeof window.noSet==='function'&&typeof window.noMeal==='function'&&typeof window.S==='object'&&S&&S.meal&&S.bun&&Object.keys(S.meal).length>0}
function b64d(raw){var s=decodeURIComponent(raw).replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(escape(atob(s))))}
function b64e(o){return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
var DAY=function(iso){var d=new Date(String(iso).slice(0,10)+'T00:00:00+08:00');if(isNaN(d))return iso||'';var n=d.getDate(),x=(n%100>=11&&n%100<=13)?'th':({1:'st',2:'nd',3:'rd'}[n%10]||'th');return d.toLocaleDateString('en-GB',{weekday:'short',timeZone:'Asia/Kuala_Lumpur'})+' '+n+x+' '+d.toLocaleDateString('en-GB',{month:'short',timeZone:'Asia/Kuala_Lumpur'})+' '+d.getFullYear()};
var SLOT={'09:00-11:00':'9 – 11 AM','11:00-13:00':'11 AM – 1 PM','13:00-15:00':'1 – 3 PM','15:00-17:00':'3 – 5 PM','09:00-12:00':'9 AM – 12 PM','12:00-15:00':'12 – 3 PM','15:00-18:00':'3 – 6 PM'};
var PAYL={transfer:'Online Banking',cash:'Cash',myacct:'Send to customer',credit:'AERA Credit',unpaid:'Not paid yet'};

/* ---- fill + New Order from a Nova order ---- */
async function fill(d){
 for(var t=0;t<360&&!ready();t++)await sleep(500);
 if(!ready())return{miss:['the Console did not load']};
 if(!/^#neworder/.test(location.hash||'')){location.hash='#neworder';await sleep(600)}
 for(var u=0;u<40&&!window.noState();u++)await sleep(250);
 window.noReset();var set=function(k,v){window.noSet(k,v,false)},miss=[];
 if(d.name||d.email){set('email',String(d.email||'').trim().toLowerCase());set('name',String(d.name||'').trim());set('phone',String(d.phone||'').trim());set('newClient',!d.email)}
 if(d.fulfil==='delivery'||d.fulfil==='pickup')set('fulfil',d.fulfil);
 if(/^\d{4}-\d{2}-\d{2}$/.test(d.date||''))set('date',d.date);
 if(d.slot)set('slot',String(d.slot));
 if(d.address)set('address',String(d.address));
 if(d.pack==='bento'||d.pack==='vacuum')set('pack',d.pack);
 if(d.basis==='cooked'||d.basis==='raw')set('basis',d.basis);
 if(['normal','less_salt','no_salt'].indexOf(d.seas)>=0)set('seas',d.seas);
 if(['normal','less','none'].indexOf(d.spice)>=0)set('spice',d.spice);
 var wt=d.basis==='raw'?'[Raw Weight] ':d.basis==='cooked'?'[Cooked Weight] ':'';
 if(d.note||wt)set('note',wt+String(d.note||''));
 if(['transfer','cash','credit','myacct','unpaid'].indexOf(d.pay)>=0)set('pay',d.pay);
 if(d.sp==='order'){set('sp','order');set('spAmtMode','full');if(d.spWhy)set('spWhy',String(d.spWhy))}
 (d.items||[]).forEach(function(it){var q=Math.max(1,Math.min(50,+it.qty||1));
  if(it.kind==='bundle'){if(!S.bun[it.id]){miss.push(it.name||it.id);return}for(var i=0;i<q;i++)window.noBundle(it.id)}
  else{if(!S.meal[it.id]){miss.push(it.name||it.id);return}for(var j=0;j<q;j++)window.noMeal(it.id,1)}});
 /* the client's Past Orders, Saved Meal Plans and Cart */
 (d.copy||[]).forEach(function(oid){if(S.ord&&S.ord[oid])window.noCopy(oid);else miss.push('past order '+oid)});
 for(var p=0;p<(d.plans||[]).length;p++){var pid=d.plans[p],n0=window.noState().items.length;
  try{var r=await window.__KC_SB.from('meal_plans').select('id,meals,prefs').eq('id',pid).limit(1);var row=r.data&&r.data[0];
   if(!row){miss.push('saved plan '+pid);continue}window.postMessage({type:'aera-plan',plan:row},location.origin);
   for(var w=0;w<20&&window.noState().items.length===n0;w++)await sleep(150);if(window.noState().items.length===n0)miss.push('saved plan '+pid)}
  catch(e){miss.push('saved plan '+pid)}}
 if(d.cart){var n1=window.noState().items.length;try{window.noCartRefresh()}catch(e){}
  for(var c=0;c<40&&window.noState().items.length===n1;c++){await sleep(300);try{window.noCartUse()}catch(e){}}
  if(window.noState().items.length===n1)miss.push('their Cart')}
 window.noSet('note',window.noState().note,true);
 return{miss:miss}}

/* ---- save it : Lalamove fee, then noSave ; reports the Order Number and price ---- */
async function submit(d){
 var NO=window.noState();
 if(!NO.items.length)return{err:'No meals in this order'};
 if(NO.fulfil==='delivery'&&!(+NO.fee>0)){
  var inp=null;for(var n=1;n<=6&&!inp;n++){try{window.kcStepGo(n)}catch(e){}await sleep(250);inp=document.querySelector('#main input[data-kcaddr]')}
  if(!inp||typeof window.kcAddrCheck!=='function')return{err:'Could not find the address box'};
  inp.value=NO.address;try{await window.kcAddrCheck()}catch(e){}
  for(var w=0;w<60&&!(+window.noState().fee>0);w++)await sleep(500);
  if(!(+window.noState().fee>0))return{err:'Lalamove could not price this address'};
 }
 var orig=window.saveOrder,got=null;
 window.saveOrder=async function(){var eo=window.EO||EO;var t=orderTotals(eo);
  got={no:eo.orderNo,name:eo.customer&&eo.customer.name,date:eo.fulfil&&eo.fulfil.date,slot:eo.fulfil&&eo.fulfil.slot,fulfil:eo.fulfil&&eo.fulfil.type,boxes:t.boxes,
   meals:Math.round(t.price*100)/100,pack:+eo.packagingFee||0,fee:+eo.deliveryFee||0,disc:+eo.discount||0,waive:+eo.waiveAmt||0,pay:eo.payMethod||''};
  got.total=Math.round((got.meals+got.pack+got.fee-got.disc-got.waive)*100)/100;
  window.saveOrder=orig;
  if(d&&d.dry){window.__novaDry=got;try{window.noState().busy=false}catch(e){}return}
  return orig.apply(this,arguments)};
 try{await window.noSave()}catch(e){window.saveOrder=orig;return{err:'Save failed: '+((e&&e.message)||e)}}
 window.saveOrder=orig;
 if(!got)return{err:'The order was not saved'};
 if(d&&d.dry)return{got:got,dry:1};
 for(var k=0;k<20;k++){var hit=Object.keys(S.ord||{}).some(function(id){return S.ord[id]&&S.ord[id].orderNo===got.no});if(hit)break;await sleep(300)}
 return{got:got}}
function stopHere(m){say(m+' — nothing saved yet, finish it here',1);try{if(typeof window.kcStepGo==='function')window.kcStepGo(5)}catch(e){}}

/* ---- Drafts ( kc_docs nova_drafts ) ---- */
var DR={list:null,busy:false};
function drSummary(d){var n=(d.items||[]).reduce(function(a,i){return a+(+i.qty||1)},0);var bits=[];
 if(n)bits.push(n+' item'+(n>1?'s':''));if((d.copy||[]).length)bits.push((d.copy.length>1?d.copy.length+' past orders':'a past order'));
 if((d.plans||[]).length)bits.push((d.plans.length>1?d.plans.length+' saved plans':'a saved plan'));if(d.cart)bits.push('their Cart');if(d.plan)bits.push('Personalised Meal Plan');
 return[(d.fulfil==='pickup'?'Self Pick-Up':'Delivery')+' · '+DAY(d.date)+(SLOT[d.slot]?', '+SLOT[d.slot]:''),bits.join(' + ')||'no meals yet',d.pack==='vacuum'?'Vacuum':'Bento',d.sp==='order'?'Sponsored':(PAYL[d.pay]||'')].filter(Boolean).join(' · ')}
async function drLoad(){try{var q=await DB.collection('nova_drafts').get();DR.list=(q.docs||[]).map(function(x){var v=x.data();v.id=x.id;return v}).sort(function(a,b){return String(b.at).localeCompare(String(a.at))})}catch(e){DR.list=DR.list||[]}drPaint()}
async function drSave(d){var id='d'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);var x=JSON.parse(JSON.stringify(d));delete x.draft;delete x.auto;delete x.back;delete x.dry;
 await DB.doc('nova_drafts/'+id).set({at:new Date().toISOString(),name:String(d.name||''),email:String(d.email||''),d:x});return id}
async function drDel(id){try{await DB.doc('nova_drafts/'+id).delete()}catch(e){}DR.list=(DR.list||[]).filter(function(x){return x.id!==id});drPaint()}
function drPaint(){var main=document.getElementById('main');if(!main||!/^#neworder/.test(location.hash||''))return;
 var box=document.getElementById('kcNovaDrafts');var L=DR.list||[];
 if(!L.length){if(box)box.remove();return}
 if(!box||!main.contains(box)){box=document.createElement('section');box.id='kcNovaDrafts';box.className='card';box.style.cssText='margin:0 0 14px;padding:14px 16px';main.insertBefore(box,main.firstChild)}
 box.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><b style="font-size:16px">Drafts <span style="font-weight:400;color:#667">· '+L.length+' waiting</span></b><span style="font-size:12px;color:#889">Saved from Nova</span></div>'+
  L.map(function(x){var t=new Date(x.at);return'<div style="border-top:1px solid #E4E7EC;padding:10px 0"><div style="font-weight:700">'+esc(x.name||x.email||'No client yet')+'</div><div style="font-size:13px;color:#475467">'+esc(drSummary(x.d||{}))+'</div><div style="font-size:12px;color:#98A2B3">Saved '+esc(DAY(x.at))+', '+t.toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:'Asia/Kuala_Lumpur'})+'</div>'+
   '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button type="button" class="btn p" data-dr="go" data-id="'+x.id+'"'+(DR.busy?' disabled':'')+'>Submit</button><button type="button" class="btn" data-dr="open" data-id="'+x.id+'"'+(DR.busy?' disabled':'')+'>Open to edit</button><button type="button" class="btn" style="color:#B42318" data-dr="del" data-id="'+x.id+'"'+(DR.busy?' disabled':'')+'>Delete</button></div></div>'}).join('')}
/* attached in hook() : the Console rewrites the page after it loads, which erases listeners added before that */
async function drClick(e){var b=e.target.closest&&e.target.closest('[data-dr]');if(!b||DR.busy)return;e.preventDefault();
 var x=(DR.list||[]).find(function(y){return y.id===b.dataset.id});if(!x)return;var d=x.d||{};
 if(b.dataset.dr==='del'){var ok=typeof window.askConfirm==='function'?await window.askConfirm('Delete the draft for '+(x.name||'this client')+'?'):confirm('Delete this draft?');if(ok){await drDel(x.id);say('Draft deleted')}return}
 DR.busy=true;drPaint();
 try{var r=await fill(d);
  if(b.dataset.dr==='open'){say('Draft loaded'+(r.miss.length?' · not found: '+r.miss.join(', '):'')+' — check it and tap Save order',r.miss.length);watchSaved(x.id);return}
  if(d.plan){say('This draft has a Personalised Meal Plan — build it, then Save order',1);watchSaved(x.id);return}
  if(r.miss.length){stopHere('Not found: '+r.miss.join(', '));watchSaved(x.id);return}
  var s=await submit(d);if(s.err){stopHere(s.err);watchSaved(x.id);return}
  await drDel(x.id);say('Saved '+s.got.no+' · RM '+s.got.total.toFixed(2))}
 finally{DR.busy=false;drPaint()}}
/* an opened draft goes once its order is saved ( the builder resets after a save ) */
function watchSaved(id){var t0=Date.now(),seen=false;(function w(){var st=window.noState&&window.noState();if(st&&st.items&&st.items.length)seen=true;
 if(seen&&!st){drDel(id);return}if(Date.now()-t0<3600e3)setTimeout(w,1000)})()}
var mo=null;function hook(){var main=document.getElementById('main');if(!main){return setTimeout(hook,500)}
 if(!document.__kcNovaOn){document.__kcNovaOn=1;window.addEventListener('click',drClick,true);window.addEventListener('hashchange',function(){if(/^#neworder/.test(location.hash||''))drLoad()})}
 if(!mo){mo=new MutationObserver(function(){if(/^#neworder/.test(location.hash||'')&&DR.list&&DR.list.length&&!document.getElementById('kcNovaDrafts'))drPaint()});mo.observe(main,{childList:true})}}


/* ---- a Nova link in the address ---- */
var raw=(location.search.match(/[?&]nova=([^&#]+)/)||[])[1];var d=null;
if(raw){try{d=b64d(raw)}catch(e){d=null}}
function clean(){try{var q=location.search.replace(/([?&])nova=[^&#]*&?/,'$1').replace(/[?&]$/,'');history.replaceState(null,'',location.pathname+q+'#neworder')}catch(e){}}
function back(key,obj){if(!d||!d.back)return;var j=b64e(obj);setTimeout(function(){location.href=String(d.back).split('#')[0]+(String(d.back).indexOf('?')<0?'?':'&')+key+'='+j},900)}
(async function start(){
 for(var t=0;t<360&&!ready();t++)await sleep(500);
 hook();
 if(d&&typeof d==='object'){clean();
  if(d.draft){try{for(var z=0;z<40&&typeof window.DB!=='object';z++)await sleep(250);await drSave(d);say('Draft saved for '+(d.name||'the client'));back('aera_draft',{name:d.name||'',date:d.date||''})}catch(e){say('Could not save the draft: '+((e&&e.message)||e),1)}await drLoad();return}
  var r=await fill(d);
  if(d.auto&&!r.miss.length&&!d.plan){var s=await submit(d);
   if(s.err){stopHere(s.err)}else if(s.dry){say('Dry run · '+s.got.no+' · RM '+s.got.total.toFixed(2)+' ( not saved )')}else{say('Saved '+s.got.no+' · RM '+s.got.total.toFixed(2));back('aera_saved',s.got)}}
  else{setTimeout(function(){try{if(typeof window.kcStepGo==='function')window.kcStepGo(5)}catch(e){}},300);
   say((d.plan?'Filled by Nova — build the Personalised Meal Plan, then Save order':'Filled by Nova'+(r.miss.length?' · not found: '+r.miss.join(', '):'')+' — check it'+(d.fulfil==='pickup'?'':', tap Check with Lalamove')+', then Save order'),r.miss.length)}
 }
 drLoad();
})();
})();