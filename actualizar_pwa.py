#!/usr/bin/env python3
from pathlib import Path
import json, re, struct, zlib
root=Path.cwd()
required=['index.html','manifest.webmanifest','sw.js','version.json']
missing=[x for x in required if not (root/x).is_file()]
if missing: raise SystemExit('Ejecuta desde la raíz del repositorio. Faltan: '+', '.join(missing))
manifest={
'id':'./','name':'Control_Visitas · Secretaria comercial','short_name':'Control Visitas',
'description':'Planificación y seguimiento de visitas comerciales.','start_url':'./','scope':'./',
'display':'standalone','display_override':['standalone','minimal-ui'],'orientation':'any',
'background_color':'#111422','theme_color':'#151827','lang':'es',
'icons':[
{'src':'./icons/icon-192.png','sizes':'192x192','type':'image/png','purpose':'any'},
{'src':'./icons/icon-512.png','sizes':'512x512','type':'image/png','purpose':'any'},
{'src':'./icons/icon-maskable-512.png','sizes':'512x512','type':'image/png','purpose':'maskable'}]}
(root/'manifest.webmanifest').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def chunk(tag,data): return struct.pack('>I',len(data))+tag+data+struct.pack('>I',zlib.crc32(tag+data)&0xffffffff)
def icon(path,n):
    rows=[]
    for y in range(n):
        row=bytearray([0])
        for x in range(n):
            xx,yy=x/n*100,y/n*100
            c=(27<=xx<36 and 31<=yy<69) or (27<=xx<58 and (31<=yy<40 or 60<=yy<69))
            def seg(px,py,x1,y1,x2,y2,t):
                dx,dy=x2-x1,y2-y1
                u=max(0,min(1,((px-x1)*dx+(py-y1)*dy)/(dx*dx+dy*dy)))
                return (px-x1-u*dx)**2+(py-y1-u*dy)**2<=t*t
            v=seg(xx,yy,52,32,66,68,4.2) or seg(xx,yy,66,68,82,32,4.2)
            color=(255,255,255,255) if c or v else (21,24,39,255)
            row.extend(color)
        rows.append(bytes(row))
    raw=b''.join(rows); data=b'\\x89PNG\\r\n\\x1a\n'
    data+=chunk(b'IHDR',struct.pack('>2I5B',n,n,8,6,0,0,0))
    data+=chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
    path.parent.mkdir(parents=True,exist_ok=True); path.write_bytes(data)
icon(root/'icons/icon-192.png',192); icon(root/'icons/icon-512.png',512); icon(root/'icons/icon-maskable-512.png',512)
p=root/'index.html'; s=p.read_text(encoding='utf-8')
s=re.sub(r'<meta name="theme-color" content="[^"]*">','<meta name="theme-color" content="#151827">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<link rel="apple-touch-icon" href="./icons/icon-192.png">',s,count=1)
s=re.sub(r'(<span id="version" class="version">)v[^<]*(</span>)',r'\g<1>v1.3.9\2',s,count=1)
s=s.replace('<p><b>Versión 1.3.5</b></p>','<p><b>Versión 1.3.9</b></p>')
p.write_text(s,encoding='utf-8')
sw='''const CACHE = "control-visitas-1.3.9";
const CORE = ["./","./index.html","./styles.css","./app.js","./manifest.webmanifest","./version.json","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("control-visitas-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  const r=e.request;
  if(r.method!=="GET" || new URL(r.url).origin!==self.location.origin) return;
  e.respondWith(caches.match(r).then(cached => {
    const net=fetch(r).then(response => { if(response && response.ok){const copy=response.clone(); caches.open(CACHE).then(c=>c.put(r,copy));} return response; });
    return cached || net.catch(() => { if(r.mode==="navigate") return caches.match("./index.html"); throw new Error("Recurso no disponible sin conexión"); });
  }));
});
'''
(root/'sw.js').write_text(sw,encoding='utf-8')
version={'version':'1.3.9','name':'Control_Visitas','release_date':'2026-11-24','changes':['Manifiesto PWA completo con identificador, descripción e iconos PNG 192 y 512.','Icono maskable para instalaciones compatibles.','Metadatos de instalación iOS y versión visible unificada.','Service worker con precaché del shell, renovación de caché y fallback de navegación sin conexión.']}
(root/'version.json').write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('PWA actualizada a 1.3.9')
