'use strict';
// Minimal dependency-free server. Explicit allowlist prevents exposure of .git, logs or files from the workstation.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,port=Number(process.env.PORT||8788),host=process.env.HOST||'127.0.0.1';
const files=Object.freeze({'/':'index.html','/index.html':'index.html','/styles.css':'styles.css','/app.js':'app.js','/route-explorer.js':'route-explorer.js','/scene3d.js':'scene3d.js','/nvidia-product.mjs':'nvidia-product.mjs','/vera-rubin-concept.mjs':'vera-rubin-concept.mjs','/vera-rubin-rack.mjs':'vera-rubin-rack.mjs','/nvidia-rack-spec.mjs':'nvidia-rack-spec.mjs','/data-center-model.mjs':'data-center-model.mjs','/data-center-scene.mjs':'data-center-scene.mjs','/data-center-ui.js':'data-center-ui.js','/routing/visual-routing.mjs':'routing/visual-routing.mjs','/routing/visual-export.mjs':'routing/visual-export.mjs','/vendor/three.core.js':'vendor/three.core.js','/vendor/three.module.js':'vendor/three.module.js','/favicon.svg':'favicon.svg'});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.mjs':'application/javascript; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
 const headers={'Cache-Control':'public, max-age=120','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"};
 const done=(status,body='')=>{res.writeHead(status,{...headers,'Content-Type':'text/plain; charset=utf-8'});res.end(req.method==='HEAD'?'':body)};
 if(!['GET','HEAD'].includes(req.method))return done(405,'Method Not Allowed');
 let pathname;try{pathname=new URL(req.url,'http://localhost').pathname}catch{return done(400,'Bad Request')}
 if(!Object.hasOwn(files,pathname))return done(404,'Not Found');
 const f=path.join(root,files[pathname]);
 fs.readFile(f,(err,data)=>{if(err)return done(404,'Not Found');res.writeHead(200,{...headers,'Content-Type':mime[path.extname(f)]||'application/octet-stream'});res.end(req.method==='HEAD'?'':data)});
}).listen(port,host,()=>console.log('SPARK demo listening on http://'+host+':'+port));