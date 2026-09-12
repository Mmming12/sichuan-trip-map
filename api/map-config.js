// The JS API key is a browser identifier. The security code never leaves the server.
module.exports = function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).end();
  const key=process.env.AMAP_JSAPI_KEY;
  if(!key||!process.env.AMAP_SECURITY_JSCODE)return res.status(503).json({error:'Map unavailable'});
  return res.status(200).json({key});
};
