"use client";

import {useEffect} from "react";

export default function PortfolioNavInjector(){
  useEffect(()=>{
    const inject=()=>{
      if(!window.location.pathname.startsWith("/dashboard")) return;
      const nav=document.querySelector("main.shell > nav");
      if(!nav || nav.querySelector('[data-portfolio-nav="true"]')) return;

      const link=document.createElement("a");
      link.href="/portfolio";
      link.setAttribute("data-portfolio-nav","true");
      link.style.textDecoration="none";

      const button=document.createElement("button");
      button.type="button";
      button.textContent="Portfolio";
      link.appendChild(button);
      nav.appendChild(link);
    };

    inject();

    // Root layout stays mounted during Next.js client-side navigation.
    // Observe DOM changes so Portfolio is re-injected whenever Dashboard mounts.
    const observer=new MutationObserver(()=>inject());
    observer.observe(document.body,{childList:true,subtree:true});

    // Also cover browser back/forward navigation.
    const onRouteChange=()=>setTimeout(inject,0);
    window.addEventListener("popstate",onRouteChange);

    return ()=>{
      observer.disconnect();
      window.removeEventListener("popstate",onRouteChange);
    };
  },[]);

  return null;
}
