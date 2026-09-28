"use client";
import {useMemo,useState} from "react";
const checks=[
 ["pretrade_structure","Structure matches setup"],
 ["pretrade_momentum","Momentum confirms direction"],
 ["pretrade_entry_confirmed","Entry trigger confirmed — not anticipated"],
 ["pretrade_rr_ok","Planned R:R is acceptable"],
 ["pretrade_risk_ok","Risk is within limit"],
 ["pretrade_no_fomo","No FOMO / revenge / missed-move chase"]
];
const blank={exchange:"Binance",pair:"BTCUSDT",side:"Long",entry:"",stop_loss:"",take_profit:"",position_size:"",leverage:20,contract_size:100000,setup:"",pretrade_htf_bias:"Neutral",pretrade_invalidation:"",pretrade_plus1_action:"Hands off / structure only",pretrade_plus2_action:"Profit protection per plan",notes:"",...Object.fromEntries(checks.map(([k])=>[k,false]))};
export default function PreTrade({client,user,trades,reload,setTab}){
 const [f,setF]=useState(blank);
 const planned=useMemo(()=>trades.filter(x=>x.position_status==="Planned"),[trades]);
 const score=checks.reduce((a,[k])=>a+(f[k]?1:0),0);
 const pct=Math.round(score/checks.length*100);
 const stop=Math.abs(Number(f.entry)-Number(f.stop_loss)),tp=Math.abs(Number(f.take_profit)-Number(f.entry));
 const rr=stop&&tp?tp/stop:0;
 async function save(){
  if(!f.entry||!f.stop_loss||!f.position_size)return alert("Entry, SL and position size are required");
  const entry=Number(f.entry),raw=Number(f.position_size),cs=f.exchange==="XM"?Number(f.contract_size||100000):1;
  const qty=f.exchange==="OKX"?raw/entry:f.exchange==="XM"?raw*cs:raw;
  const risk=f.exchange==="OKX"?raw*(stop/entry):stop*qty;
  const payload={user_id:user.id,trade_date:new Date().toISOString().slice(0,10),exchange:f.exchange,pair:f.pair,side:f.side,position_status:"Planned",entry,stop_loss:Number(f.stop_loss),take_profit:f.take_profit?Number(f.take_profit):null,position_size:raw,leverage:Number(f.leverage||1),contract_size:f.exchange==="XM"?cs:null,risk_usd:risk,pnl_usd:0,r_multiple:0,setup:f.setup,notes:f.notes,pretrade_htf_bias:f.pretrade_htf_bias,pretrade_invalidation:f.pretrade_invalidation,pretrade_plus1_action:f.pretrade_plus1_action,pretrade_plus2_action:f.pretrade_plus2_action,pretrade_score:pct,...Object.fromEntries(checks.map(([k])=>[k,!!f[k]]))};
  const {error}=await client.from("trades").insert(payload);if(error)return alert(error.message);
  setF(blank);await reload();setTab("Ongoing");
 }
 return <div>
  <section className="panel"><div className="panelHead"><h2>NØS Pre-Trade Gate</h2><small>PLAN → EXECUTE → MANAGE → REVIEW</small></div><div className="body">
   <div className="kpis"><div className="card"><span>PRE-TRADE SCORE</span><b className={pct>=80?"pos":pct<60?"neg":""}>{pct}%</b><small>{score}/{checks.length} conditions</small></div><div className="card"><span>PLANNED R:R</span><b>{rr?rr.toFixed(2)+"R":"—"}</b></div><div className="card"><span>DECISION</span><b>{pct>=80?"QUALIFIED":pct>=60?"REVIEW":"NO TRADE"}</b><small>Score is a discipline signal, not a prediction.</small></div></div>
   <p><b>Core rule:</b> define the invalidation and management actions before entry. Once the position is live, do not invent a new exit rule because P&L is moving.</p>
  </div></section>
  <section className="panel"><div className="panelHead"><h2>Build Trade Plan</h2></div><div className="body"><div className="form">
   <label><span>Exchange</span><select value={f.exchange} onChange={e=>setF({...f,exchange:e.target.value})}>{["Binance","OKX","XM","Dime"].map(x=><option key={x}>{x}</option>)}</select></label>
   <label><span>Pair / symbol</span><input value={f.pair} onChange={e=>setF({...f,pair:e.target.value})}/></label>
   <label><span>Side</span><select value={f.side} onChange={e=>setF({...f,side:e.target.value})}><option>Long</option><option>Short</option></select></label>
   <label><span>Setup / strategy</span><input value={f.setup} onChange={e=>setF({...f,setup:e.target.value})}/></label>
   <label><span>HTF bias</span><select value={f.pretrade_htf_bias} onChange={e=>setF({...f,pretrade_htf_bias:e.target.value})}><option>Bullish</option><option>Bearish</option><option>Neutral</option></select></label>
   <label><span>Entry</span><input type="number" step="any" value={f.entry} onChange={e=>setF({...f,entry:e.target.value})}/></label>
   <label><span>Initial SL</span><input type="number" step="any" value={f.stop_loss} onChange={e=>setF({...f,stop_loss:e.target.value})}/></label>
   <label><span>TP</span><input type="number" step="any" value={f.take_profit} onChange={e=>setF({...f,take_profit:e.target.value})}/></label>
   <label><span>{f.exchange==="OKX"?"Position size (USDT)":f.exchange==="XM"?"Lots":"Quantity / coins"}</span><input type="number" step="any" value={f.position_size} onChange={e=>setF({...f,position_size:e.target.value})}/></label>
   <label><span>Leverage</span><input type="number" step="any" value={f.leverage} onChange={e=>setF({...f,leverage:e.target.value})}/></label>
   {f.exchange==="XM"&&<label><span>Contract size / lot</span><input type="number" value={f.contract_size} onChange={e=>setF({...f,contract_size:e.target.value})}/></label>}
   <label className="wide"><span>Invalidation — what proves this trade idea wrong?</span><textarea value={f.pretrade_invalidation} onChange={e=>setF({...f,pretrade_invalidation:e.target.value})}/></label>
   <label className="wide"><span>At +1R I will…</span><input value={f.pretrade_plus1_action} onChange={e=>setF({...f,pretrade_plus1_action:e.target.value})}/></label>
   <label className="wide"><span>At +2R I will…</span><input value={f.pretrade_plus2_action} onChange={e=>setF({...f,pretrade_plus2_action:e.target.value})}/></label>
   <label className="wide"><span>Notes</span><textarea value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/></label>
  </div></div></section>
  <section className="panel"><div className="panelHead"><h2>Execution Checklist</h2></div><div className="body">
   <div className="form">{checks.map(([k,label])=><label key={k}><span>{label}</span><select value={f[k]?"yes":"no"} onChange={e=>setF({...f,[k]:e.target.value==="yes"})}><option value="no">NO</option><option value="yes">YES</option></select></label>)}</div>
   <button onClick={save}>Save as Planned / Waiting</button>
   {pct<80&&<p><b>Warning:</b> this plan is below the 80% qualification threshold. The app still lets you save it so we can measure whether low-score trades actually underperform.</p>}
  </div></section>
  <section className="panel"><div className="panelHead"><h2>Waiting Queue</h2></div><div className="body"><div className="table"><table><thead><tr><th>Pair</th><th>Side</th><th>Setup</th><th>Entry</th><th>SL</th><th>TP</th><th>Score</th></tr></thead><tbody>{planned.length?planned.map(x=><tr key={x.id}><td>{x.pair}</td><td>{x.side}</td><td>{x.setup||"—"}</td><td>{x.entry}</td><td>{x.stop_loss}</td><td>{x.take_profit||"—"}</td><td><b>{x.pretrade_score==null?"Legacy":x.pretrade_score+"%"}</b></td></tr>):<tr><td colSpan="7">No planned trades</td></tr>}</tbody></table></div></div></section>
 </div>
}