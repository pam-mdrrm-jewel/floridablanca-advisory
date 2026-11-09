(function(){
  'use strict';
  var $=function(id){return document.getElementById(id)};

  /* Service worker (needs HTTPS or localhost). Shows a refresh toast when a new version takes over. */
  if('serviceWorker' in navigator){
    var hadController=!!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange',function(){
      if(hadController)$('toast').classList.add('show');
      hadController=true;
    });
    window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
  }
  $('toastBtn').addEventListener('click',function(){location.reload()});

  /* Online / offline pill */
  var status=$('status'),label=$('statusText');
  function net(){
    var on=navigator.onLine;
    status.classList.toggle('off',!on);
    label.textContent=on?'Online':'Offline — the app still works';
  }
  window.addEventListener('online',net);window.addEventListener('offline',net);net();

  /* Android / desktop Chrome install button */
  var deferred=null,btn=$('installBtn');
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault();deferred=e;btn.classList.add('show');
  });
  btn.addEventListener('click',function(){
    if(!deferred)return;
    deferred.prompt();
    deferred.userChoice.finally(function(){deferred=null;btn.classList.remove('show')});
  });
  window.addEventListener('appinstalled',function(){btn.classList.remove('show')});

  /* iPhone / iPad hint (Safari has no install prompt) */
  var ua=navigator.userAgent;
  var isIOS=/iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var standalone=window.navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
  var hint=$('iosHint'),KEY='iosHintDismissed';
  var dismissed=false;try{dismissed=localStorage.getItem(KEY)==='1'}catch(e){}
  if(isIOS&&!standalone&&!dismissed)hint.classList.add('show');
  $('iosClose').addEventListener('click',function(){
    hint.classList.remove('show');try{localStorage.setItem(KEY,'1')}catch(e){}
  });
})();