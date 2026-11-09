/* MDRRMO Posters — shared tools: remember inputs, presets, history, share, pre-download check.
   Loaded by index.html (history button only) and by each poster page in /pages. */
(function(){
  'use strict';
  var NS='mdrrmo:',MAXH=10;
  var PAGES={
    'heat-index':'Heat Index','rainfall-advisory':'Rainfall Advisory','thunderstorm-advisory':'Thunderstorm Advisory',
    'heavy-rainfall-warning':'Heavy Rainfall Warning','tropical-cyclone-bulletin':'Tropical Cyclone Bulletin'};
  var slug=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'');
  var isPoster=!!PAGES[slug],inPages=isPoster;
  var $=function(id){return document.getElementById(id)};

  /* ---------- storage ---------- */
  function jget(k,d){try{var v=localStorage.getItem(NS+k);return v?JSON.parse(v):d}catch(e){return d}}
  function jset(k,v){try{localStorage.setItem(NS+k,JSON.stringify(v));return true}catch(e){return false}}

  /* ---------- tiny helpers ---------- */
  function h(tag,attrs,kids){
    var e=document.createElement(tag);
    for(var k in (attrs||{})){if(k==='text')e.textContent=attrs[k];else if(k==='class')e.className=attrs[k];else e.setAttribute(k,attrs[k])}
    (kids||[]).forEach(function(c){if(c)e.appendChild(c)});return e;
  }
  function css(){
    var s=document.createElement('style');
    s.textContent=[
    '.pt-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}',
    '.pt-bar select{flex:1 1 150px;min-width:0;padding:8px 10px;border:1.5px solid var(--border-strong,#bcc7ee);border-radius:8px;background:#fff;color:var(--text,#0a1240);font:inherit;font-size:14px;min-height:40px}',
    '.pt-bar .btn[hidden]{display:none}',
    '.pt-ov{position:fixed;inset:0;z-index:1000;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,11,77,.55);padding:0}',
    '.pt-box{width:100%;max-width:520px;max-height:82vh;max-height:82dvh;overflow:auto;background:#fff;color:var(--text,#0a1240);border-radius:18px 18px 0 0;padding:20px 20px calc(20px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 40px rgba(0,11,77,.35)}',
    '@media(min-width:700px){.pt-ov{align-items:center;padding:20px}.pt-box{border-radius:18px;padding-bottom:20px}}',
    '.pt-box h3{font-family:var(--font-display,var(--display,inherit));font-size:19px;color:var(--blue,#00158b);margin-bottom:12px}',
    '.pt-sub{color:var(--text-muted,var(--muted,#56628f));font-size:13.5px;margin-bottom:12px}',
    '.pt-issues{list-style:none;margin:0 0 16px;padding:0;display:grid;gap:8px}',
    '.pt-issues li{padding:10px 12px;border-radius:10px;font-size:14px;border-left:5px solid}',
    '.pt-issues li.error{background:#fdecea;border-color:#d32f2f;color:#9b1818}',
    '.pt-issues li.warn{background:#fff4e0;border-color:#b45f00;color:#7a4300}',
    '.pt-row{display:flex;gap:8px;flex-wrap:wrap}',
    '.pt-btn{appearance:none;border:1.5px solid var(--border-strong,#bcc7ee);background:#fff;color:var(--blue,#00158b);border-radius:10px;padding:10px 16px;min-height:44px;font:600 14.5px var(--font,inherit);cursor:pointer;flex:1 1 auto}',
    '.pt-btn.primary{background:var(--blue,#00158b);border-color:var(--blue,#00158b);color:#fff}',
    '.pt-btn.sm{min-height:38px;padding:7px 12px;font-size:13.5px;flex:0 0 auto}',
    '.pt-item{display:flex;gap:12px;align-items:center;padding:10px 0;border-top:1px solid var(--border,#dbe1f5)}',
    '.pt-item:first-of-type{border-top:0}',
    '.pt-th{flex:0 0 56px;width:56px;height:70px;border-radius:8px;object-fit:cover;background:#e6ebff;border:1px solid var(--border,#dbe1f5)}',
    '.pt-info{flex:1;min-width:0}.pt-info b{display:block;font-size:14.5px;color:var(--blue,#00158b);line-height:1.25}',
    '.pt-info span{display:block;font-size:12.5px;color:var(--text-muted,var(--muted,#56628f));overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.pt-acts{display:flex;flex-direction:column;gap:6px}',
    '.pt-toast{position:fixed;left:50%;bottom:calc(20px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);opacity:0;z-index:1100;max-width:min(92vw,420px);padding:12px 16px;border-radius:12px;background:var(--blue,#00158b);color:#fff;font:600 14px var(--font,inherit);box-shadow:0 10px 28px -8px rgba(0,21,139,.6);transition:opacity .25s,transform .25s;pointer-events:none}',
    '.pt-toast.show{opacity:1;transform:translate(-50%,0)}'
    ].join('');
    document.head.appendChild(s);
  }
  var toastT;
  function toast(msg){
    var t=$('ptToast');if(!t){t=h('div',{id:'ptToast',class:'pt-toast',role:'status'});document.body.appendChild(t)}
    t.textContent=msg;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show')},3800);
  }
  function overlay(box){
    var ov=h('div',{class:'pt-ov',role:'dialog','aria-modal':'true'},[box]);
    function close(){ov.remove();document.removeEventListener('keydown',esc)}
    function esc(e){if(e.key==='Escape')close()}
    ov.addEventListener('click',function(e){if(e.target===ov)close()});
    document.addEventListener('keydown',esc);document.body.appendChild(ov);
    var f=box.querySelector('button');if(f)f.focus();
    return close;
  }

  /* ---------- poster form helpers ---------- */
  function ctrls(){
    var card=document.querySelector('.gen-wrap > section.card');if(!card)return[];
    return [].slice.call(card.querySelectorAll('input[id],select[id],textarea[id]')).filter(function(e){return e.type!=='file'&&!/^pt[A-Z]/.test(e.id)});
  }
  function getFields(){var o={};ctrls().forEach(function(e){o[e.id]=e.value});return o}
  function fire(e){e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
  function applyFields(vals,events){
    var cs=ctrls();
    cs.filter(function(e){return e.tagName==='SELECT'}).forEach(function(e){if(e.id in vals){e.value=vals[e.id];if(events)fire(e)}});
    cs.filter(function(e){return e.tagName!=='SELECT'}).forEach(function(e){if(e.id in vals){e.value=vals[e.id];if(events)fire(e)}});
  }
  function whenReady(cb){
    var n=0,t=setInterval(function(){
      var im=$('img')||$('i1');n++;
      if((im&&im.getAttribute('src'))||n>70){clearInterval(t);cb()}
    },150);
  }

  /* ---------- history ---------- */
  function thumb(cb){
    var im=$('img')||$('i1');if(!im||!im.getAttribute('src'))return cb('');
    var i=new Image();
    i.onload=function(){var w=200,hh=Math.round(w*i.naturalHeight/i.naturalWidth),c=document.createElement('canvas');c.width=w;c.height=hh;c.getContext('2d').drawImage(i,0,0,w,hh);cb(c.toDataURL('image/jpeg',.6))};
    i.onerror=function(){cb('')};i.src=im.src;
  }
  function record(){
    var f=getFields();
    thumb(function(t){
      var list=jget('history',[]),sig=JSON.stringify(f),now=Date.now();
      if(list[0]&&list[0].page===slug&&JSON.stringify(list[0].fields)===sig&&now-list[0].ts<60000){list[0].ts=now;if(t)list[0].thumb=t}
      else list.unshift({id:now.toString(36),page:slug,ts:now,fields:f,thumb:t});
      list=list.slice(0,MAXH);
      if(!jset('history',list)){list=list.slice(0,4);jset('history',list)}
      refreshCount();
    });
  }
  function summary(it){
    var f=it.fields||{},bits=[];
    if(f.lvl)bits.push(f.lvl.charAt(0).toUpperCase()+f.lvl.slice(1));
    var main=f.name||f.sub||f.head||'';if(main)bits.push(main);
    if(f.t1)bits.push(f.t1+'°C');
    return bits.join(' · ');
  }
  function refreshCount(){
    var b=$('recentBtn');if(!b)return;
    var n=jget('history',[]).length;b.textContent=n?'Recent ('+n+')':'Recent';
  }
  function clickDownload(){var b=$('dl')||$('dl3');if(!b)return;window.__ptSkip=true;b.click();window.__ptSkip=false}
  function reopen(it,download,close){
    if(close)close();
    if(it.page===slug&&isPoster){
      applyFields(it.fields,true);toast('Opened from history');
      if(download)setTimeout(clickDownload,900);
    }else{
      location.href=(isPoster?'':'pages/')+it.page+'.html?restore='+encodeURIComponent(it.id)+(download?'&download=1':'');
    }
  }
  function openHistory(onlyThis){
    var list=jget('history',[]);if(onlyThis)list=list.filter(function(i){return i.page===slug});
    var close;
    var box=h('div',{class:'pt-box'},[h('h3',{text:'Recent posters'}),
      h('p',{class:'pt-sub',text:'Saved on this device. "Edit" reopens the text; add the map again if it changed.'})]);
    if(!list.length)box.appendChild(h('p',{class:'pt-sub',text:'Nothing yet. Posters you download or share will show up here.'}));
    list.forEach(function(it){
      var th=it.thumb?h('img',{class:'pt-th',src:it.thumb,alt:''}):h('div',{class:'pt-th'});
      var when=new Date(it.ts).toLocaleString('en-PH',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
      var ed=h('button',{class:'pt-btn sm',type:'button',text:'Edit'}),dn=h('button',{class:'pt-btn sm primary',type:'button',text:'Download again'});
      ed.onclick=function(){reopen(it,false,close)};dn.onclick=function(){reopen(it,true,close)};
      box.appendChild(h('div',{class:'pt-item'},[th,h('div',{class:'pt-info'},[h('b',{text:PAGES[it.page]||it.page}),h('span',{text:summary(it)||'—'}),h('span',{text:when})]),h('div',{class:'pt-acts'},[ed,dn])]));
    });
    var row=h('div',{class:'pt-row'});row.style.marginTop='14px';
    var cl=h('button',{class:'pt-btn',type:'button',text:'Close'});cl.onclick=function(){close()};
    row.appendChild(cl);
    if(list.length){
      var ca=h('button',{class:'pt-btn',type:'button',text:'Clear history'});
      ca.onclick=function(){if(confirm('Remove all saved history from this device?')){jset('history',[]);refreshCount();close()}};row.appendChild(ca);
    }
    box.appendChild(row);close=overlay(box);
  }

  /* ---------- presets ---------- */
  function presets(){return jget('presets:'+slug,[])}
  function fillPresetSelect(sel,keep){
    sel.innerHTML='';sel.appendChild(h('option',{value:'',text:'Presets…'}));
    presets().forEach(function(p,i){sel.appendChild(h('option',{value:String(i),text:p.name}))});
    if(keep!=null)sel.value=keep;
  }
  function buildBar(){
    var card=document.querySelector('.gen-wrap > section.card');if(!card)return;
    var head=card.querySelector('.card-header');
    var sel=h('select',{id:'ptPreset','aria-label':'Presets'}),
        bSave=h('button',{type:'button',class:'btn btn-ghost btn-sm',text:'Save preset'}),
        bDel=h('button',{type:'button',class:'btn btn-ghost btn-sm',text:'Delete',hidden:''}),
        bClr=h('button',{type:'button',class:'btn btn-ghost btn-sm',text:'Clear form'}),
        bRec=h('button',{type:'button',class:'btn btn-ghost btn-sm',id:'recentBtn',text:'Recent'});
    var bar=h('div',{class:'pt-bar',id:'ptBar'},[sel,bSave,bDel,bClr,bRec]);
    head?head.insertAdjacentElement('afterend',bar):card.insertBefore(bar,card.firstChild);
    fillPresetSelect(sel);
    sel.onchange=function(){
      var p=presets()[+sel.value];bDel.hidden=!p;
      if(p){applyFields(p.fields,true);toast('Preset applied: '+p.name)}
    };
    bSave.onclick=function(){
      var name=prompt('Name this preset (for example: Yellow warning, Habagat)');if(!name)return;name=name.trim();if(!name)return;
      var list=presets(),f=getFields(),i=list.findIndex(function(p){return p.name.toLowerCase()===name.toLowerCase()});
      if(i>=0)list[i]={name:list[i].name,fields:f};else list.push({name:name,fields:f});
      jset('presets:'+slug,list);fillPresetSelect(sel,String(i>=0?i:list.length-1));bDel.hidden=false;toast('Preset saved: '+name);
    };
    bDel.onclick=function(){
      var list=presets(),p=list[+sel.value];if(!p||!confirm('Delete preset "'+p.name+'"?'))return;
      list.splice(+sel.value,1);jset('presets:'+slug,list);fillPresetSelect(sel);bDel.hidden=true;
    };
    bClr.onclick=function(){
      if(!confirm('Clear the text fields on this form?'))return;
      ctrls().forEach(function(e){if(e.tagName!=='SELECT'){e.value='';fire(e)}});
    };
    bRec.onclick=function(){openHistory(true)};
    refreshCount();
  }

  /* ---------- remember (draft) ---------- */
  function initDraft(){
    var d=jget('draft:'+slug,null);if(d)applyFields(d,false);
    var t;document.addEventListener('input',function(e){
      if(!e.target||!e.target.id||ctrls().indexOf(e.target)<0)return;
      clearTimeout(t);t=setTimeout(function(){jset('draft:'+slug,getFields())},250);
    });
    document.addEventListener('change',function(e){
      if(!e.target||!e.target.id||ctrls().indexOf(e.target)<0)return;
      clearTimeout(t);t=setTimeout(function(){jset('draft:'+slug,getFields())},250);
    });
    return !!d;
  }

  /* ---------- checks before download / share ---------- */
  function v(id){var e=$(id);return e?String(e.value||'').trim():''}
  function num(s){var n=parseFloat(String(s).replace(',','.'));return isNaN(n)?null:n}
  function hasMap(){try{return !!(A&&A.map)}catch(e){return false}}
  function check(){
    var out=[],E=function(m){out.push({l:'error',m:m})},W=function(m){out.push({l:'warn',m:m})};
    if(slug==='heat-index'){
      var d=v('date'),tm=v('time'),a=num(v('t1')),f=v('t2')?num(v('t2')):null;
      if(!d)E('The date is empty.');if(!tm)E('The time is empty.');
      if(a===null)E('Enter the actual heat index as a number.');
      else if(a<20||a>60)W('Actual heat index '+a+'°C looks unusual. Please double-check it.');
      if(v('t2')&&f===null)W('The iHeatMap forecast is not a number.');
      else if(f!==null&&(f<20||f>60))W('iHeatMap forecast '+f+'°C looks unusual. Please double-check it.');
      if(a!==null&&f!==null&&Math.abs(a-f)>6)W('Actual ('+a+'°C) and forecast ('+f+'°C) differ by more than 6°C.');
      if(tm&&!/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(tm))W('The time "'+tm+'" is not in the usual format, for example 11:00 AM.');
      var pd=d?Date.parse(d):NaN;
      if(!isNaN(pd)){var n=new Date(),p=new Date(pd);
        if(p.getFullYear()!==n.getFullYear()||p.getMonth()!==n.getMonth()||p.getDate()!==n.getDate())W('The date says '+d+', which is not today. Tap "Use today" if this is a new update.')}
    }else if(slug==='rainfall-advisory'||slug==='thunderstorm-advisory'){
      var lab=slug==='rainfall-advisory'?'weather system':'title (type of thunderstorm)';
      if(!v('sub'))E('The '+lab+' is empty.');if(!v('head'))E('The headline is empty.');if(!v('note'))W('The last line (note) is empty.');
      if(v('head').length>140)W('The headline is very long and may not fit on the poster.');
      if(!hasMap())W('No map screenshot has been added yet.');
    }else if(slug==='heavy-rainfall-warning'){
      if(!v('sub'))E('The weather system is empty.');if(!v('note'))E('The flooding message is empty.');
      try{var cur=v('lvl'),note=v('note');
        Object.keys(CFG.LV).forEach(function(k){if(k!==cur&&note===CFG.LV[k].msg)W('The flooding message is the standard '+CFG.LV[k].name+' one, but the level is '+CFG.LV[cur].name+'.')})}catch(e){}
      if(!hasMap())W('No map screenshot has been added yet.');
    }else if(slug==='tropical-cyclone-bulletin'){
      if(!v('name'))E('The cyclone name is empty.');
      var nm=v('num');if(!nm)E('The bulletin number is empty.');else if(!/^\d+$/.test(nm))W('The bulletin number should be a whole number.');
      if(!v('sum'))E('The summary is empty.');
      var w=v('when');if(!w)E('The issued time is empty.');
      else{var hrs=(Date.now()-new Date(w).getTime())/36e5;
        if(hrs>12)W('The issued time is about '+Math.round(hrs)+' hours old. Bulletins are normally issued every 6 hours.');
        else if(hrs<-1)W('The issued time is in the future.')}
      if(!hasMap())W('No track and intensity forecast map has been added yet.');
    }
    return out;
  }
  function showCheck(issues,go){
    var errs=issues.filter(function(i){return i.l==='error'}).length,close;
    var ul=h('ul',{class:'pt-issues'});
    issues.forEach(function(i){ul.appendChild(h('li',{class:i.l,text:i.m}))});
    var back=h('button',{class:'pt-btn primary',type:'button',text:'Go back and fix'}),
        cont=h('button',{class:'pt-btn',type:'button',text:'Continue anyway'});
    back.onclick=function(){close()};cont.onclick=function(){close();go()};
    close=overlay(h('div',{class:'pt-box'},[h('h3',{text:errs?'Check before you post':'Quick check'}),
      h('p',{class:'pt-sub',text:'These are only warnings. You decide whether to continue.'}),ul,h('div',{class:'pt-row'},[back,cont])]));
  }

  /* ---------- share ---------- */
  function blobOf(c){return new Promise(function(r){c.toBlob(r,'image/png')})}
  async function shareNow(){
    var text=v('fb'),copied=false;
    try{navigator.clipboard.writeText(text).catch(function(){});copied=true}catch(e){}
    var files=[];
    try{
      var cs=[];
      if(typeof render==='function'){cs=[render(1,2000),render(2,2000)]}
      else if($('c'))cs=[$('c')];
      var bl=await Promise.all(cs.map(blobOf));
      files=bl.filter(Boolean).map(function(b,i){return new File([b],slug+'-'+(i+1)+'.png',{type:'image/png'})});
    }catch(e){}
    if(navigator.canShare&&files.length&&navigator.canShare({files:files})){
      try{await navigator.share({files:files,text:text,title:PAGES[slug]});
        toast(copied?'Caption copied. Paste it if the app did not add the text.':'Shared');return}
      catch(e){if(e&&e.name==='AbortError')return}
    }
    toast((copied?'Caption copied. ':'')+'Sharing is not available here, so the image is downloading.');
    clickDownload();
  }

  /* ---------- poster page init ---------- */
  function initPoster(){
    var hadDraft=initDraft();
    buildBar();
    var last=$('dl3')||$('dl');
    if(last){
      var sb=h('button',{id:'shareBtn',type:'button',class:'btn btn-secondary btn-lg w-100 mt-8',text:'Share…'});
      last.insertAdjacentElement('afterend',sb);sb.addEventListener('click',shareNow);
    }
    document.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('#dl,#dl1,#dl2,#dl3,#shareBtn');
      if(!b||window.__ptSkip)return;
      var issues=check();if(!issues.length)return;
      e.stopImmediatePropagation();e.preventDefault();
      showCheck(issues,function(){window.__ptSkip=true;b.click();window.__ptSkip=false});
    },true);
    document.addEventListener('click',function(e){
      var b=e.target.closest&&e.target.closest('#dl,#dl1,#dl2,#dl3,#shareBtn');if(b)record();
    });
    var q=new URLSearchParams(location.search),rid=q.get('restore'),dl=q.get('download')==='1',item=null;
    if(rid){item=jget('history',[]).filter(function(i){return i.id===rid})[0]||null;if(item)applyFields(item.fields,false);
      history.replaceState(null,'',location.pathname)}
    whenReady(function(){
      if(item){applyFields(item.fields,true);toast('Opened from history');if(dl)setTimeout(clickDownload,900)}
      else if(slug==='heat-index'&&!hadDraft&&$('today'))$('today').click();
    });
  }

  /* ---------- index (launcher) ---------- */
  function initIndex(){
    var b=$('recentBtn');if(!b)return;
    b.addEventListener('click',function(){openHistory(false)});refreshCount();
  }

  css();
  if(isPoster)initPoster();else initIndex();
})();