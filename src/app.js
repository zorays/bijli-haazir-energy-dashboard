import {MODES,DEFAULT_ECONOMICS,makeDemoTransactions,calculateNetwork,calculateCarImpact,calculateRiderImpact,formatPKR,formatKwh,exportCsv} from './model.js';

const allRows=makeDemoTransactions(30);
const $=(id)=>document.getElementById(id);
const state={days:30,mode:'all',view:'network',prices:{...DEFAULT_ECONOMICS},solarShare:0,displacement:100,km:100000};
const fmt=(n)=>Math.round(n).toLocaleString('en-PK');
const signed=(n,unit='')=>(n<0?'−':'')+Math.abs(n).toFixed(1)+unit;
const pct=(n,digits=1)=>(100*n).toFixed(digits)+'%';
const number=(n,digits=0)=>Number(n).toLocaleString('en-PK',{maximumFractionDigits:digits});
function activeRows(){
  const earliest=allRows[allRows.length-(state.days*MODES.length)].date;
  return allRows.filter(r=>r.date>=earliest&&(state.mode==='all'||r.mode===state.mode));
}
const co2Car=()=>calculateCarImpact({km:state.km,solarShare:state.solarShare/100,displacement:state.displacement/100});
const co2Rider=()=>calculateRiderImpact({solarShare:state.solarShare/100,displacement:state.displacement/100});
function setText(id,val){$(id).textContent=val;}
function progressBar(items){
  let x=0;return items.map(it=>{const start=x;x+=it.share*100;return `<span title="${it.label}: ${pct(it.share)}" style="width:${it.share*100}%;background:${it.color}"></span>`}).join('');
}
function showView(view){
  state.view=view;
  document.querySelectorAll('[data-view]').forEach(el=>{
    const active=el.dataset.view===view;
    el.classList.toggle('active',active);el.setAttribute('aria-selected',active);
  });
  document.querySelectorAll('.view-panel').forEach(panel=>panel.hidden=panel.id!=='view-'+view);
  render();
}
function dailyChart(rows){
  const dates=[...new Set(rows.map(r=>r.date))].sort();
  const data=dates.map(date=>{
    const group=rows.filter(r=>r.date===date);return {date,solar:group.reduce((a,r)=>a+r.solar_kwh,0),grid:group.reduce((a,r)=>a+r.grid_kwh,0),delivered:group.reduce((a,r)=>a+r.delivered_kwh,0)};
  });
  const max=Math.max(1,...data.map(x=>x.solar+x.grid))*1.15;
  const W=920,H=250,pad=36,plotW=W-pad*2,plotH=H-50;
  const slot=plotW/data.length,bw=Math.min(22,slot*0.56);
  let parts=`<svg role="img" aria-label="Stacked bar chart showing simulated daily solar and grid electricity input in kilowatt-hours" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
  for(let k=0;k<=4;k++){
    const y=14+plotH*(1-k/4);
    parts+=`<line x1="${pad}" y1="${y}" x2="${W-pad}" y2="${y}" stroke="#264452" stroke-dasharray="3 6"/><text x="1" y="${y+4}" fill="#829cad" font-size="11">${Math.round(max*k/4)}</text>`;
  }
  data.forEach((d,i)=>{
    const x=pad+i*slot+(slot-bw)/2;
    const solH=d.solar/max*plotH,gridH=d.grid/max*plotH;
    const y=14+plotH;
    parts+=`<rect x="${x}" y="${y-solH}" width="${bw}" height="${solH}" rx="2" fill="#20cde5"><title>${d.date}: solar ${Math.round(d.solar)} kWh</title></rect>`;
    parts+=`<rect x="${x}" y="${y-solH-gridH}" width="${bw}" height="${gridH}" rx="2" fill="#fbd03f"><title>${d.date}: grid ${Math.round(d.grid)} kWh</title></rect>`;
    if(i===0||i===data.length-1||i%Math.max(1,Math.ceil(data.length/7))===0)parts+=`<text x="${x+bw/2}" y="${H-9}" text-anchor="middle" fill="#839eb0" font-size="11">${d.date.slice(5)}</text>`;
  });
  return parts+'</svg>';
}
function renderNetwork(){
  const rows=activeRows(),n=calculateNetwork(rows,state.prices);
  setText('kpi-delivered',formatKwh(n.delivered));
  setText('kpi-solar',pct(n.solarShare));
  setText('kpi-margin',formatPKR(n.unitContribution)+'/kWh');
  setText('kpi-uptime',pct(n.uptime));
  setText('kpi-peak',signed(n.peak,' kW'));
  setText('kpi-efficiency',pct(n.efficiency));
  setText('stat-solar',formatKwh(n.solar));setText('stat-grid',formatKwh(n.grid));
  setText('stat-input',formatKwh(n.input));setText('stat-delivered',formatKwh(n.delivered));
  setText('stat-loss',formatKwh(n.loss));setText('stat-swaps',fmt(n.swaps)+' swaps');
  $('source-bar').innerHTML=progressBar([{label:'Solar',share:n.solarShare,color:'#20cde5'},{label:'Grid',share:1-n.solarShare,color:'#fbd03f'}]);
  $('energy-chart').innerHTML=dailyChart(rows);
  const denominator=n.delivered||1;
  let cursor=0;
  const distribution=MODES.map(mode=>({color:mode.color,share:n.modes[mode.id].delivered/denominator,label:mode.short,value:n.modes[mode.id].delivered}));
  const stops=distribution.map(item=>{const a=cursor;cursor+=item.share*100;return `${item.color} ${a.toFixed(2)}% ${cursor.toFixed(2)}%`}).join(',');
  $('mode-donut').style.background=`conic-gradient(${stops})`;
  $('mode-legend').innerHTML=distribution.map(m=>`<div class="legend-item"><i style="background:${m.color}"></i><span>${m.label}</span><strong>${pct(m.share)}</strong></div>`).join('');
  $('raw-tbody').innerHTML=rows.slice().reverse().slice(0,36).map(r=>`<tr><td>${r.date}</td><td>${MODES.find(m=>m.id===r.mode).short}</td><td>${number(r.solar_kwh,1)}</td><td>${number(r.grid_kwh,1)}</td><td>${number(r.delivered_kwh,1)}</td><td>${pct(r.uptime)}</td></tr>`).join('');
  $('row-count').textContent=`Showing latest ${Math.min(36,rows.length)} of ${rows.length} simulated events`;
  setText('finance-revenue',formatPKR(n.sales));
  setText('finance-energy',formatPKR(n.energyCost));
  setText('finance-wear',formatPKR(n.batteryWear));
  setText('finance-logistics',formatPKR(n.logistics));
  setText('finance-opex',formatPKR(n.opex+n.siteShare));
  setText('finance-contribution',formatPKR(n.contribution));
  setText('finance-unit',formatPKR(n.unitContribution)+'/kWh delivered');
  const finTotal=Math.max(1,n.sales);
  for(const [id,value] of [['bar-energy',n.energyCost],['bar-wear',n.batteryWear],['bar-logistics',n.logistics],['bar-opex',n.opex+n.siteShare],['bar-contribution',Math.abs(n.contribution)]])$(id).style.width=Math.min(100,100*value/finTotal)+'%';
  $('finance-contribution').classList.toggle('negative',n.contribution<0);
  setText('pilot-acquired',formatKwh(n.input));setText('pilot-delivered',formatKwh(n.delivered));
  setText('pilot-solar',pct(n.solarShare));setText('pilot-peak',number(n.peak,1)+' kW');
  setText('pilot-contribution',formatPKR(n.unitContribution)+'/kWh');setText('pilot-reliability',pct(n.uptime));
}
function renderClimate(){
  const car=co2Car(),rider=co2Rider();
  setText('co2-value',signed(car.avoidedTonnes,' tCO₂'));
  setText('co2-value-duplicate',signed(car.avoidedTonnes,' tCO₂'));
  setText('co2-baseline',signed(car.baselineKg/1000,' t'));
  setText('co2-electric',signed(car.electricKg/1000,' t'));
  setText('co2-petrol',fmt(car.petrolLitres)+' L');
  setText('co2-delivered',formatKwh(car.deliveredKwh));
  setText('co2-replaced',fmt(car.replacedKm)+' km');
  setText('co2-rider',signed(rider.avoidedTonnes,' tCO₂'));
  setText('co2-rider-km',fmt(rider.replacedKm)+' km attributable');
  const base=Math.max(0.1,car.baselineKg/1000);
  $('co2-baseline-bar').style.width='100%';
  $('co2-electric-bar').style.width=(100*car.electricKg/1000/base)+'%';
  $('co2-avoided-bar').style.width=Math.max(0,100*car.avoidedKg/1000/base)+'%';
  setText('range-solar-label',state.solarShare+'%');
  setText('range-displacement-label',state.displacement+'%');
  setText('range-km-label',fmt(state.km)+' km');
  $('solar-range').value=state.solarShare;
  $('displacement-range').value=state.displacement;
  $('km-range').value=state.km;
}
function render(){renderNetwork();renderClimate();}
function setup(){
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-days]').forEach(b=>b.addEventListener('click',()=>{state.days=Number(b.dataset.days);document.querySelectorAll('[data-days]').forEach(x=>x.classList.toggle('active',x===b));render();}));
  $('mode-filter').addEventListener('change',e=>{state.mode=e.target.value;render();});
  for(const [id,key,formatter] of [['solar-range','solarShare',x=>x+'%'],['displacement-range','displacement',x=>x+'%'],['km-range','km',x=>fmt(x)+' km']]){
    $(id).addEventListener('input',e=>{state[key]=Number(e.target.value);renderClimate();});
  }
  document.querySelectorAll('[data-rate]').forEach(el=>{
    el.value=state.prices[el.dataset.rate];
    el.addEventListener('input',e=>{state.prices[e.target.dataset.rate]=Number(e.target.value);renderNetwork();});
  });
  $('reset-rates').addEventListener('click',()=>{state.prices={...DEFAULT_ECONOMICS};document.querySelectorAll('[data-rate]').forEach(el=>el.value=state.prices[el.dataset.rate]);render();});
  $('download-csv').addEventListener('click',()=>{
    const blob=new Blob([exportCsv(activeRows())],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='bijli-haazir-SYNTHETIC-demo-transactions.csv';a.click();URL.revokeObjectURL(url);
  });
  $('download-summary').addEventListener('click',()=>{
    const data={notice:'SIMULATED DEMO ONLY — NO REAL PILOT MEASUREMENTS',period_days:state.days,mode:state.mode,financial_assumptions_pkr:state.prices,pilot:calculateNetwork(activeRows(),state.prices),car_scenario:co2Car(),rider_scenario:co2Rider()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='bijli-haazir-simulation-report.json';a.click();URL.revokeObjectURL(url);
  });
  render();
}
setup();
