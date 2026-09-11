"""Offline parser checks; no API calls."""
import importlib.util
from pathlib import Path
spec=importlib.util.spec_from_file_location('refresh',Path(__file__).with_name('refresh-amap.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assert m.normalize({'status':'0','infocode':'10003'},'transit')['status']=='error'
assert m.normalize({'status':'1','route':{'transits':[]}},'transit')['status']=='no_route'
assert m.number([]) is None and m.number('bad') is None and m.number('0')==0
assert m.line('invalid;200,200;104,31')==[]
walk=m.normalize({'status':'1','route':{'paths':[{'distance':'100','duration':'80','steps':[{'instruction':'walk','polyline':'104,31;104.001,31.001'}]}]}},'walking')
assert walk['plans'][0]['duration']==80 and len(walk['plans'][0]['steps'][0]['points'])==2
transit=m.normalize({'status':'1','route':{'transits':[{'cost':'2','walking_distance':'10','segments':[{'bus':{'buslines':[{'name':'A','departure_stop':{'name':'start'},'arrival_stop':{'name':'end'},'polyline':'104,31;104.001,31.001'},{'name':'alternative'}]}}]}]}},'transit')
assert len(transit['plans'][0]['steps'])==1, 'alternative lines must not be joined into one itinerary'
print('PASS: no-route/error separation, numeric missing values, geometry, walking and bus alternatives.')
