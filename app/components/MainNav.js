"use client";
import Link from "next/link";

export default function MainNav({active="Dashboard",onTab}){
 const tabs=["Dashboard","Calendar","Journal","Ongoing","Analytics","DCA"];
 return <nav>
  {tabs.map(x=>active==="Portfolio"
   ? <Link href={`/dashboard?tab=${encodeURIComponent(x)}`} key={x}><button>{x}</button></Link>
   : <button className={active===x?"active":""} onClick={()=>onTab?.(x)} key={x}>{x}</button>
  )}
  <Link href="/portfolio"><button className={active==="Portfolio"?"active":""}>Portfolio</button></Link>
 </nav>;
}
