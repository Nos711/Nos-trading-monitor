"use client";

import {useEffect} from "react";

export default function PortfolioNavInjector(){
  useEffect(()=>{
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
  },[]);

  return null;
}
