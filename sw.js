'use strict';
const CACHE_PREFIX='medplus-pwa-';
const CACHE_NAME=CACHE_PREFIX+'r11-2-32';
const SHELL=['./','./index.html','./manifest.webmanifest','./icons/medplus-192.png','./icons/medplus-512.png','./icons/medplus-180.png','./icons/medplus-maskable-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    const isMain=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
    if(!isMain)return;
    event.respondWith(fetch(req).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',copy)).catch(()=>{});}
      return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  if(/\/icons\/medplus-(?:180|192|512|maskable-512)\.png$/.test(url.pathname)||url.pathname.endsWith('/manifest.webmanifest')){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
  }
});
