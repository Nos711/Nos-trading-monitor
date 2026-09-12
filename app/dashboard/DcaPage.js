"use client";
import {useEffect,useMemo,useState} from "react";
import "../dca.css";

const exchanges=["Binance","OKX","Bitkub","XM","Dime"];
const money=(n,currency="USD")=>(currency==="THB"?"฿":"$")+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
const num=n=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:8});
const localNow=()=>{let d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,16)};
const btcHistory=[
 {key:"BTC-HISTORY-2026-01-06-1443",entry_date:"2026-01-06T07:43:05.000Z",entry_price:1743.42/0.00059739,amount:0.00059739,fee_usdt:5,notes:"6 Jan 2026 · Bitkub purchase ฿1,743.42"},
 {key:"BTC-HISTORY-2026-01-06-1444",entry_date:"2026-01-06T07:44:21.000Z",entry_price:7144.58/0.00244810,amount:0.00244810,fee_usdt:10,notes:"6 Jan 2026 · Bitkub purchase ฿7,144.58"},
 {key:"BTC-HISTORY-2026-01-21",entry_date:"2026-01-21T05:00:00.000Z",entry_price:11111/0.00400437,amount:0.00400437,fee_usdt:35,notes:"21 Jan 2026 · Bitkub purchase ฿11,111"},
 {key:"BTC-HISTORY-2026-03-24-05-22",entry_date:"2026-05-22T05:00:00.000Z",entry_price:6588/0.00271417,amount:0.00271417,fee_usdt:0,notes:"Auto DCA summary · 24 Mar–22 May · 61 × ฿108"},
 {key:"BTC-HISTORY-2026-09-06-12",entry_date:"2026-09-12T05:00:00.000Z",entry_price:7056/0.00271519,amount:0.00271519,fee_usdt:0,notes:"Auto DCA summary · 6–12 Sep · 7 × ฿1,008"}
];
const math=(p,x)=>{let price=+x.entry_price||0,amount=+x.amount||0,qty=x.amount_type==="Quantity"?amount:["OKX","Bitkub"].includes(p?.exchange)?(price?amount/price:0):p?.exchange==="XM"?amount*(+x.contract_size||100000):amount;return{qty,cost:x.amount_type==="Quantity"?price*qty:["OKX","Bitkub"].includes(p?.exchange)?amount:price*qty}};
function summary(p,rows){let quantity=0,subtotal=0,fees=0;rows.forEach(x=>{let m=math(p,x);quantity+=m.qty;subtotal+=m.cost;fees+=+x.fee_usdt||0});let total=subtotal+fees,average=quantity?subtotal/quantity:0,breakEven=quantity?total/quantity:0,current=+p?.current_price||0,pnl=current?current*quantity-total:0;return{count:rows.length,quantity,subtotal,fees,total,average,breakEven,pnl,returnPct:total?pnl/total*100:0}}
function running(p,rows){let quantity=0,cost=0;return rows.map(x=>{let m=math(p,x);quantity+=m.qty;cost+=m.cost+(+x.fee_usdt||0);return{...x,...m,runningAverage:quantity?cost/quantity:0}})}

