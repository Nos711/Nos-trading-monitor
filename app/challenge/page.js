"use client";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";

const cash=n=>"$"+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const criteria=[
 {key:"entry",label:"Entry ตรง Setup"},
 {key:"risk",label:"Risk ถูกต้อง"},
 {key:"stop",label:"SL ตามแผน"},
 {key:"management",label:"Management ตาม Rule"},
 {key:"exit",label:"Exit ตาม Rule"}
];
const emptyChecks=()=>({entry:false,risk:false,stop:false,management:false,exit:false});

export default function Challenge(){
 const s=useMemo(()=>supabase(),[]);
 const [user,setUser]=useState(null),[trades,setTrades]=useState([]),[checks,setChecks]=useState({}),[ready,setReady]=useState(false);

 useEffect(()=>{(async()=>{let {data:{user:u}}=await s.auth.getUser();if(!u){location.href="/login";return}setUser(u);let {data:t}=await s.from("trades").select("*").eq("position_status","Closed").order("closed_at",{ascending:false}).limit(20);setTrades(t||[]);try{setChecks(JSON.parse(localStorage.getItem("nos_20_trade_challenge")||"{}"))}catch{setChecks({})}setReady(true)})()},[]);
 useEffect(()=>{if(ready)localStorage.setItem("nos_20_trade_challenge",JSON.stringify(checks))},[checks,ready]);

 function rowChecks(id){return {...emptyChecks(),...(checks[id]||{})}}
 function toggle(id,key){setChecks(v=>({...v,[id]:{...rowChecks(id),[key]:!rowChecks(id)[key]}}))}
 function rowScore(id){return Object.values(rowChecks(id)).filter(Boolean).length}
 function reset(){if(confirm("Reset all 20-Trade Challenge scores?")){setChecks({});localStorage.removeItem("nos_20_trade_challenge")}}

 const completed=trades.length;
 const totalPoints=trades.reduce((a,x)=>a+rowScore(x.id),0);
 const possible=completed*5;
 const challengeScore=possible?totalPoints/possible*100:0;
 const perfect=trades.filter(x=>rowScore(x.id)===5).length;
 const net=trades.reduce((a,x)=>a+Number(x.pnl_usd||0),0);
 const avgR=completed?trades.reduce((a,x)=>a+Number(x.r_multiple||0),0)/completed:0;
 const targetPerfect=Math.ceil(Math.min(completed,20)*0.8);
 const passed=completed===20&&perfect>=16;
 const status=passed?"CHALLENGE PASSED":challengeScore>=90?"DISCIPLINED":challengeScore>=80?"ON TRACK":challengeScore>=70?"NEEDS ATTENTION":"RESET EXECUTION";
 const weakness=criteria.map(c=>({label:c.label,score:completed?trades.filter(t=>rowChecks(t.id)[c.key]).length/completed*100:0})).sort((a,b)=>a.score-b.score)[0];

 return <main className="shell challengePage">
  <header><div><small>EXECUTION TRAINING</small><h1>20-Trade Challenge</h1><p className="challengeIntro">เป้าหมายคือทำตามระบบให้ได้ ไม่ใช่ทำกำไรทุกไม้ · Score ไม่คิดจาก P&L</p></div><div><a className="ghostLink" href="/dashboard">← Dashboard</a><button className="ghost" onClick={reset}>Reset Score</button></div></header>

  <div className="challengeHero">
   <div className="scoreRing"><strong>{challengeScore.toFixed(0)}%</strong><span>EXECUTION SCORE</span></div>
   <div><b className={passed?"pos":""}>{status}</b><p>เป้าหมาย: อย่างน้อย <strong>16/20</strong> trades ต้องได้ 5/5</p>{weakness&&completed>0&&<small>Weakest area: {weakness.label} · {weakness.score.toFixed(0)}%</small>}</div>
  </div>

  <div className="kpis challengeKpis">
   <div className="card"><span>PROGRESS</span><b>{completed}/20</b><small>{Math.min(100,completed/20*100).toFixed(0)}% complete</small></div>
   <div className="card"><span>PERFECT TRADES</span><b>{perfect}/20</b><small>Target ≥ 16</small></div>
   <div className="card"><span>TOTAL POINTS</span><b>{totalPoints}/{possible||100}</b><small>5 points / trade</small></div>
   <div className="card"><span>AVG R</span><b>{avgR.toFixed(2)}R</b><small>Context only</small></div>
   <div className="card"><span>NET P&L</span><b className={net>=0?"pos":"neg"}>{cash(net)}</b><small>Not used in score</small></div>
   <div className="card"><span>PASS TARGET</span><b>{perfect}/{completed?targetPerfect:16}</b><small>{completed===20?(passed?"Passed":"Need 16 perfect trades"):"Complete 20 trades first"}</small></div>
  </div>

  <section className="panel"><div className="panelHead"><h2>Scoring Rules</h2><small>1 point each · 5/5 = Perfect Execution</small></div><div className="body ruleGrid">{criteria.map((c,i)=><div className="ruleCard" key={c.key}><b>{i+1}</b><span>{c.label}</span></div>)}</div></section>

  <section className="panel"><div className="panelHead"><h2>Latest 20 Closed Trades</h2><small>Tick only when the rule was genuinely followed</small></div><div className="body"><div className="table"><table className="challengeTable"><thead><tr><th>#</th><th>Date</th><th>Exchange</th><th>Pair</th><th>Side</th><th>P&L</th><th>R</th>{criteria.map(c=><th key={c.key}>{c.label}</th>)}<th>Score</th><th>Result</th></tr></thead><tbody>{trades.length?trades.map((x,i)=>{let score=rowScore(x.id);return <tr key={x.id}><td>{i+1}</td><td>{x.closed_at?new Date(x.closed_at).toLocaleDateString():x.trade_date}</td><td>{x.exchange}</td><td><b>{x.pair}</b></td><td>{x.side}</td><td className={Number(x.pnl_usd)>=0?"pos":"neg"}>{cash(x.pnl_usd)}</td><td>{Number(x.r_multiple||0).toFixed(2)}R</td>{criteria.map(c=><td className="checkCell" key={c.key}><input className="scoreCheck" type="checkbox" checked={rowChecks(x.id)[c.key]} onChange={()=>toggle(x.id,c.key)}/></td>)}<td><b>{score}/5</b></td><td><span className={score===5?"scorePass":score>=4?"scoreWatch":"scoreFail"}>{score===5?"PASS":score>=4?"WATCH":"FAIL"}</span></td></tr>}):<tr><td colSpan="14" className="emptyState">No closed trades yet</td></tr>}</tbody></table></div></div></section>

  <section className="panel"><div className="panelHead"><h2>How to read the score</h2></div><div className="body challengeNotes"><p><b>5/5</b> = Good execution regardless of profit or loss.</p><p><b>4/5</b> = One process leak. Review it before the next trade.</p><p><b>0–3/5</b> = Execution failed even if the trade made money.</p><p><b>Challenge Passed</b> = Complete 20 trades with at least 16 Perfect Trades (5/5).</p></div></section>
 </main>
}
