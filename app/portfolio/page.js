"use client";
import Link from "next/link";
import PortfolioPage from "../dashboard/PortfolioPage";

export default function Portfolio(){
 return <main className="shell">
  <header><div><small>PRIVATE TRADING OS</small><h1>NØS Portfolio</h1></div><div><Link href="/dashboard"><button className="ghost">← Trading Monitor</button></Link></div></header>
  <nav><Link href="/dashboard"><button>Dashboard</button></Link><Link href="/portfolio"><button className="active">Portfolio</button></Link></nav>
  <PortfolioPage/>
 </main>;
}
