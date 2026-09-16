"use client";

import {useEffect} from "react";
import {usePathname} from "next/navigation";

export default function PortfolioNavInjector(){
  const pathname=usePathname();

  useEffect(()=>{
    if(!pathname?.startsWith("/dashboard")) return;

    const addPortfolio=()=>{
      const nav=document.querySelector("main.shell > nav");
      if(!nav || nav.querySelector('[data-portfolio-nav="true"]')) return false;

      const link=document.createElement("a");
      link.href="/portfolio";
      link.setAttribute("data-portfolio-nav","true");
      link.style.textDecoration="none";

      const button=document.createElement("button");
      button.type="button";
      button.textContent="Portfolio";
      link.appendChild(button);
      nav.appendChild(link);
      return true;
    };

    if(addPortfolio()) return;

    const observer=new MutationObserver(()=>{
      if(addPortfolio()) observer.disconnect();
    });
    observer.observe(document.body,{childList:true,subtree:true});

    const timer=setTimeout(()=>observer.disconnect(),5000);
    return ()=>{observer.disconnect();clearTimeout(timer)};
  },[pathname]);

  return null;
}
