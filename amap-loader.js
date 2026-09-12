'use strict';
// One SDK load per page; tab changes only replace overlays.
window.loadTripAmap = async function () {
  const response = await fetch('/api/map-config', {cache:'no-store'});
  if (!response.ok) throw new Error('地图配置暂不可用');
  const config = await response.json();
  if (!/^[a-f0-9]{32}$/i.test(config.key)) throw new Error('地图配置无效');
  window._AMapSecurityConfig = {serviceHost:location.origin+'/_AMapService'};
  await new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='https://webapi.amap.com/maps?v=2.0&key='+encodeURIComponent(config.key);
    const timeout=setTimeout(()=>reject(new Error('高德地图加载超时')),20000);
    script.onload=()=>{clearTimeout(timeout);window.AMap?resolve():reject(new Error('高德地图加载失败'));};
    script.onerror=()=>{clearTimeout(timeout);reject(new Error('高德地图连接失败'));};
    document.head.appendChild(script);
  });
};
