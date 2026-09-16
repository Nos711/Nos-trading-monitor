"use client";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";

const defaults=[
 ["Binance USDT","Trading","USDT"],["OKX #1 USDT","Trading","USDT"],["OKX #2 USDT","Trading","USDT"],
 ["Bitkub","Investment","THB"],["Dime","Investment","THB"],["XM","Trading","USD"],
 ["Cash in Bank","Cash","THB"],["Safe Cash","Cash","THB"],["Bank","Cash","THB"]
];
const thb=n=>"฿"+Number(n||0).toLocaleString(undefined,{maximumFractionDigits:0});
const num=n=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2});

export default function PortfolioPage(){
 const s=useMemo(()=>supabase(),[]),[user,setUser]=useState(null),[accounts,setAccounts]=useState([]),[settings,setSettings]=useState({usdt_thb:32,usd_thb:32}),[snapshots,setSnapshots]=useState([]),[busy,setBusy]=useState(false);
 async function load(){let {data:{user:u}}=await s.auth.getUser();if(!u)return;setUser(u);let {data:a}=await s.from("portfolio_accounts").select("*").eq("user_id",u.id).order("sort_order"),{data:st}=await s.from("portfolio_settings").select("*").eq("user_id",u.id).maybeSingle(),{data:sn}=await s.from("portfolio_snapshots").select("*").eq("user_id",u.id).order("snapshot_at",{ascending:false}).limit(12);if(st)setSettings(st);if(a?.length)setAccounts(a);else setAccounts(defaults.map((x,i)=>({account_name:x[0],category:x[1],currency:x[2],balance:0,target_pct:0,sort_order:i})));setSnapshots(sn||[])}
 useEffect(()=>{load()},[]);
 const rate=c=>c==="USDT"?(+settings.usdt_thb||0):c==="USD"?(+settings.usd_thb||0):1;
 const rows=accounts.map(x=>({...x,value_thb:(+x.balance||0)*rate(x.currency)})),total=rows.reduce((a,x)=>a+x.value_thb,0);
 const enriched=rows.map(x=>{let current=total?x.value_thb/total*100:0,target=+x.target_pct||0,targetValue=total*target/100;return{...x,current,target,rebalance:targetValue-x.value_thb}});
 const cats=["Trading","Investment","Cash"].map(name=>{let a=enriched.filter(x=>x.category===name),value=a.reduce((s,x)=>s+x.value_thb,0),target=a.reduce((s,x)=>s+x.target,0);return{name,value,current:total?value/total*100:0,target,rebalance:total*target/100-value}});
 function change(i,k,v){setAccounts(a=>a.map((x,j)=>j===i?{...x,[k]:v}:x))}
 async function save(){if(!user)return;setBusy(true);let payload=accounts.map((x,i)=>({user_id:user.id,account_name:x.account_name,category:x.category,currency:x.currency,balance:+x.balance||0,target_pct:+x.target_pct||0,sort_order:i,updated_at:new Date().toISOString()}));let {error}=await s.from("portfolio_accounts").upsert(payload,{onConflict:"user_id,account_name"});if(!error)({error}=await s.from("portfolio_settings").upsert({user_id:user.id,usdt_thb:+settings.usdt_thb||0,usd_thb:+settings.usd_thb||0,updated_at:new Date().toISOString()},{onConflict:"user_id"}));setBusy(false);alert(error?error.message:"Portfolio saved")}
 async function snapshot(){if(!user||!total)return alert("Enter balances first");await save();let data=enriched.map(x=>({account:x.account_name,category:x.category,currency:x.currency,balance:+x.balance||0,value_thb:x.value_thb,current_pct:x.current,target_pct:x.target}));let {error}=await s.from("portfolio_snapshots").insert({user_id:user.id,total_thb:total,accounts:data});if(error)return alert(error.message);await load()}
 return <>
  <div className="kpis portfolioKpis"><div className="card"><span>TOTAL NET ASSETS</span><b>{thb(total)}</b><small>All accounts converted to THB</small></div>{cats.map(x=><div className="card" key={x.name}><span>{x.name.toUpperCase()}</span><b>{x.current.toFixed(1)}%</b><small>{thb(x.value)} · Target {x.target.toFixed(1)}%</small></div>)}</div>
  <section className="panel"><div className="panelHead"><h2>Portfolio / Assets</h2><div><button onClick={save} disabled={busy}>Save</button><button onClick={snapshot} disabled={busy}>Save Snapshot</button></div></div><div className="body">
   <div className="portfolioRates"><label><span>USDT / THB</span><input type="number" step="any" value={settings.usdt_thb} onChange={e=>setSettings({...settings,usdt_thb:e.target.value})}/></label><label><span>USD / THB</span><input type="number" step="any" value={settings.usd_thb} onChange={e=>setSettings({...settings,usd_thb:e.target.value})}/></label></div>
   <div className="table"><table><thead><tr><th>Account</th><th>Category</th><th>Balance</th><th>Currency</th><th>Value (THB)</th><th>Current %</th><th>Target %</th><th>Rebalance</th></tr></thead><tbody>{enriched.map((x,i)=><tr key={x.account_name}><td><b>{x.account_name}</b></td><td><select value={x.category} onChange={e=>change(i,"category",e.target.value)}><option>Trading</option><option>Investment</option><option>Cash</option></select></td><td><input type="number" step="any" value={x.balance} onChange={e=>change(i,"balance",e.target.value)}/></td><td><select value={x.currency} onChange={e=>change(i,"currency",e.target.value)}><option>THB</option><option>USDT</option><option>USD</option></select></td><td>{thb(x.value_thb)}</td><td>{x.current.toFixed(1)}%</td><td><input className="targetInput" type="number" step="0.1" value={x.target_pct} onChange={e=>change(i,"target_pct",e.target.value)}/></td><td className={x.rebalance>=0?"pos":"neg"}>{x.target?`${x.rebalance>=0?"+":""}${thb(x.rebalance)}`:"—"}</td></tr>)}</tbody></table></div>
   <small>Total target allocation: {enriched.reduce((s,x)=>s+x.target,0).toFixed(1)}% {Math.abs(enriched.reduce((s,x)=>s+x.target,0)-100)>.01?"· Set targets to 100% for a full rebalance":"· Ready to rebalance"}</small>
  </div></section>
  <section className="panel"><div className="panelHead"><h2>Rebalance Summary</h2></div><div className="body platformGrid">{cats.map(x=><div className="platformCard" key={x.name}><div className="platformTitle"><b>{x.name}</b><span>{x.current.toFixed(1)}%</span></div><strong>{thb(x.value)}</strong><div className="platformMeta"><span>Target <b>{x.target.toFixed(1)}%</b></span><span className={x.rebalance>=0?"pos":"neg"}>{x.target?`${x.rebalance>=0?"Add ":"Reduce "}${thb(Math.abs(x.rebalance))}`:"No target"}</span></div></div>)}</div></section>
  <section className="panel"><div className="panelHead"><h2>Snapshot History</h2><small>Tracks net asset growth over time</small></div><div className="body table"><table><thead><tr><th>Date</th><th>Total Net Assets</th><th>Change</th></tr></thead><tbody>{snapshots.length?snapshots.map((x,i)=>{let older=snapshots[i+1],diff=older?(+x.total_thb)-(+older.total_thb):null;return <tr key={x.id}><td>{new Date(x.snapshot_at).toLocaleString()}</td><td><b>{thb(x.total_thb)}</b></td><td className={diff==null?"":diff>=0?"pos":"neg"}>{diff==null?"—":`${diff>=0?"+":""}${thb(diff)}`}</td></tr>}):<tr><td colSpan="3">No snapshots yet. Enter balances and click Save Snapshot.</td></tr>}</tbody></table></div></section>
 </>;
}
