'use strict';
const CACHE_PREFIX='medplus-pwa-';
const CACHE_NAME=CACHE_PREFIX+'r11-2-48';
const INDEX_KEY='./index.html';
const CONFIG_KEY='./config.js';
const SHELL=['./',INDEX_KEY,CONFIG_KEY,'./manifest.webmanifest','./icons/medplus-192.png','./icons/medplus-512.png','./icons/medplus-180.png','./icons/medplus-maskable-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(async cache=>{
    for(const url of SHELL){
      try{
        const abs=new URL(url,self.location.href).href;
        await cache.add(new Request(abs,{cache:'reload'}));
      }catch(_e){}
    }
  }).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

function updateInBackground(cache,key,request){
  return fetch(request,{cache:'no-store'}).then(res=>{
    if(res&&res.ok)cache.put(key,res.clone()).catch(()=>{});
    return res;
  });
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  if(req.mode==='navigate'){
    const isMain=url.pathname.endsWith('/')||url.pathname.endsWith('/index.html');
    if(!isMain)return;
    const cachePromise=caches.open(CACHE_NAME);
    const refreshPromise=cachePromise.then(cache=>updateInBackground(cache,INDEX_KEY,req)).catch(()=>null);
    event.waitUntil(refreshPromise.then(()=>{}));
    event.respondWith(cachePromise.then(async cache=>{
      const cached=await cache.match(INDEX_KEY)||await cache.match('./');
      if(cached)return cached;
      const live=await refreshPromise;
      if(live)return live;
      return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;padding:24px">Không thể mở MedPlus. Vui lòng kiểm tra kết nối mạng rồi mở lại ứng dụng.</body>',{headers:{'Content-Type':'text/html; charset=utf-8'}});
    }));
    return;
  }

  if(url.pathname.endsWith('/config.js')){
    const cachePromise=caches.open(CACHE_NAME);
    const refreshPromise=cachePromise.then(cache=>updateInBackground(cache,CONFIG_KEY,req)).catch(()=>null);
    event.waitUntil(refreshPromise.then(()=>{}));
    event.respondWith(cachePromise.then(async cache=>{
      const cached=await cache.match(CONFIG_KEY);
      if(cached)return cached;
      const live=await refreshPromise;
      return live||new Response('window.MEDPLUS_AUTH_BACKEND_URL=window.MEDPLUS_AUTH_BACKEND_URL||"";',{headers:{'Content-Type':'application/javascript; charset=utf-8'}});
    }));
    return;
  }

  if(/\/icons\/medplus-(?:180|192|512|maskable-512)\.png$/.test(url.pathname)||url.pathname.endsWith('/manifest.webmanifest')){
    event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
  }
});
