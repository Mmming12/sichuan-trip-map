"""Build public trip data from local Amap responses. No network unless --fetch is set."""
from pathlib import Path
from datetime import datetime, timezone
from urllib.request import urlopen
from urllib.parse import urlencode
import argparse, json, time

ROOT = Path(__file__).resolve().parent.parent
PRIVATE = Path.home() / '.trip-map-builder'
CACHE = PRIVATE / 'amap-research'
# IDs were reviewed against the store address, not blindly selected from search rank.
SELECTED = {
 'hotelEast': ('hotel_east', 'B0FFKPVHKS', 'hotel'),
 'hotelJian': ('hotel_east', 'B0FFIHK77N', 'hotel'),
 'hotelJiu': ('hotel_jiu', 'B0I14HBTAP', 'hotel'),
 'hotelVisitor': ('hotel_jiu', 'B0L2XAXW7L', 'hotel'),
 'eastGate': ('east_gate', 'B001C8S9AY', 'transport'),
 'westGate': ('west_gate', 'B001C8S9AX', 'transport'),
 'sxdGate': ('sxd_station', 'B0J0FZOU9T', 'transport'),
 'museumGate': ('museum_gate', 'B0FFGAVHIP', 'spot'),
 'parkGate': ('park', 'B0FFFDM0T4', 'spot'),
 'mima': ('mima', 'B0K3BZQRTE', 'food'),
 'nuorilang': ('nuorilang', 'B03450077D', 'food'),
 'kaojiang': ('kaojiang', 'B0HROCKKPK', 'food'),
}
PLAN = [
 ('eastHotelEastGate','hotelEast','eastGate','walking','成都','2026-09-26','06:45'),
 ('eastHotelWestGate','hotelEast','westGate','walking','成都','2026-09-26','06:45'),
 ('jianHotelWestGate','hotelJian','westGate','walking','成都','2026-09-26','06:45'),
 ('jianHotelEastGate','hotelJian','eastGate','walking','成都','2026-09-26','06:45'),
 ('hotelDinner','hotelEast','kaojiang','walking','成都','2026-09-25','17:30'),
 ('sxdMuseum','sxdGate','museumGate','transit','三星堆','2026-09-26','09:00'),
 ('museumSxd','museumGate','sxdGate','transit','三星堆','2026-09-26','14:15'),
 ('jiuHotelGate','hotelJiu','parkGate','walking','九寨沟','2026-09-27','07:00'),
 ('visitorHotelGate','hotelVisitor','parkGate','walking','九寨沟','2026-09-27','07:00'),
 ('jiuHotelDinner','hotelJiu','mima','walking','九寨沟','2026-09-27','18:00'),
]

def number(value):
    try:
        n=float(value)
        return n if n >= 0 and n < 10**9 else None
    except (ValueError,TypeError): return None

def text(value): return value if isinstance(value,str) else ''

def line(raw):
    points=[]
    for pair in text(raw).split(';'):
        try:
            lng,lat=map(float,pair.split(','))
            if 70 <= lng <= 140 and 0 <= lat <= 60: points.append([lat,lng])
        except (ValueError,TypeError): pass
    return points if len(points)>1 else []

def walking_steps(steps):
    return [{'mode':'walking','text':text(s.get('instruction')),
             'distance':number(s.get('distance')),'points':line(s.get('polyline'))}
            for s in steps if isinstance(s,dict)]

def normalize(raw,mode):
    if raw.get('status') != '1':
        return {'status':'error','errorCode':text(raw.get('infocode')),'plans':[]}
    route=raw.get('route') or {}
    plans=[]
    for p in (route.get('paths' if mode=='walking' else 'transits') or [])[:3]:
        steps=[]
        if mode=='walking': steps=walking_steps(p.get('steps') or [])
        else:
            for s in p.get('segments') or []:
                w=s.get('walking') or {}
                if isinstance(w,dict): steps.extend(walking_steps(w.get('steps') or []))
                # Parallel buslines are alternatives, not sequential rides.
                for bus in ((s.get('bus') or {}).get('buslines') or [])[:1]:
                    start=bus.get('departure_stop') or {}; end=bus.get('arrival_stop') or {}
                    stops=number(bus.get('via_num'))
                    description=text(bus.get('name'))+'：'+text(start.get('name'))+' → '+text(end.get('name'))
                    if stops is not None: description+=('（接口未列中间停站）' if stops==0 else '（途经 '+str(int(stops))+' 站）')
                    steps.append({'mode':'transit','text':description,'distance':number(bus.get('distance')),'points':line(bus.get('polyline'))})
                rail=s.get('railway') or {}
                if isinstance(rail,dict) and rail.get('name'):
                    steps.append({'mode':'rail','text':text(rail.get('name'))+'（高德参考方案，车次与余票须另查 12306）','distance':number(rail.get('distance')),'points':[]})
        plans.append({'distance':number(p.get('distance')),'duration':number(p.get('duration')),
                      'walkingDistance':number(p.get('walking_distance')),
                      'cost':number(p.get('cost')),'steps':steps})
    return {'status':'ok' if plans else 'no_route','plans':plans}

