import "./styles.css";
import PortfolioNavInjector from "./PortfolioNavInjector";

export const metadata={title:"NØS Trading Monitor"};

export default function Layout({children}){
  return <html lang="th"><body>
    {children}
    <PortfolioNavInjector/>
    <a className="challengeFloat" href="/challenge">20-Trade Challenge</a>
  </body></html>
}
