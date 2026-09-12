const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const proxy=require('./api/amap'),configuration=require('./api/map-config');
const source=fs.readFileSync('trip.js','utf8');
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;},status(s){this.statusCode=s;return this;},json(v){this.body=v;return this;},send(v){this.body=v;return this;},end(){return this;}};}
async function run(){
 let click,instances=0,drawn=[],fitted=0;
 const nodes=new Map(),element=()=>({innerHTML:'',disabled:false,addEventListener(){},setAttribute(){},scrollIntoView(){}});
 const document={documentElement:{dataset:{map:'amap'}},getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},querySelectorAll(){return [];},querySelector(){return element();},addEventListener(n,f){if(n==='click')click=f;}};
 const AMap={Map:class{constructor(){instances++;}on(){}clearMap(){drawn=[];}closeInfoWindow(){}setFitView(){fitted++;}setZoomAndCenter(z,ll){assert(ll[0]>100&&ll[1]<40);}},Marker:class{constructor(o){assert(o.position[0]>100&&o.position[1]<40);}on(){}getContent(){return '';}},Pixel:class{},InfoWindow:class{open(){}},Polyline:class{constructor(o){drawn.push(o);}}};
 const ctx=vm.createContext({document,window:{AMap,loadTripAmap:async()=>{}},AMap,URLSearchParams,innerWidth:400});
 vm.runInContext(fs.readFileSync('amap-data.js','utf8'),ctx);vm.runInContext(source,ctx);
 await new Promise(resolve=>setImmediate(resolve));
 for(const tab of ['25','26','27','28','hotels','routes'])click({target:{closest:q=>q==='[data-tab]'?{dataset:{tab}}:null}});
 vm.runInContext("showSavedRoute('sxdMuseum',0);focusPoi('hotelEast');",ctx);
 assert.equal(instances,1);assert(fitted>6);
 assert(drawn.some(p=>p.strokeStyle==='dashed'));assert(drawn.some(p=>p.strokeStyle==='solid'));
 assert(drawn.every(p=>p.path.every(([lng,lat])=>lng>100&&lat<40)));
 assert.match(nodes.get('content').innerHTML,/地图初始化额度/);
 const originalFetch=global.fetch;
 process.env.AMAP_JSAPI_KEY='test-browser-key';process.env.AMAP_SECURITY_JSCODE='test-server-secret';
 let calls=0;
 global.fetch=async url=>{calls++;assert.equal(url.origin,'https://restapi.amap.com');assert.equal(url.searchParams.get('jscode'),'test-server-secret');assert.equal(url.searchParams.get('key'),'test-browser-key');return new Response('{"status":"1"}',{headers:{'content-type':'application/json'}});};
 let res=response();configuration({method:'GET'},res);assert.deepEqual(res.body,{key:'test-browser-key'});
 for(const path of ['https://example.com','v3/place/text','v3/direction/walking','../v3/log/init']){res=response();await proxy({method:'GET',url:'/api/amap?path='+encodeURIComponent(path)+'&key=test-browser-key',headers:{}},res);assert.equal(res.statusCode,404);}
 assert.equal(calls,0);
 res=response();await proxy({method:'GET',url:'/_AMapService/v3/log/init?key=wrong',headers:{}},res);assert.equal(res.statusCode,403);assert.equal(calls,0);
 res=response();await proxy({method:'GET',url:'/_AMapService/v3/log/init?key=test-browser-key&jscode=attacker',headers:{}},res);assert.equal(res.statusCode,200);assert.equal(calls,1);assert(!String(res.body).includes('secret'));
 global.fetch=async()=>new Response('test-server-secret');res=response();await proxy({method:'GET',url:'/api/amap?path=v3/log/init&key=test-browser-key',headers:{}},res);assert.equal(res.statusCode,502);assert(!JSON.stringify(res.body).includes('test-server-secret'));
 global.fetch=async()=>{throw Error('URL containing test-server-secret');};res=response();await proxy({method:'GET',url:'/api/amap?path=v3/log/init&key=test-browser-key',headers:{}},res);assert.equal(res.statusCode,502);assert(!JSON.stringify(res.body).includes('test-server-secret'));
 global.fetch=originalFetch;
 for(const f of ['amap.html','amap-loader.js','trip.js'])assert(!/test-server-secret|securityJsCode\s*:|AMAP_WEB_SERVICE_KEY/.test(fs.readFileSync(f,'utf8')));
 console.log('PASS: one Amap instance across tabs, native GCJ-02 coordinates, saved route lines, proxy allowlist and secret isolation.');
}
run().catch(e=>{console.error(e);process.exitCode=1;});
