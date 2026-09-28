"use client";
import {useMemo,useState} from "react";

const plans=["Original SL/TP","BE +1R","BE +1.5R","Structure Trailing","Profit Lock"];
const fields=[
 ["original_result_r","Original SL/TP"],
 ["be1_result_r","BE +1R"],
 ["be15_result_r","BE +1.5R"],
 ["structure_result_r","Structure Trailing"],
 ["profit_lock_result_r","Profit Lock"]
];
const n=v=>v===""||v==null?null:Number(v);
const fmt=v=>Number.isFinite(v)?v.toFixed(2)+"R":"—";

export default function TradeManagement({trades,client,reload}){
 const closed=useMemo(()=>trades.filter(x=>(x.position_status||"Closed")==="Closed"),[trades]);
 const [selected,setSelected]=useState("");
 const trade=closed.find(x=>x.id===selected);
 const [form,setForm]=useState(null);
 function choose(id){setSelected(id);const x=closed.find(t=>t.id===id);setForm(x?{
   management_plan:x.management_plan||"Original SL/TP",mfe_r:x.mfe_r??"",mae_r:x.mae_r??"",
   management_followed:x.management_followed!==false,exit_note:x.exit_note||"",
   original_result_r:x.original_result_r??"",be1_result_r:x.be1_result_r??"",be15_result_r:x.be15_result_r??"",
   structure_result_r:x.structure_result_r??"",profit_lock_result_r:x.profit_lock_result_r??""
 }:null)}
 async function save(){
  if(!trade||!form)return;
  const payload={management_plan:form.management_plan,mfe_r:n(form.mfe_r),mae_r:n(form.mae_r),
   management_followed:!!form.management_followed,exit_note:form.exit_note,
   original_result_r:n(form.original_result_r),be1_result_r:n(form.be1_result_r),be15_result_r:n(form.be15_result_r),
   structure_result_r:n(form.structure_result_r),profit_lock_result_r:n(form.profit_lock_result_r)};
  const {error}=await client.from("trades").update(payload).eq("id",trade.id);
  if(error)return alert(error.message); await reload(); alert("Trade management data saved");
 }
 const stats=fields.map(([key,label])=>{const vals=closed.map(x=>Number(x[key])).filter(Number.isFinite);const wins=vals.filter(v=>v>0).length;return{label,n:vals.length,avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null,wr:vals.length?wins/vals.length*100:null}});
 const actual=plans.map(label=>{const arr=closed.filter(x=>x.management_plan===label);const vals=arr.map(x=>Number(x.r_multiple)).filter(Number.isFinite);return{label,n:vals.length,avg:vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null}});
 const mfe=closed.map(x=>Number(x.mfe_r)).filter(Number.isFinite);
 const gaveBack=closed.filter(x=>Number.isFinite(Number(x.mfe_r))&&Number(x.mfe_r)>=2&&Number(x.r_multiple)<=0).length;
 return <div>
  <section className="panel"><div className="panelHead"><h2>NØS Trade Management Protocol</h2></div><div className="body">
   <div className="kpis">
    <div className="card"><span>0 → +1R</span><b>HANDS OFF</b><small>Initial SL. No emotional adjustment.</small></div>
    <div className="card"><span>+1R → +2R</span><b>STRUCTURE ONLY</b><small>Protect only when the planned structure confirms.</small></div>
    <div className="card"><span>≥ +2R</span><b>PROFIT PROTECTION</b><small>Do not invent a new rule mid-trade.</small></div>
    <div className="card"><span>CORE RULE</span><b>PLAN BEFORE ENTRY</b><small>Entry · SL · TP · +1R action · +2R action</small></div>
   </div>
   <p><b>Temporary rule:</b> do not force every setup into one exit method. Record the same completed trade under all five methods, then let expectancy decide after a meaningful sample.</p>
  </div></section>

  <section className="panel"><div className="panelHead"><h2>Management Lab</h2></div><div className="body">
   <div className="table"><table><thead><tr><th>Method</th><th>Samples</th><th>Avg / Expectancy</th><th>Win Rate</th></tr></thead><tbody>
    {stats.map(x=><tr key={x.label}><td><b>{x.label}</b></td><td>{x.n}</td><td className={x.avg!=null?(x.avg>=0?"pos":"neg"):""}>{fmt(x.avg)}</td><td>{x.wr==null?"—":x.wr.toFixed(1)+"%"}</td></tr>)}
   </tbody></table></div>
   <small>Counterfactual results must be entered from the actual price path after the trade. This prevents the app from guessing whether a stop/target was touched first.</small>
  </div></section>

  <section className="panel"><div className="panelHead"><h2>Actual Results by Chosen Plan</h2></div><div className="body">
   <div className="table"><table><thead><tr><th>Plan used</th><th>Trades</th><th>Actual Avg R</th></tr></thead><tbody>
    {actual.map(x=><tr key={x.label}><td>{x.label}</td><td>{x.n}</td><td className={x.avg!=null?(x.avg>=0?"pos":"neg"):""}>{fmt(x.avg)}</td></tr>)}
   </tbody></table></div>
   <div className="kpis"><div className="card"><span>MFE SAMPLES</span><b>{mfe.length}</b></div><div className="card"><span>AVG MFE</span><b>{fmt(mfe.length?mfe.reduce((a,b)=>a+b,0)/mfe.length:null)}</b></div><div className="card"><span>≥2R → ≤0R GIVEBACK</span><b className={gaveBack?"neg":""}>{gaveBack}</b><small>Trades that had ≥2R open profit but finished at breakeven/loss.</small></div></div>
  </div></section>

  <section className="panel"><div className="panelHead"><h2>Post-Trade Management Review</h2></div><div className="body">
   <label><span>Choose closed trade</span><select value={selected} onChange={e=>choose(e.target.value)}><option value="">Select trade…</option>{closed.map(x=><option key={x.id} value={x.id}>{x.trade_date} · {x.exchange} · {x.pair} · {Number(x.r_multiple||0).toFixed(2)}R</option>)}</select></label>
   {form&&<div className="form">
    <label><span>Management plan actually used</span><select value={form.management_plan} onChange={e=>setForm({...form,management_plan:e.target.value})}>{plans.map(x=><option key={x}>{x}</option>)}</select></label>
    <label><span>MFE (max open profit, R)</span><input type="number" step="any" value={form.mfe_r} onChange={e=>setForm({...form,mfe_r:e.target.value})}/></label>
    <label><span>MAE (max adverse excursion, R)</span><input type="number" step="any" value={form.mae_r} onChange={e=>setForm({...form,mae_r:e.target.value})}/></label>
    <label><span>Management followed?</span><select value={form.management_followed?"yes":"no"} onChange={e=>setForm({...form,management_followed:e.target.value==="yes"})}><option value="yes">yes</option><option value="no">no</option></select></label>
    {fields.map(([key,label])=><label key={key}><span>{label} result (R)</span><input type="number" step="any" value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}
    <label className="wide"><span>Exit / management note</span><textarea value={form.exit_note} onChange={e=>setForm({...form,exit_note:e.target.value})}/></label>
    <button onClick={save}>Save Management Review</button>
   </div>}
  </div></section>
 </div>
}