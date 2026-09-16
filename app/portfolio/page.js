"use client";
import PortfolioPage from "../dashboard/PortfolioPage";
import MainNav from "../components/MainNav";

export default function Portfolio(){
 return <main className="shell">
  <header><div><small>PRIVATE TRADING OS</small><h1>NØS Portfolio</h1></div></header>
  <MainNav active="Portfolio"/>
  <PortfolioPage/>
 </main>;
}
