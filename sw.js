/* Bump VERSION on every release (also update the version text in index.html). */
const VERSION='mdrrmo-posters-v1.2.0';
const SHELL=['./','index.html','manifest.webmanifest','assets/css/app.css','assets/js/app.js','assets/js/tools.js',
 'pages/heat-index.html','pages/rainfall-advisory.html','pages/thunderstorm-advisory.html','pages/heavy-rainfall-warning.html','pages/tropical-cyclone-bulletin.html',
 'assets/img/floridablanca.png','assets/img/mdrrmo.png','assets/img/arangkada.png',
 'assets/img/icon-heat.png','assets/img/icon-rainfall.png','assets/img/icon-thunderstorm.png','assets/img/icon-heavyrain.png','assets/img/icon-cyclone.png',
 'assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon-maskable-512.png','assets/icons/apple-touch-icon.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>Promise.allSettled(SHELL.map(u=>c.add(u)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==VERSION).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  const staticDest=['document','style','script','image','font','manifest'].includes(r.destination);
  const fonts=u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com';
  if(fonts){ // stale-while-revalidate
    e.respondWith(caches.open(VERSION).then(c=>c.match(r).then(hit=>{
      const net=fetch(r).then(res=>{c.put(r,res.clone());return res}).catch(()=>hit);
      return hit||net;
    })));return;
  }
  if(u.origin!==location.origin||!staticDest)return;
  e.respondWith(fetch(r).then(res=>{ // network-first, cache fallback
    const copy=res.clone();caches.open(VERSION).then(c=>c.put(r,copy));return res;
  }).catch(()=>caches.match(r).then(h=>h||caches.match('index.html'))));
});