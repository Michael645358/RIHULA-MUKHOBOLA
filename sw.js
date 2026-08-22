const CACHE='rihula-v3-2026-08-22-register-fix';
const CORE=['./','./index.html','./offline.html','./style.css','./rihula-modern-design.css','./rihula-v3-ui.css','./rihula-v3-ui.js','./manifest.json','./images/logo.jpg'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||!req.url.startsWith(self.location.origin)) return;

  // Always try the network first. This prevents old Supabase configuration
  // and JavaScript files from being permanently served from a stale cache.
  event.respondWith(
    fetch(req)
      .then(res=>{
        if(res && res.ok){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
        }
        return res;
      })
      .catch(()=>
        caches.match(req).then(cached=>{
          if(cached) return cached;
          if(req.mode==='navigate') return caches.match('./offline.html');
          return new Response('',{status:503,statusText:'Offline'});
        })
      )
  );
});

self.addEventListener('message',event=>{
  if(event.data==='SKIP_WAITING') self.skipWaiting();
});