def stamp(path):
    return datetime.fromtimestamp(path.stat().st_mtime,timezone.utc).isoformat(timespec='seconds')

def selected_pois():
    result={}
    for key,(filename,ident,kind) in SELECTED.items():
        file=CACHE/(filename+'.json')
        data=json.loads(file.read_text(encoding='utf-8'))
        matches=[p for p in data.get('pois',[]) if p.get('id')==ident]
        if len(matches)!=1: raise ValueError('Reviewed POI unavailable: '+key)
        p=matches[0];lng,lat=map(float,p['location'].split(','))
        if not (102<lng<106 and 30<lat<34): raise ValueError('POI outside trip area: '+key)
        result[key]={'id':ident,'name':p['name'],'address':text(p.get('address')),
                     'gcj':[lat,lng],'citycode':text(p.get('citycode')),'type':kind,'queriedAt':stamp(file)}
    return result

def read_key():
    values={}
    for row in (PRIVATE/'amap.env').read_text(encoding='utf-8-sig').splitlines():
        if '=' in row and not row.lstrip().startswith('#'):
            k,v=row.split('=',1);values[k.strip()]=v.strip().strip('"').strip("'")
    key=values.get('AMAP_WEB_SERVICE_KEY','')
    if not key: raise ValueError('AMAP_WEB_SERVICE_KEY is not configured')
    return key

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fetch',action='store_true',help='Fetch missing routes only; consumes the configured API quota')
    parser.add_argument('--max-requests',type=int,default=10)
    args=parser.parse_args()
    if not 1<=args.max_requests<=20: parser.error('max-requests must be 1..20')
    pois=selected_pois(); key=read_key() if args.fetch else None; routes=[];requests_made=0
    for ident,start,end,mode,area,date,at in PLAN:
        cache=CACHE/('route_'+ident+'.json')
        if args.fetch and not cache.exists() and requests_made<args.max_requests:
            params={'origin':','.join(map(str,pois[start]['gcj'][::-1])),
                    'destination':','.join(map(str,pois[end]['gcj'][::-1])),'key':key}
            endpoint='v3/direction/walking'
            if mode=='transit':
                endpoint='v3/direction/transit/integrated'
                params.update(city=pois[start]['citycode'],cityd=pois[end]['citycode'],strategy=2,date=date,time=at,extensions='all')
            time.sleep(1.1)
            requests_made+=1
            # Never print HTTP exceptions or URLs: they contain the key.
            try:
                with urlopen('https://restapi.amap.com/'+endpoint+'?'+urlencode(params),timeout=25) as response:
                    raw=json.load(response)
                serialized=json.dumps(raw,ensure_ascii=False)
                if key in serialized: raise ValueError('Response contained a credential')
                cache.write_text(serialized,encoding='utf-8')
            except Exception:
                print('Request failed for '+ident+'; stopped without retrying.')
                break
            if raw.get('status')!='1':
                print('API error for '+ident+' ('+text(raw.get('infocode'))+'); stopped without retrying.')
                break
    for ident,start,end,mode,area,date,at in PLAN:
        cache=CACHE/('route_'+ident+'.json')
        result=normalize(json.loads(cache.read_text(encoding='utf-8')),mode) if cache.exists() else {'status':'not_queried','plans':[]}
        routes.append({'id':ident,'from':start,'to':end,'mode':mode,'area':area,
                       'departure':date+' '+at,'queriedAt':stamp(cache) if cache.exists() else None,**result})
    payload={'source':'高德 Web 服务 API','generatedAt':datetime.now(timezone.utc).isoformat(timespec='seconds'),
             'pois':pois,'routes':routes,'browserApiCalls':False}
    encoded=json.dumps(payload,ensure_ascii=False,indent=2).replace('<','\\u003c')
    if key and key in encoded: raise ValueError('Credential found in export')
    (ROOT/'amap-data.js').write_text('window.AMAP_TRIP_DATA = '+encoded+';\n',encoding='utf-8')
    print('Exported '+str(len(pois))+' reviewed POIs; '+str(sum(r['status']=='ok' for r in routes))+' saved routes. New requests: '+str(requests_made))

if __name__=='__main__': main()