export default function DcaPage({client,user}){
 const [positions,setPositions]=useState([]),[entries,setEntries]=useState([]),[selected,setSelected]=useState(null),[busy,setBusy]=useState(false);
 const [pf,setPf]=useState({exchange:"Binance",pair:"BTCUSDT",current_price:"",notes:""});
 const [ef,setEf]=useState({entry_date:localNow(),entry_price:"",amount:"",fee_usdt:"",contract_size:100000,notes:""});
 async function load(){if(!user)return;let [{data:p,error:pe},{data:e,error:ee}]=await Promise.all([client.from("dca_positions").select("*").order("created_at",{ascending:false}),client.from("dca_entries").select("*").order("entry_date")]);if(pe||ee)return alert((pe||ee).message);setPositions(p||[]);setEntries(e||[])}
 useEffect(()=>{load()},[user]);
 const position=positions.find(x=>x.id===selected),rows=entries.filter(x=>x.position_id===selected),s=useMemo(()=>summary(position,rows),[position,rows]);
 async function create(){if(!user||!pf.pair.trim())return;setBusy(true);let {data,error}=await client.from("dca_positions").insert({user_id:user.id,exchange:pf.exchange,pair:pf.pair.trim().toUpperCase(),current_price:pf.current_price?+pf.current_price:null,notes:pf.notes}).select().single();setBusy(false);if(error)return alert(error.message);setPf({...pf,pair:"",current_price:"",notes:""});await load();setSelected(data.id)}
 async function add(){if(!position)return alert("Select a DCA position first");if(!(ef.entry_price>0&&ef.amount>0))return alert("Enter price and amount");setBusy(true);let {error}=await client.from("dca_entries").insert({user_id:user.id,position_id:position.id,entry_date:new Date(ef.entry_date).toISOString(),entry_price:+ef.entry_price,amount:+ef.amount,amount_type:position.exchange==="OKX"?"USDT":position.exchange==="Bitkub"?"THB":position.exchange==="XM"?"Lots":"Quantity",contract_size:position.exchange==="XM"?+ef.contract_size:null,fee_usdt:+ef.fee_usdt||0,notes:ef.notes});setBusy(false);if(error)return alert(error.message);setEf({...ef,entry_date:localNow(),entry_price:"",amount:"",fee_usdt:"",notes:""});await load()}
 async function price(value){let {error}=await client.from("dca_positions").update({current_price:value?+value:null}).eq("id",position.id);if(error)return alert(error.message);await load()}
 async function importBtcHistory(){
  if(!user||busy)return;
  if(!confirm("Import 5 BTC history summaries into the Bitkub DCA position?"))return;
  setBusy(true);
  let target=positions.find(x=>x.exchange==="Bitkub"&&["BTCTHB","BTC/THB","BTC"].includes(x.pair));
  if(!target){
   let {data,error}=await client.from("dca_positions").insert({user_id:user.id,exchange:"Bitkub",pair:"BTCTHB",notes:"BTC accumulation · imported history"}).select().single();
   if(error){setBusy(false);return alert(error.message)}
   target=data;
  }
  let {data:existing,error:readError}=await client.from("dca_entries").select("notes").eq("position_id",target.id);
  if(readError){setBusy(false);return alert(readError.message)}
  let seen=new Set((existing||[]).map(x=>(x.notes||"").split(" · ")[0]));
  let missing=btcHistory.filter(x=>!seen.has("["+x.key+"]"));
  if(missing.length){
   let payload=missing.map(x=>({user_id:user.id,position_id:target.id,entry_date:x.entry_date,entry_price:x.entry_price,amount:x.amount,amount_type:"Quantity",contract_size:null,fee_usdt:x.fee_usdt,notes:"["+x.key+"] · "+x.notes}));
   let {error}=await client.from("dca_entries").insert(payload);
   if(error){setBusy(false);return alert(error.message)}
  }
  setSelected(target.id);await load();setBusy(false);
  alert(missing.length?missing.length+" BTC history records imported":"BTC history is already imported");
 }
 async function removeEntry(id){if(!confirm("Delete this DCA entry?"))return;let {error}=await client.from("dca_entries").delete().eq("id",id);if(error)return alert(error.message);await load()}
 async function removePosition(){if(!confirm("Delete this position and all DCA entries?"))return;let {error}=await client.from("dca_positions").delete().eq("id",position.id);if(error)return alert(error.message);setSelected(null);await load()}
 let currency=position?.exchange==="Bitkub"?"THB":"USD",amountLabel=position?.exchange==="OKX"?"Position Added (USDT)":position?.exchange==="Bitkub"?"Amount Invested (THB)":position?.exchange==="XM"?"Lots":"Quantity / Coins";
 return <div className="dcaPage">
  <section className="panel"><div className="panelHead"><h2>Create DCA Position</h2><small>One position can contain multiple entries</small></div><div className="body form dcaCreate"><label><span>Exchange</span><select value={pf.exchange} onChange={e=>setPf({...pf,exchange:e.target.value})}>{exchanges.map(x=><option key={x}>{x}</option>)}</select></label><label><span>Pair / Symbol</span><input value={pf.pair} onChange={e=>setPf({...pf,pair:e.target.value})}/></label><label><span>Current Price (optional)</span><input type="number" step="any" value={pf.current_price} onChange={e=>setPf({...pf,current_price:e.target.value})}/></label><label><span>Notes</span><input value={pf.notes} onChange={e=>setPf({...pf,notes:e.target.value})}/></label><button disabled={busy} onClick={create}>Create Position</button><button disabled={busy} onClick={importBtcHistory} title="Imports the verified BTC history without creating duplicates">Import BTC History (5 records)</button></div></section>
  <div className="dcaLayout"><section className="panel dcaList"><div className="panelHead"><h2>DCA Positions</h2><small>{positions.length}</small></div><div className="body">{positions.length?positions.map(x=>{let z=summary(x,entries.filter(e=>e.position_id===x.id));return <button className={selected===x.id?"dcaPosition active":"dcaPosition"} key={x.id} onClick={()=>setSelected(x.id)}><span><b>{x.pair}</b><small>{x.exchange} · {z.count} entries</small></span><strong>{z.quantity?num(z.breakEven):"—"}</strong></button>}):<div className="emptyState">Create the first position</div>}</div></section>
  <div>{position?<><div className="kpis dcaKpis"><div className="card"><span>AVERAGE ENTRY</span><b>{s.quantity?num(s.average):"—"}</b></div><div className="card"><span>COST / COIN + FEES</span><b>{s.quantity?num(s.breakEven):"—"}</b></div><div className="card"><span>TOTAL QUANTITY</span><b>{num(s.quantity)}</b></div><div className="card"><span>TOTAL INVESTED</span><b>{money(s.total,currency)}</b></div><div className="card"><span>UNREALIZED P&L</span><b className={s.pnl>=0?"pos":"neg"}>{position.current_price?money(s.pnl,currency):"—"}</b></div><div className="card"><span>RETURN</span><b className={s.returnPct>=0?"pos":"neg"}>{position.current_price?s.returnPct.toFixed(2)+"%":"—"}</b></div></div>
  <section className="panel"><div className="panelHead"><h2>{position.exchange} · {position.pair}</h2><button className="delete" onClick={removePosition}>Delete Position</button></div><div className="body currentPrice"><label><span>Current Price ({currency})</span><input type="number" step="any" defaultValue={position.current_price||""} onBlur={e=>price(e.target.value)}/></label><small>Update to calculate unrealized P&L</small></div></section>
  <section className="panel"><div className="panelHead"><h2>Add DCA Entry</h2><small>Every entry remains visible</small></div><div className="body form"><label><span>Date / Time</span><input type="datetime-local" value={ef.entry_date} onChange={e=>setEf({...ef,entry_date:e.target.value})}/></label><label><span>Entry Price</span><input type="number" step="any" value={ef.entry_price} onChange={e=>setEf({...ef,entry_price:e.target.value})}/></label><label><span>{amountLabel}</span><input type="number" step="any" value={ef.amount} onChange={e=>setEf({...ef,amount:e.target.value})}/></label>{position.exchange==="XM"&&<label><span>Contract Size / Lot</span><input type="number" step="any" value={ef.contract_size} onChange={e=>setEf({...ef,contract_size:e.target.value})}/></label>}<label><span>Fee ({currency})</span><input type="number" step="any" value={ef.fee_usdt} onChange={e=>setEf({...ef,fee_usdt:e.target.value})}/></label><label><span>Notes</span><input value={ef.notes} onChange={e=>setEf({...ef,notes:e.target.value})}/></label><button disabled={busy} onClick={add}>Add Entry</button></div></section>
  <section className="panel"><div className="panelHead"><h2>Entry History</h2><small>{s.count} entries</small></div><div className="body table"><table><thead><tr><th>Date</th><th>Entry Price</th><th>Input</th><th>Quantity</th><th>Cost</th><th>Fee</th><th>Running Cost/Coin</th><th>Notes</th><th></th></tr></thead><tbody>{running(position,rows).map(x=><tr key={x.id}><td>{new Date(x.entry_date).toLocaleString()}</td><td>{num(x.entry_price)}</td><td>{num(x.amount)} {x.amount_type}</td><td>{num(x.qty)}</td><td>{money(x.cost,currency)}</td><td>{money(x.fee_usdt,currency)}</td><td><b>{num(x.runningAverage)}</b></td><td>{x.notes||"—"}</td><td><button className="delete" onClick={()=>removeEntry(x.id)}>Delete</button></td></tr>)}{!rows.length&&<tr><td colSpan="9" className="emptyState">No DCA entries yet</td></tr>}</tbody></table></div></section></>:<section className="panel"><div className="emptyState">Select a position to add DCA entries</div></section>}</div></div>
 </div>
}