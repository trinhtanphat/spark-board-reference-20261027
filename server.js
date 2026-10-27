"use strict";
const http=require("node:http"),fs=require("node:fs"),path=require("node:path");
const root=__dirname,port=Number(process.env.PORT||8788),host=process.env.HOST||"127.0.0.1";
const mime={".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"application/javascript; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".ico":"image/x-icon"};
http.createServer((req,res)=>{let url;try{url=new URL(req.url,"http://localhost")}catch{res.writeHead(400);return res.end("Bad Request")}
const name=url.pathname==="/"?"/index.html":url.pathname;let f=path.resolve(root,"."+decodeURIComponent(name));if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end("Forbidden")}
fs.readFile(f,(err,data)=>{if(err){res.writeHead(404,{"Content-Type":"text/plain"});return res.end("Not Found")}res.writeHead(200,{"Content-Type":mime[path.extname(f)]||"application/octet-stream","Cache-Control":"public,max-age=120","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"});res.end(data)})}).listen(port,host,()=>console.log("SPARK demo listening on http://"+host+":"+port));
