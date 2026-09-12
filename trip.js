'use strict';
const USE_AMAP=document.documentElement?.dataset.map==='amap';
// Leaflet + timeline, adapted from the trip-map-builder template.
const POIS={
 east:{name:'成都东站',gcj:[30.628779,104.140947],id:'B001C80DL2'},
 sxd:{name:'三星堆站（高铁）',gcj:[30.941362,104.210491],id:'B0J12Z1TA4'},
 museum:{name:'三星堆博物馆',gcj:[31.001439,104.218621],id:'B034600ZUS'},
 hl:{name:'黄龙九寨站',gcj:[32.745215,103.615084],id:'B0KU1SJL8H'},
 mall:{name:'凯德广场·魅力城（餐厅所在商场）',gcj:[30.626668,104.153005],id:'B001C8RAJ9',food:true},
 jiyu:{name:'集渔·泰式海鲜火锅（凯德魅力城店）',gcj:[30.626685,104.153079],id:'B0H1TCIU6I',food:true},
 changhai:{name:'长海',gcj:[33.036228,103.932113],id:'B034500OXN'},
 wucai:{name:'五彩池',gcj:[33.045129,103.933001],id:'B034500OXL'},
 wuhua:{name:'五花海',gcj:[33.159134,103.880726],id:'B0345005D1'},
 shuzheng:{name:'树正群海',gcj:[33.197784,103.896843],id:'B0345006L5'},
 luwei:{name:'芦苇海',gcj:[33.216408,103.910896],id:'B0345004Z8'}
};
const AMAP_DATA=window.AMAP_TRIP_DATA || {pois:{},routes:[]};
Object.assign(POIS,AMAP_DATA.pois);
for(const poi of Object.values(POIS))if(poi.type==='food')poi.food=true;
const TABS=[['overview','总览'],['25','9/25 成都'],['26','9/26 三星堆'],['27','9/27 九寨'],['28','9/28 九寨'],['rail','高铁与接驳'],['food','顺路吃饭'],['hotels','酒店位置'],['routes','高德路线']];
const DAY_POIS={overview:['east','sxd','museum','hl','changhai','wuhua','shuzheng'],25:['eastGate','hotelEast','hotelJian','kaojiang'],26:['east','sxd','museum','hl'],27:['hotelJiu','parkGate','mima','changhai','wucai','shuzheng','luwei'],28:['wuhua'],rail:['east','sxd','museum','hl'],food:['kaojiang','jiyu','mima','nuorilang'],hotels:['hotelEast','hotelJian','eastGate','westGate','hotelJiu','hotelVisitor','parkGate'],routes:['hotelEast','hotelJian','eastGate','westGate','sxdGate','museumGate','hotelJiu','hotelVisitor','parkGate']};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,text)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`;
const poiUrl=p=>'https://www.amap.com/place/'+p.id;
const navLink=name=>link('https://uri.amap.com/search?keyword='+encodeURIComponent(name)+'&view=map&src=tripmap','高德查位置 / 公交');
const note=(title,text)=>`<aside class="notice"><strong>${title}</strong>${text}</aside>`;
function card(meta,title,body,poi,extra=''){return `<article class="card"><div class="meta">${meta}</div><h3>${title}</h3><p>${body}</p>${extra}${poi?`<div class="actions"><button data-poi="${poi}">在图上查看</button>${link(poiUrl(POIS[poi]),'高德查位置 / 公交')}</div>`:''}</article>`;}
function train(title,from,to,start,end,desc){return card('参考车次 · 9/26 开行与余票待 12306 确认',title,desc,null,`<div class="train-grid"><div><strong>${start}</strong><small>${from}</small></div><span>动车 →</span><div><strong>${end}</strong><small>${to}</small></div></div>`);}
let active='overview',returnMode='stay',map,layer,markers={},bounds;
function returnBlock(){return `<section class="card"><div class="meta">返程尚未确定 · 点击比较</div><h3>28 日走，还是多留一晚？</h3><div class="switch"><button data-return="stay" aria-pressed="${returnMode==='stay'}">28 日住沟口 · 推荐</button><button data-return="leave" aria-pressed="${returnMode==='leave'}">28 日离开</button></div><p>${returnMode==='stay'?'保留 28 日完整游览，晚间住沟口；29 日大巴到黄龙九寨站，再乘动车回成都。合计成都 1 晚＋沟口 3 晚，增加一晚约 500 元房费预算。':'28 日约 13:00—14:00 出园、取行李，接已预订的公共大巴和晚间动车。只有半天左右游览，出园时间需按真实大巴倒推；不绑定当晚离蓉航班。'}</p><p>大巴计划抵站与动车开车至少留 60—90 分钟。沟口上车至成都东先留约 5—6 小时；实际班次未确认。</p></section>`;}
function overview(){return `<div class="hero"><img src="jiuzhai.jpg" alt="九寨沟五花海清澈的湖水与群山"><span>把两天时间，留给九寨的水。</span></div><h2>从古蜀，走进山水</h2><p class="intro">9 月 25 日成都集合，26 日三星堆后北上，27—28 日游九寨沟。</p><div class="badges"><span class="badge">2 人 · 1 间房</span><span class="badge">全季优先 · 约 ¥500 / 晚</span><span class="badge">无车 · 公共交通</span></div><div class="route">成都东 → 三星堆 → 黄龙九寨站 → 沟口</div>${note('26 日最关键：公交与动车一起核实','铁路票预计 9/12 开售，具体起售时刻查 12306。列车均为参考表；博物馆回高铁站的公交时刻尚未确认。')}${card('09.25 · 成都','住东站周边，准备轻松出发','乘地铁到酒店集合。以实际可步行到进站口、房费约 500 元为筛选条件，全季保留候选。','east')}${card('09.26 · 广汉 → 阿坝','留约 3.5—4 小时看主展，晚些到沟口','基准查票对象：08:27→08:45 到三星堆，17:32→19:10 北上。预计约 21:45—23:00 入住。','museum')}${card('09.27—28 · 九寨沟','两次入园，分开游两条支沟','每天沟口出入，观光车＋开放栈道；路线可按现场分流互换。门票和观光车按两天分别购买。','wuhua')}${returnBlock()}${note('27 日住宿按现行规定调整','你希望住沟内，但景区 9/5 最新说明仍要求沟外住。当前用沟口同一家酒店连住替代，尚未预订。')}`;}
function day25(){return `<h2>9/25 · 在成都碰头</h2><p class="intro">上海、深圳分别出发，到同一家酒店集合。</p><div class="timeline">${card('落地后 · 地铁','机场 → 成都东周边','天府机场：18 号线→火车南站换 7 号线→成都东客站。双流机场：10 号线→太平园换 7 号线→成都东客站。分别先留约 90—120 / 60—90 分钟，另加下机取行李；晚到须核末班。','east')}${card('入住 · 一间房约 ¥500','全季候选，先核实际步行路线','东广场店到东进站口约 1.56 公里、21 分钟；建材路店到西进站口约 1.73 公里、24 分钟。房价相近时优先比较东广场店，带行李按 30—40 分钟留步行余量。路线见“酒店位置”和“高德路线”页。指定日期房价未核实，不以“东站店”推定就在站内。',null,`<div class="actions">${link('https://m.huazhu.com/Hotel/Detail/6100583','全季建材路店')}${link('https://m.huazhu.com/Hotel/Detail/9001207','全季东广场店')}</div>`)}${card('17:30—19:00 · 可调整','凯德魅力城选一家吃晚饭','烤匠烤鱼或集渔泰式火锅二选一。东广场全季到烤匠的高德步行方案约 443 米、6 分钟，进商场上楼和排队另算。图钉是商场。','mall')}${card('19:00 以后','买早餐、简餐和水','26 日退房带走行李，不留成都酒店。确认博物馆寄存、上午票、双向公交与北上大巴。')}</div>`;}
function day26(){return `<h2>9/26 · 看完古蜀，再向北</h2><p class="intro">无车基准方案。具体列车未确认，时间窗用于倒推。</p>${note('完整参观方案 · 当晚较晚入住','优先核 17:32 北上的参考车次，并核 19:10 到站后的公共大巴。预计 21:45—23:00 入住，途中解决晚餐。')}<div class="timeline">${card('06:45—07:30 · 规划','退房，步行或地铁到成都东','按酒店实际路线调整，争取提前 45—60 分钟到进站区域。','east')}${train('C6372/3 · 优先核查','成都东','三星堆','08:27','08:45','参考 18 分钟；C5666/7 的 08:14→08:56 是另一候选。')}${card('08:45—10:00 · 规划余量','接驳公交 → 博物馆','高德高铁接驳专线方案约 39 分钟，含步行约 620 米，不含候车。出站、候车、寄存和入馆另留余量，争取 09:45—10:00 入馆；不是确认发车表。','museum')}${card('09:45／10:00—13:45 · 含简餐','约 3.5—4 小时看主展','青铜大立人、神树、面具等以实际展出为准；不去广汉市区吃饭。大件寄存需提前向馆方确认。','museum')}${card('13:45—16:30 · 规划','取行李，按确认班次乘公交回站','高德返站专线方案约 39 分钟，含步行约 639 米，不含候车。14:15 是查路线时填写的出发时间，不是公交发车时刻；按现场确认班次乘车，目标 16:30 前到站。','sxd')}${train('C5756/7 · 晚北上基准','三星堆','黄龙九寨','17:32','19:10','参考 1 小时 38 分钟；开行、余票与晚间大巴均待核。')}${card('19:10 以后 · 提前订大巴','黄龙九寨站 → 沟口酒店','在“九旅悦行”选对应公共接驳，车程约 2 小时，集合等车和到酒店另算。目的地选九寨沟沟口，不是黄龙景区。','hl')}</div><details class="card"><summary>14:23 早北上：为什么偏赶？</summary><p>参考 C6366/7 14:23→15:52，需 13:30 前到三星堆站，约 12:00—12:30 结束馆区活动。约 09:45 入馆只能逛 2—2.5 小时，还必须有可接上的公交。</p><p>不能安排 14:00 在博物馆上公交、14:23 乘动车。售票后若出现 15:00—16:30 可衔接的直达车，再优先比较；目前没有确认这种班次。</p></details>`;}
function day27(){return `<h2>9/27 · 长海与树正沟</h2><p class="intro">观光车串联，体力留给短段栈道。车辆分流时可与 28 日互换。</p>${note('08:00 入园为现行旺季参考','先按 07:15—07:30 到入口准备，酒店步行另算。营业、栈道和车辆停靠以当日公告为准。')}<div class="timeline">${card('上午 · 观光车上行','长海 → 五彩池','经诺日朗按指引换乘。看长海观景平台，再到五彩池；不徒步跨越整条则查洼沟。','changhai')}${card('上午 · 开放栈道','五彩池','欣赏水色，之后到指定站点乘观光车。这里是九寨沟五彩池，不是黄龙景区。','wucai')}${card('中午 · 顺路中转','诺日朗餐饮区','快餐或自带简餐，计划 50—80 元/人。结合中转吃饭，餐品和价格现场确认。')}${card('下午 · 车行＋短步行','诺日朗瀑布 → 树正群海','选树正群海附近开放栈道，长距离乘车。芦苇海只在停靠与时间允许时补看。','shuzheng')}${card('约 16:30—17:00 · 争取出园','沟口休息，米玛晚餐候选','米玛藏王广场店已核位置，从全季景区店步行约 104 米、2 分钟；计划 70—100 元/人，当天营业和菜价待核。',null,`<div class="actions">${navLink('九寨沟 藏王广场 米玛餐厅')}</div>`)}</div>${note('27 日晚住沟外','全季九寨沟景区店：华住地址彭丰村 1 组 6 号。高德到景区检票处步行约 1.11 公里、15 分钟；比“游客中心店”的约 1.97 公里、27 分钟更近。房价、入口开放与大巴下客点待核，未预订。')}`;}
function day28(){return `<h2>9/28 · 日则沟的水色</h2><p class="intro">五花海、珍珠滩为重点。当日离开需删减景点。</p>${returnBlock()}<div class="timeline">${card('08:00 起 · 参考入园','观光车进入日则沟','遵从现场分流，不用固定发车分钟数计划园内转场。')}${card('上午 · 重点停留','五花海','给观景拍照留时间，视停靠与体力选择熊猫海等上游景点，不强行徒步整段。','wuhua')}${card('中午—下午 · 按开放情况','珍珠滩与瀑布','沿开放栈道游览，乘车返回诺日朗方向；返程分支缩短游览。')}${card(returnMode==='stay'?'晚间 · 沟口第 3 晚':'约 13:00—14:00 · 出园目标',returnMode==='stay'?'轻松吃晚饭，明天再走':'取行李，搭公共大巴',returnMode==='stay'?'酒店附近吃面或川菜，次日大巴＋动车回成都。':'只有半天左右游览，大巴计划到站距铁路发车至少留 60—90 分钟；班次未定前不承诺赶上离蓉航班。')}</div>`;}
function rail(){return `<h2>高铁与公共接驳</h2><p class="intro">长距离动车，站外公交或景区接驳，没有租车包车安排。</p>${note('参考表 ≠ 指定日期可售车次','9/26 票预计 9/12 开售；9/28 为 9/14，9/29 为 9/15。具体起售时刻查 12306。本次未取得 12306 指定日期实时数据。')}${train('C6372/3 · 去三星堆候选','成都东','三星堆','08:27','08:45','到馆另加候车、公交、寄存和安检；C5666/7 08:14→08:56 为另一候选。')}${train('C5756/7 · 完整参观分支','三星堆','黄龙九寨','17:32','19:10','先核晚间大巴，预计 21:45—23:00 入住。')}${train('C6366/7 · 早到沟口分支','三星堆','黄龙九寨','14:23','15:52','需 13:30 前到站，约 12:00—12:30 结束馆区活动；参观缩短。')}${card('公交 · 关键未确认项','博物馆 ↔ 高铁三星堆站','高德已返回双向高铁接驳专线，均约 39 分钟、含约 600 米步行，参考票价 2 元，不含等车；首末班和具体发车时刻未返回，9/26 运营仍需核实。“三星堆客运站”不等于高铁三星堆站，13 路等线路终点须看清；在建 S11 同名站也不是本次乘车点。','sxd')}${card('大巴 · 九旅悦行','黄龙九寨站 ↔ 沟口','官方参考约 93 公里、2 小时。确认对应列车、发车、集合和下客点；运营咨询 15388452329。列车到站不等于到酒店。','hl')}${card('返程 · 日期待选','先核大巴，再接动车','沟口上车到成都东先留约 5—6 小时；大巴计划抵站与动车留 60—90 分钟。返程尚未开售，不虚构车次。')}${card('购票顺序','下午动车＋大巴 → 上午动车 → 门票与公交','核确实停三星堆站。缺票可查松潘并同时确认松潘大巴；公交接不上先调整班次，出租只作最后备选。',null,`<div class="actions">${link('https://www.12306.cn/','12306')}${link('https://www.liecheba.com/sichuan/sanxingdui.html','参考表来源')}${link('交通安排.md','完整交通安排')}</div>`)}`;}
function food(){return `<h2>顺路吃饭，不为名店绕远</h2><p class="intro">每餐选一家。预算是规划估算，营业、菜单待核；未取得近期大众点评／小红书系统评价。</p>${card('9/25 晚 · 计划 ¥80—110 / 人','烤匠麻辣烤鱼 · 凯德魅力城','烤鱼配蔬菜，口味偏辣。万科路 9 号商场 4 楼 403—404。酒店步行顺路才去；位置已经用高德接口核对。','kaojiang')}${card('9/25 晚备选 · 计划 ¥90—130 / 人','集渔 · 凯德魅力城','泰式海鲜火锅，同商场 4 楼，与烤匠二选一。只核到地址，不能据此保证品质或实时营业。','jiyu')}${card('9/26 午 · 计划 ¥30—50 / 人','自备简餐，馆内顺路补充','25 晚买好，在允许就餐处吃。堆堆堆咖啡馆可作休息候选，饮品另留约 25—45 元/人，不替代午饭。','museum')}${card('9/26 晚 · 计划 ¥30—60 / 人','上动车前准备好晚餐','入住可能近 23:00，不预约正餐，不依赖沟口深夜营业。')}${card('9/27—28 午 · 计划 ¥50—80 / 人','诺日朗游客服务中心餐饮区','配合观光车中转，快餐或自带食物。高德已核到诺日朗旅游服务中心位置，现场按餐饮区指引进入。','nuorilang',`<div class="actions">${navLink('九寨沟 诺日朗游客服务中心')}${link('https://www.jiuzhai.com/news/scenic-news/9621-2024-05-05-09-23-54','官方餐饮介绍')}</div>`)}${card('9/27 晚 · 计划 ¥70—100 / 人','米玛 Mima · 藏王广场候选','牦牛肉火锅／牛肉盖被、青稞饼。2025 年报道能佐证店名菜品，高德已核到藏王广场门店位置；出行日营业及菜价仍需复核。','mima',`<div class="actions">${navLink('九寨沟 藏王广场 米玛餐厅')}${link('https://www.tibet.cn/cn/news/zcdt/202508/t20250804_7835502.html','公开报道')}</div>`)}${note('餐厅跟着公共交通走','不去广汉市区专程吃饭，不把华美胜地同名分店当成沟口店。26 日行李全程随行，公交和铁路优先。')}`;}
// Approximate GCJ-02 inverse for WGS84 tiles. Navigation uses original Amap POI IDs.
function toWgs([lat,lng]){const x=lng-105,y=lat-35,p=Math.PI;let a=-100+2*x+3*y+.2*y*y+.1*x*y+.2*Math.sqrt(Math.abs(x)),b=300+x+2*y+.1*x*x+.1*x*y+.1*Math.sqrt(Math.abs(x));a+=(20*Math.sin(6*x*p)+20*Math.sin(2*x*p))*2/3+(20*Math.sin(y*p)+40*Math.sin(y/3*p))*2/3+(160*Math.sin(y/12*p)+320*Math.sin(y*p/30))*2/3;b+=(20*Math.sin(6*x*p)+20*Math.sin(2*x*p))*2/3+(20*Math.sin(x*p)+40*Math.sin(x/3*p))*2/3+(150*Math.sin(x/12*p)+300*Math.sin(x/30*p))*2/3;const rad=lat*p/180,m=1-.006693421622965943*Math.sin(rad)**2;return [lat-a*180/((6378245*(1-.006693421622965943)/(m*Math.sqrt(m)))*p),lng-b*180/((6378245/Math.sqrt(m))*Math.cos(rad)*p)];}
function mapPoint(gcj){return USE_AMAP?[gcj[1],gcj[0]]:toWgs(gcj);}
function addMarker(key,i){
 const p=POIS[key],ll=mapPoint(p.gcj),html=`<button class="marker-dot ${p.food?'food':''}" aria-label="${esc(p.name)}">${esc(i)}</button>`;
 const popup=`<b>${esc(p.name)}</b><br>参考位置 · ${link(poiUrl(p),'高德查公交 / 导航')}`;
 if(USE_AMAP){
  const marker=new AMap.Marker({position:ll,content:html,anchor:'center',title:p.name,map});
  marker.openPopup=()=>{map.clearInfoWindow();new AMap.InfoWindow({content:popup,offset:new AMap.Pixel(0,-18)}).open(map,ll);};
  marker.on('click',marker.openPopup);
  const button=marker.getContent();if(button?.addEventListener)button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();marker.openPopup();}});
  return marker;
 }
 const icon=L.divIcon({className:'',html,iconSize:[30,30],iconAnchor:[15,15]});
 return L.marker(ll,{icon,alt:p.name}).bindPopup(popup).addTo(layer);
}
function clearMap(){if(USE_AMAP){map.clearInfoWindow();map.clearMap();}else layer.clearLayers();markers={};}
function drawMap(){if(!map)return;document.querySelector('.map-note span').textContent='地点示意 · 点击图钉查看';clearMap();bounds=DAY_POIS[active].map((key,i)=>{markers[key]=addMarker(key,i+1);return mapPoint(POIS[key].gcj);});fit();}
function fit(){if(map&&bounds?.length){if(USE_AMAP)map.setFitView(null,true,[35,35,35,35],14);else map.fitBounds(bounds,{padding:[35,35],maxZoom:14});}}
function focusPoi(key){markers[key]??=addMarker(key,'•');if(USE_AMAP)map.setZoomAndCenter(14,mapPoint(POIS[key].gcj));else map.setView(mapPoint(POIS[key].gcj),14);markers[key].openPopup();}
function render(){document.querySelectorAll('#tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tab===active)));document.getElementById('content').innerHTML=({overview,25:day25,26:day26,27:day27,28:day28,rail,food,hotels:hotelsView,routes:routesView}[active])();drawMap();}
document.getElementById('tabs').innerHTML=TABS.map(([id,label])=>`<button data-tab="${id}" aria-pressed="false">${label}</button>`).join('');
document.addEventListener('click',e=>{const routeButton=e.target.closest('[data-route]');if(routeButton){showSavedRoute(routeButton.dataset.route,Number(routeButton.dataset.plan));return;}const tab=e.target.closest('[data-tab]'),ret=e.target.closest('[data-return]'),poi=e.target.closest('[data-poi]');if(tab){active=tab.dataset.tab;render();}if(ret){returnMode=ret.dataset.return;render();}if(poi&&map){const key=poi.dataset.poi;focusPoi(key);if(innerWidth<=850)document.querySelector('.map-panel').scrollIntoView({block:'start'});}});
document.getElementById('fit').addEventListener('click',fit);
if(USE_AMAP){
 document.getElementById('fit').disabled=true;
 window.loadTripAmap().then(()=>{
  document.getElementById('map').innerHTML='';
  map=new AMap.Map('map',{center:[104,32],zoom:7,viewMode:'2D',scrollWheel:false});
  document.getElementById('fit').disabled=false;
  map.on('complete',()=>{document.querySelector('.map-panel .fine').textContent='高德底图 · 已保存的行程路线；铁路与景区接驳班次另查运营方。';});
  drawMap();
 }).catch(()=>{
  document.getElementById('map').innerHTML='<p>高德地图暂时无法加载，文字行程和路线步骤仍可查看。<br><a href="index.html">打开原版地图</a>，或使用卡片中的高德导航。</p>';
 });
}else if(window.L){document.getElementById('map').innerHTML='';map=L.map('map',{scrollWheelZoom:false}).setView([32,104],7);let errors=0;L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'}).on('tileerror',()=>{if(++errors===3)document.querySelector('.map-panel .fine').textContent='底图暂时无法加载，图钉和行程仍可使用；打开高德查看实际地图与公共交通。';}).addTo(map);layer=L.layerGroup().addTo(map);}else{document.getElementById('map').innerHTML='<p>地图组件暂不可用，请用行程卡片里的高德链接查看位置。</p>';document.getElementById('fit').disabled=true;}
function km(m){return m==null?'距离未提供':m<1000?`${Math.round(m)} 米`:`${(m/1000).toFixed(1)} 公里`;}
function minutes(seconds){return seconds==null?'耗时未提供':`约 ${Math.max(1,Math.ceil(seconds/60))} 分钟`;}
function routeLink(r){const a=POIS[r.from],b=POIS[r.to];const q=new URLSearchParams({from:`${a.gcj[1]},${a.gcj[0]},${a.name}`,to:`${b.gcj[1]},${b.gcj[0]},${b.name}`,mode:r.mode==='walking'?'walk':'bus',coordinate:'gaode',callnative:'1',src:'tripmap'});return link('https://uri.amap.com/navigation?'+q,'在高德重新查路线');}
function routeCard(r){
 const a=POIS[r.from],b=POIS[r.to];if(!a||!b)return '';
 const dates=r.queriedAt?new Date(r.queriedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false}):'尚未查询';
 const options=r.plans.map((p,i)=>`<div class="saved-plan"><h4>方案 ${i+1} · ${minutes(p.duration)}</h4><p>${km(p.distance)}${p.walkingDistance!=null?` · 其中步行 ${km(p.walkingDistance)}`:''}${p.cost!=null?` · 参考票价 ¥${p.cost}`:''}</p><div class="actions">${p.steps.some(s=>s.points.length)?`<button data-route="${r.id}" data-plan="${i}">查看路线图</button>`:''}${routeLink(r)}</div><details><summary>展开步行／乘车步骤</summary><ol>${p.steps.map(s=>`<li>${esc(s.text)}${s.distance!=null?` <span class="fine">${km(s.distance)}</span>`:''}</li>`).join('')||'<li>接口未提供详细步骤，请在高德复核。</li>'}</ol></details></div>`).join('');
 const missing={not_queried:'这段尚未查询，先用高德导航入口查看。',no_route:'此次接口未返回方案，不代表现场一定没有公交；景区专线需向运营方核实。',error:'接口本次查询未成功，未用估算路线替代。'};
 return `<article class="card"><div class="meta">${esc(r.area)} · ${r.mode==='walking'?'步行':'公交换乘'} · 查询结果已保存</div><h3>${esc(a.name)} → ${esc(b.name)}</h3><p class="fine">查询时间：${dates}${r.mode==='transit'?`；请求出发时间：${esc(r.departure)}`:''}。${r.mode==='walking'?'步行耗时为模型估计，拖行李、过街及安检另留余量。':'本次约 39 分钟不含候车；接口未返回首末班或具体发车时刻。请求时间不是公交班次，不代表 9/26 运营已确认；建议另留 20—30 分钟候车余量，实际可能更久。'}</p>${options||`<p>${missing[r.status]||'尚无保存结果。'}</p><div class="actions">${routeLink(r)}</div>`}</article>`;
}
function routesView(){return `<h2>高德查过的路线</h2><p class="intro">提前查好，途中随时看。这里展示保存时的结果；路线不随页面访问重新查询。${USE_AMAP?'高德底图加载会使用地图初始化额度。':'本版底图不使用高德 API。'}</p><div class="route-legend"><span>━ 公交线路</span><span>┄ 步行路段</span></div>${note('交通边界','这里补齐酒店、进站口与博物馆的地面交通。高铁班次和九旅悦行景区大巴仍按原行程分别核实，不用地图算路代替车票。')}<label for="route-area">查看区域</label><select id="route-area" onchange="filterRoutes(this.value)"><option value="all">全部区域</option><option>成都</option><option>三星堆</option><option>九寨沟</option></select><div id="saved-routes">${AMAP_DATA.routes.map(routeCard).join('')}</div>`;}
function filterRoutes(area){document.getElementById('saved-routes').innerHTML=AMAP_DATA.routes.filter(r=>area==='all'||r.area===area).map(routeCard).join('');}
function hotelsView(){return `<h2>酒店位置与步行比较</h2><p class="intro">门店与地址已由高德查询核对；路线耗时为模型估计。房价、房态和预订尚未确认。</p>${['hotelEast','hotelJian','hotelJiu','hotelVisitor'].map(key=>{const p=POIS[key];if(!p)return '';const r=AMAP_DATA.routes.filter(r=>r.from===key&&['eastGate','westGate','parkGate'].includes(r.to)&&r.status==='ok').sort((a,b)=>(a.plans[0].distance??Infinity)-(b.plans[0].distance??Infinity));const best=r[0];return card('全季候选 · 一间房约 ¥500 / 晚',esc(p.name),esc(p.address),key,`${best?`<p><b>已查询入口中较短的步行方案：</b>${esc(POIS[best.to].name)}，${km(best.plans[0].distance)}，${minutes(best.plans[0].duration)}。进站口／检票处开放情况出行前再核。</p><div class="actions"><button data-route="${best.id}" data-plan="0">看步行路线</button>${routeLink(best)}</div>`:'<p>步行路线尚未取得，不按店名推断距离。</p>'}`);}).join('')}${note('怎么选','两家成都店比较早晨带行李步行的总时间；沟口酒店比较每天到检票处的步行路程。更短的路线不代表房价更低，也不代表当天入口一定开放。')}`;}
function showSavedRoute(id,index){
 const r=AMAP_DATA.routes.find(r=>r.id===id),p=r?.plans[index];if(!p)return;
 if(!map){alert('底图暂不可用，路线步骤仍可阅读，也可以在高德重新查询。');return;}
 clearMap();bounds=[];
 for(const key of [r.from,r.to]){markers[key]=addMarker(key,key===r.from?'起':'终');bounds.push(mapPoint(POIS[key].gcj));}
 for(const step of p.steps){if(step.points.length<2)continue;const pts=step.points.map(mapPoint),walking=step.mode==='walking';if(USE_AMAP)new AMap.Polyline({map,path:pts,strokeColor:walking?'#916121':'#126f73',strokeWeight:5,strokeOpacity:.85,strokeStyle:walking?'dashed':'solid',strokeDasharray:[6,7]});else L.polyline(pts,{color:walking?'#916121':'#126f73',weight:5,opacity:.85,dashArray:walking?'6 7':null}).addTo(layer);bounds.push(...pts);}
 fit();document.querySelector('.map-note span').textContent=`${r.mode==='walking'?'步行':'公交'}方案 ${index+1} · ${minutes(p.duration)} · 高德保存结果`;
 if(innerWidth<=850)document.querySelector('.map-panel').scrollIntoView({block:'start'});
}
render();
