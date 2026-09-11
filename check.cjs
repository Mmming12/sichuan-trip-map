const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('trip.js','utf8');
// Exercise the non-map fallback and the real click handlers without a browser.
const nodes=new Map();let click;
const element=()=>({innerHTML:'',disabled:false,addEventListener(){},setAttribute(){}});
const document={getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},querySelectorAll(){return [];},querySelector(){return {textContent:'',scrollIntoView(){}};},addEventListener(name,fn){if(name==='click')click=fn;}};
const ctx=vm.createContext({document,window:{},console,URLSearchParams,innerWidth:1000});
vm.runInContext(fs.readFileSync('amap-data.js','utf8'),ctx);vm.runInContext(source,ctx);
assert.match(nodes.get('map').innerHTML,/地图组件暂不可用/);
for(const tab of ['overview','25','26','27','28','rail','food','hotels','routes']){
 click({target:{closest(q){return q==='[data-tab]'?{dataset:{tab}}:null;}}});
 const html=nodes.get('content').innerHTML;
 assert(html.includes('<h2>'));assert(!/undefined|Tokyo|Hotel Name/.test(html));
}
click({target:{closest(q){return q==='[data-tab]'?{dataset:{tab:'28'}}:null;}}});
click({target:{closest(q){return q==='[data-return]'?{dataset:{return:'leave'}}:null;}}});
assert.match(nodes.get('content').innerHTML,/取行李，搭公共大巴/);
click({target:{closest(q){return q==='[data-return]'?{dataset:{return:'stay'}}:null;}}});
assert.match(nodes.get('content').innerHTML,/轻松吃晚饭，明天再走/);
assert.equal(ctx.window.AMAP_TRIP_DATA.browserApiCalls,false);
assert.equal(ctx.window.AMAP_TRIP_DATA.routes.filter(r=>r.status==='ok').length,10);
vm.runInContext(`
if(!routesView().includes('39 分钟'))throw Error('Saved transit duration missing');
if(!hotelsView().includes('21 分钟'))throw Error('Hotel comparison missing');
filterRoutes('三星堆');
if(document.getElementById('saved-routes').innerHTML.includes('东广场店'))throw Error('Region filter failed');
let drawn=[];
map={fitBounds(){},setView(){}};layer={clearLayers(){}};
L={divIcon(x){return x;},marker(){return {bindPopup(){return this;},addTo(){return this;}};},polyline(points,options){drawn.push({points,options});return {addTo(){}};}};
showSavedRoute('sxdMuseum',0);
if(!drawn.some(x=>x.options.dashArray)||!drawn.some(x=>!x.options.dashArray))throw Error('Walk and transit segments not distinguished');
if(drawn.some(x=>x.points.some(p=>!p.every(Number.isFinite))))throw Error('Invalid route geometry');
`,ctx);
vm.runInContext(`for(const keys of Object.values(DAY_POIS))for(const key of keys){if(!POIS[key])throw Error(key);const p=toWgs(POIS[key].gcj);if(!p.every(Number.isFinite)||Math.abs(p[0]-POIS[key].gcj[0])>.02||Math.abs(p[1]-POIS[key].gcj[1])>.02)throw Error('coordinate out of range');}`,ctx);
for(const name of ['index.html','sources.html']){
 for(const match of fs.readFileSync(''+name,'utf8').matchAll(/(?:href|src)="([^"]+)"/g)){
  const target=match[1];if(!/^(https?:|#)/.test(target))assert(fs.existsSync(''+target),target);
 }
}
assert(!/restapi\.amap\.com|securityJsCode|AMAP_WEB_SERVICE_KEY/.test(source));
console.log('PASS: 9 views, return switching, map fallback, saved route filtering/rendering, coordinates, local assets, no browser API calls.');
