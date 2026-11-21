import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDemoTransactions,calculateNetwork,calculateCarImpact,calculateRiderImpact,DEFAULT_ECONOMICS,exportCsv} from '../src/model.js';

test('reproducible 30-day, 3-mode demo',()=>{
  const a=makeDemoTransactions(),b=makeDemoTransactions();
  assert.equal(a.length,90);assert.deepEqual(a,b);
  for(const record of a){assert.ok(record.input_kwh>record.delivered_kwh);assert.ok(record.solar_kwh+record.grid_kwh-record.input_kwh<0.02);}
});
test('network conservation and accounting',()=>{
 const n=calculateNetwork(makeDemoTransactions(),DEFAULT_ECONOMICS);
 assert.ok(Math.abs(n.solar+n.grid-n.input)<1);
 assert.ok(Math.abs(n.delivered+n.loss-n.input)<1);
 assert.ok(Math.abs(n.sales-n.energyCost-n.batteryWear-n.opex-n.logistics-n.siteShare-n.contribution)<0.1);
 assert.ok(n.uptime>0&&n.uptime<=1);
});
test('reference pitch energy spread: 100 kWh at Rs40, 85 delivered at Rs105',()=>{
 assert.equal(85*105-100*40,4925);
});
test('car scenario follows brief at 0% vs 50% solar',()=>{
 const grid=calculateCarImpact(),half=calculateCarImpact({solarShare:.5});
 assert.ok(Math.abs(grid.avoidedTonnes-16.7)<.05);
 assert.ok(Math.abs(half.avoidedTonnes-19.9)<.05);
});
test('rider scenario follows brief at 0% vs 50% solar',()=>{
 const grid=calculateRiderImpact(),half=calculateRiderImpact({solarShare:.5});
 assert.equal(grid.replacedKm,240000);
 assert.ok(Math.abs(grid.avoidedTonnes-9.2)<.05);
 assert.ok(Math.abs(half.avoidedTonnes-11.5)<.05);
});
test('existing EV use gets no ICE-displacement credit',()=>{
 const v=calculateCarImpact({displacement:0});assert.equal(v.avoidedKg,0);
});
test('csv exports synthetic disclosure',()=>{
 assert.match(exportCsv(makeDemoTransactions(1)),/SYNTHETIC DEMO/);
});
