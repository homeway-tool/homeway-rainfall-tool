var DATA = {};
var currentId = null;
var VERSION = "20260703_v15";

function formatNum(v){
  if(v===null || v===undefined || isNaN(v)) return '—';
  return Math.round(Number(v));
}

function esc(s){
  return String(s).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
  });
}

function getIds(){
  return Object.keys(DATA);
}

function weightedRain(id, durationIndex){
  var inputs=document.querySelectorAll('input[data-drain="'+id+'"][data-duration="'+durationIndex+'"]');
  var sum=0;
  var has=false;
  for(var i=0;i<inputs.length;i++){
    var raw=String(inputs[i].value || '').replace(',','.');
    var val=parseFloat(raw);
    if(!isNaN(val)){
      sum += val * parseFloat(inputs[i].getAttribute('data-w'));
      has = true;
    }
  }
  return has ? sum : null;
}

function buildStationInput(id){
  var d=DATA[id];
  var title=d.displayName || ((d.city?d.city+"－":"")+d.name);
  var html='<h2>'+esc(title)+'</h2>';
  html+='<div class="hint">採用雨量站：'+d.stations.map(function(s){
    return esc(s.station)+' '+Math.round(Number(s.weight)*100)+'%';
  }).join('、')+'</div>';

  html+='<div class="table-wrap"><table><thead><tr><th>雨量站</th><th>縣市</th><th>權重</th>';
  for(var i=0;i<d.durations.length;i++){
    html+='<th>'+esc(d.durations[i])+'</th>';
  }
  html+='</tr></thead><tbody>';

  d.stations.forEach(function(s){
    html+='<tr><td>'+esc(s.station)+'</td><td>'+esc(s.city||'')+'</td><td>'+Math.round(Number(s.weight)*100)+'%</td>';
    for(var i=0;i<d.durations.length;i++){
      html+='<td><input inputmode="decimal" data-drain="'+id+'" data-w="'+s.weight+'" data-duration="'+i+'" type="number" step="0.1" aria-label="'+esc(s.station)+' '+esc(d.durations[i])+'雨量"></td>';
    }
    html+='</tr>';
  });

  html+='</tbody></table></div>';
  html+='<div class="actions"><button type="button" onclick="renderResults()">更新結果</button><button type="button" class="secondary" onclick="clearInputs()">清除輸入</button></div>';

  document.getElementById('input-card').innerHTML=html;

  document.querySelectorAll('#input-card input').forEach(function(inp){
    inp.addEventListener('input', renderResults);
    inp.addEventListener('change', renderResults);
  });
}

function buildCompareTable(id){
  var d=DATA[id];
  var title=d.displayName || d.name;
  var html='<h3>'+esc(title)+'｜各延時各重現期距雨量表</h3>';
  html+='<div class="table-wrap"><table class="compare-table"><thead><tr><th>延時</th><th>本次加權雨量</th>';
  d.periods.forEach(function(p){
    html+='<th>'+esc(p.period)+'</th>';
  });
  html+='</tr></thead><tbody>';

  for(var i=0;i<d.durations.length;i++){
    html+='<tr><td>'+esc(d.durations[i])+'</td><td class="my-rain">'+formatNum(weightedRain(id,i))+'</td>';
    d.periods.forEach(function(p){
      html+='<td>'+formatNum(p.values[i])+'</td>';
    });
    html+='</tr>';
  }

  html+='</tbody></table></div>';
  html+='<p class="small">說明：「本次加權雨量」為各雨量站輸入值依權重加權後之雨量；右側重現期距資料由最新 Excel 匯入，數值採四捨五入整數顯示。</p>';
  return html;
}

function renderResults(){
  if(!currentId) return;
  document.getElementById('result-card').innerHTML=buildCompareTable(currentId);
}

function clearInputs(){
  document.querySelectorAll('#input-card input').forEach(function(i){
    i.value='';
  });
  renderResults();
}

function changeDrain(id){
  currentId=id;
  buildStationInput(id);
  renderResults();
}

function init(){
  var sel=document.getElementById('drain-select');
  sel.innerHTML='';
  getIds().forEach(function(id){
    var opt=document.createElement('option');
    opt.value=id;
    var d=DATA[id];
    opt.textContent=d.displayName || ((d.city?d.city+"－":"")+d.name);
    sel.appendChild(opt);
  });

  sel.addEventListener('change',function(){
    changeDrain(this.value);
  });

  var first=getIds()[0];
  if(first){
    sel.value=first;
    changeDrain(first);
  }
}

fetch('data.json?v=20260703_v15').then(function(r){
  return r.json();
}).then(function(json){
  DATA=json;
  init();
}).catch(function(){
  document.getElementById('input-card').innerHTML='<div class="empty-note">資料讀取失敗，請確認 data.json 已上傳至同一個 GitHub Pages 資料夾。</div>';
});
