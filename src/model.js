/** Bijli Haazir demonstration model — not observations or commercial forecasts. */
export const MODES = [
  { id: 'mobile', label: 'Mobile energy truck', short: 'Mobile truck', color: '#1ed5e5', price: 105, efficiency: 0.85 },
  { id: 'station', label: 'Fixed DC–DC charging', short: 'Fixed BESS + DC', color: '#ffd33f', price: 96, efficiency: 0.91 },
  { id: 'swaps', label: 'Rider battery swapping', short: 'Rider swaps', color: '#b8ee62', price: 76, efficiency: 0.88 },
];
export const DEFAULT_ECONOMICS = {
  solarCost: 30, gridCost: 40, wearCost: 8, opexCost: 7,
  transportCost: 4, siteCost: 5, mobilePrice: 105, stationPrice: 96, swapsPrice: 76,
};
const round = (x, digits=2) => Number(x.toFixed(digits));

/** Synthetic records, deterministic and reproducible; no PII, no live telemetry. */
export function makeDemoTransactions(days=30) {
  const records=[];
  for (let day=0;day<days;day++) {
    const date = new Date(Date.UTC(2026, 10, 20 - (days-1-day))).toISOString().slice(0,10);
    for (const [i,mode] of MODES.entries()) {
      const weekly = Math.sin((day + i*2)*Math.PI/3.5);
      const trend = 1+(day / days)*0.18;
      const base=[136,315,48][i];
      const input=round(Math.max(10,base*trend*(1+0.16*weekly)));
      const share = Math.max(0.12,Math.min(0.85,0.46+0.18*Math.sin((day+i*3)*0.43)));
      const solar=round(input*share);
      const grid=round(input-solar);
      const eff=mode.efficiency + 0.012*Math.sin(day*0.55+i);
      const delivered=round(input*eff);
      const uptime=round(Math.min(1,0.966 + 0.026*Math.cos(day*0.37+i)),4);
      records.push({
        date, id:`BH-DEMO-${String(day+1).padStart(2,'0')}-${mode.id.toUpperCase()}`,
        mode:mode.id, solar_kwh:solar, grid_kwh:grid, input_kwh:input,
        delivered_kwh:delivered, loss_kwh:round(input-delivered), uptime,
        peak_buffer_kw: mode.id==='station' ? round(32+11*Math.sin(day*0.31)+day*0.23) : 0,
        swaps: mode.id==='swaps'? Math.round(11+4*Math.sin(day*0.44)+day*0.12) : 0,
        note:'SYNTHETIC DEMO — not metered',
      });
    }
  }
  return records;
}

export function calculateNetwork(rows, rates=DEFAULT_ECONOMICS) {
  const output={ input:0, delivered:0, solar:0, grid:0, loss:0,
    sales:0, energyCost:0, batteryWear:0, opex:0, logistics:0, siteShare:0,
    subscriptions:0, contribution:0, weightedUptime:0, peak:0, swaps:0, count:0,
    modes:{ mobile:{delivered:0,sales:0,contribution:0},station:{delivered:0,sales:0,contribution:0},swaps:{delivered:0,sales:0,contribution:0}},
  };
  for (const r of rows){
    const price = rates[r.mode+'Price'];
    const revenue = r.delivered_kwh*price;
    const energy = r.solar_kwh*rates.solarCost + r.grid_kwh*rates.gridCost;
    const wear = r.delivered_kwh*rates.wearCost;
    const opex = r.delivered_kwh*rates.opexCost;
    const logistics = r.delivered_kwh*rates.transportCost*(r.mode==='mobile'?1.8:r.mode==='station'?0.55:0.8);
    const site = r.delivered_kwh*rates.siteCost*(r.mode==='mobile'?0.25:1);
    const contribution=revenue-energy-wear-opex-logistics-site;
    output.input+=r.input_kwh; output.delivered+=r.delivered_kwh;
    output.solar+=r.solar_kwh; output.grid+=r.grid_kwh; output.loss+=r.loss_kwh;
    output.sales+=revenue; output.energyCost+=energy; output.batteryWear+=wear;
    output.opex+=opex; output.logistics+=logistics; output.siteShare+=site;
    output.contribution+=contribution; output.weightedUptime+=r.uptime*r.delivered_kwh;
    output.peak=Math.max(output.peak,r.peak_buffer_kw); output.swaps+=r.swaps;
    output.count+=1;
    output.modes[r.mode].delivered+=r.delivered_kwh;
    output.modes[r.mode].sales+=revenue;
    output.modes[r.mode].contribution+=contribution;
  }
  output.uptime = output.delivered>0?output.weightedUptime/output.delivered:0;
  output.efficiency=output.input>0?output.delivered/output.input:0;
  output.solarShare=output.input>0?output.solar/output.input:0;
  output.unitContribution=output.delivered>0?output.contribution/output.delivered:0;
  return output;
}

/** Operational CO2 scenarios. These are NOT full lifecycle assessments. */
export function calculateCarImpact({km=100000,kmPerLitre=10,kwhPerKm=0.15,efficiency=0.85,
  gridFactor=0.365,solarShare=0,displacement=1}={}){
  const replacedKm=km*displacement;
  const petrolLitres=replacedKm/kmPerLitre;
  const baselineKg=petrolLitres*2.31;
  const deliveredKwh=replacedKm*kwhPerKm;
  const inputKwh=deliveredKwh/efficiency;
  const electricKg=inputKwh*gridFactor*(1-solarShare);
  return {replacedKm,petrolLitres,baselineKg,deliveredKwh,inputKwh,electricKg,
    avoidedKg:baselineKg-electricKg,avoidedTonnes:(baselineKg-electricKg)/1000};
}
export function calculateRiderImpact({riders=20,kmPerDay=40,days=300,kmPerLitre=40,
  kwhPerKm=0.045,efficiency=0.85,gridFactor=0.365,solarShare=0,displacement=1}={}){
  return calculateCarImpact({km:riders*kmPerDay*days,kmPerLitre,kwhPerKm,efficiency,
    gridFactor,solarShare,displacement});
}
export function formatPKR(amount){return `Rs ${Math.round(amount).toLocaleString('en-PK')}`;}
export function formatKwh(amount){return `${Math.round(amount).toLocaleString('en-PK')} kWh`;}
export function exportCsv(rows){
  const keys=Object.keys(rows[0]||{});
  return [keys.join(','),...rows.map(row=>keys.map(k=>String(row[k]).replaceAll('"','""')).map(v=>`"${v}"`).join(','))].join('\n');
}
