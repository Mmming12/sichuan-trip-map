// Only map authentication/styles: this is not a public place-search or routing proxy.
const ENDPOINTS = new Map([
  ['v3/log/init','https://restapi.amap.com/v3/log/init'],
  ['v4/map/styles','https://webapi.amap.com/v4/map/styles'],
  ['v4/map/styles2','https://webapi.amap.com/v4/map/styles2']
]);
module.exports = async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).end();
  const incoming=new URL(req.url,'https://local.invalid');
  const path=incoming.pathname.startsWith('/_AMapService/')?incoming.pathname.slice('/_AMapService/'.length):incoming.searchParams.get('path');
  const endpoint=ENDPOINTS.get(path);
  if(!endpoint)return res.status(404).json({error:'Unsupported map service'});
  const key=process.env.AMAP_JSAPI_KEY,secret=process.env.AMAP_SECURITY_JSCODE;
  if(!key||!secret)return res.status(503).json({error:'Map unavailable'});
  if(incoming.search.length>8192)return res.status(414).end();
  if(incoming.searchParams.get('key')!==key)return res.status(403).end();
  if(req.headers['sec-fetch-site']==='cross-site')return res.status(403).end();
  const upstream=new URL(endpoint);
  upstream.search=incoming.search;
  upstream.searchParams.delete('path');
  upstream.searchParams.set('key',key);
  upstream.searchParams.set('jscode',secret);
  try {
    const response=await fetch(upstream,{redirect:'error',signal:AbortSignal.timeout(15000)});
    const body=Buffer.from(await response.arrayBuffer());
    // Do not forward an upstream diagnostic that echoes the security code.
    if(body.includes(Buffer.from(secret)))return res.status(502).json({error:'Map service unavailable'});
    res.setHeader('Content-Type',response.headers.get('content-type')||'application/octet-stream');
    return res.status(response.status).send(body);
  } catch {
    // Exception URLs can contain credentials: never log or return them.
    return res.status(502).json({error:'Map service unavailable'});
  }
};
