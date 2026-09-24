'use strict';
const CACHE_PREFIX='medplus-pwa-';
const CACHE_NAME=CACHE_PREFIX+'r11-2-45';
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
    const refresh=caches.open(CACHE_NAME).then(cache=>fetch(req,{cache:'no-store'}).then(res=>{
      if(res&&res.ok)cache.put('./index.html',res.clone()).catch(()=>{});
      return res;
    }));
    event.waitUntil(refresh.then(()=>{}).catch(()=>{}));
    event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
      const cached=await cache.match('./index.html');
      if(cached)return cached;
      try{return await refresh}catch(_e){return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:24px">Không thể mở MedPlus. Vui lòng kiểm tra kết nối mạng rồi mở lại ứng dụng.</body>',{headers:{'Content-Type':'text/html; charset=utf-8'}})}
    }));
    return;
  }
  if(/\/icons\/medplus-(?:180|192|512|maskable-512)\.png$/.test(url.pathname)||url.pathname.endsWith('/manifest.webmanifest')){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
  }
});
