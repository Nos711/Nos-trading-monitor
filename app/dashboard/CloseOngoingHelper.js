"use client";
import {useEffect} from "react";
import {supabase} from "../../lib/supabase";

export default function CloseOngoingHelper(){
 useEffect(()=>{
  const s=supabase();
  let stopped=false;

  async function goJournalAfterReload(){
   if(sessionStorage.getItem("nosGoJournal")!=="1")return;
   sessionStorage.removeItem("nosGoJournal");
   setTimeout(()=>{
    const btn=[...document.querySelectorAll("nav button")].find(b=>b.textContent?.trim()==="Journal");
    if(btn)btn.click();
   },300);
  }

  async function injectButtons(){
   if(stopped)return;
   const panels=[...document.querySelectorAll("section.panel")];
   const panel=panels.find(p=>p.querySelector("h2")?.textContent?.trim()==="Current Ongoing Positions");
   if(!panel)return;

   const {data,error}=await s.from("trades").select("id,exchange,pair,side,entry,risk_usd,position_status").eq("position_status","Open");
   if(error||!data)return;

   const rows=[...panel.querySelectorAll("tbody tr")];
   rows.forEach(row=>{
    const cells=row.querySelectorAll("td");
    if(cells.length<16)return;
    const exchange=cells[2]?.textContent?.trim();
    const pair=cells[3]?.textContent?.trim();
    const side=cells[4]?.textContent?.trim();
    const entry=Number(cells[5]?.textContent?.replace(/,/g,"")||0);
    const trade=data.find(x=>x.exchange===exchange&&x.pair===pair&&x.side===side&&Number(x.entry)===entry);
    if(!trade)return;

    const actionCell=cells[cells.length-1];
    if(actionCell.querySelector('[data-mark-closed="1"]'))return;
    const btn=document.createElement("button");
    btn.type="button";
    btn.textContent="Mark Closed";
    btn.className="ghost";
    btn.dataset.markClosed="1";
    btn.style.marginRight="6px";
    btn.onclick=async()=>{
     const value=window.prompt("Realized P&L (USDT)","0");
     if(value===null)return;
     const pnl=Number(value);
     if(!Number.isFinite(pnl))return window.alert("Please enter a valid Realized P&L");
     const risk=Number(trade.risk_usd||0);
     const payload={
      position_status:"Closed",
      closed_at:new Date().toISOString(),
      pnl_usd:pnl,
      r_multiple:risk?pnl/risk:0,
      close_reason:pnl>=0?"Take Profit":"Stop Loss"
     };
     const {error:updateError}=await s.from("trades").update(payload).eq("id",trade.id);
     if(updateError)return window.alert(updateError.message);
     sessionStorage.setItem("nosGoJournal","1");
     location.reload();
    };
    actionCell.prepend(btn);
   });
  }

  goJournalAfterReload();
  injectButtons();
  const observer=new MutationObserver(()=>injectButtons());
  observer.observe(document.body,{childList:true,subtree:true});
  const timer=setInterval(injectButtons,1200);
  return()=>{stopped=true;observer.disconnect();clearInterval(timer)};
 },[]);
 return null;
}
