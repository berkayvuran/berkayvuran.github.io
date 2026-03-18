import { useState } from "react";

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;-webkit-font-smoothing:antialiased;}
    body{margin:0;background:#FFFBFE;font-family:'Nunito','Google Sans',sans-serif;}
    ::-webkit-scrollbar{display:none;}*{scrollbar-width:none;}
    input,select,button{font-family:inherit;-webkit-appearance:none;appearance:none;}
    input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
    .rip{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s,filter .12s;}
    .rip:active{transform:scale(.96);filter:brightness(.92);}
    .ink{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background .08s;}
    .ink:active{background:rgba(0,0,0,.05)!important;}
    @keyframes su{from{transform:translateY(26px);opacity:0}to{transform:translateY(0);opacity:1}}
    @keyframes shu{from{transform:translateY(110%)}to{transform:translateY(0)}}
    @keyframes fi{from{opacity:0}to{opacity:1}}
    @keyframes bi{from{width:0}to{width:var(--bw,0%)}}
    .su{animation:su .3s cubic-bezier(.25,.46,.45,.94) both;}
    .shu{animation:shu .38s cubic-bezier(.32,.72,0,1) both;}
    .fi{animation:fi .18s ease both;}
    .bi{animation:bi .5s cubic-bezier(.25,.46,.45,.94) both;}
    .d1{animation-delay:.05s}.d2{animation-delay:.10s}.d3{animation-delay:.15s}.d4{animation-delay:.20s}
    .seg{display:flex;border-radius:40px;overflow:hidden;padding:3px;gap:3px;}
    .segb{flex:1;padding:8px 4px;border:none;font-size:13px;font-weight:800;cursor:pointer;
      transition:all .18s;font-family:inherit;border-radius:36px;}
    .chip{display:inline-flex;align-items:center;padding:7px 16px;border-radius:8px;
      font-size:13px;font-weight:800;border:1.5px solid;cursor:pointer;font-family:inherit;
      transition:all .15s;white-space:nowrap;}
    .npill{transition:all .22s cubic-bezier(.34,1.2,.64,1);}
    .fab{transition:transform .15s cubic-bezier(.34,1.4,.64,1);}
    .fab:active{transform:scale(.93);}
  `}</style>
);

const PAL = {
  family:{
    primary:"#1C6B4A",onPrimary:"#fff",primaryContainer:"#A8F2C8",onPrimaryContainer:"#002112",
    secondary:"#4F6358",secondaryContainer:"#D2E8D9",surface:"#F8FDF8",surfaceVariant:"#DCE5DC",
    onSurface:"#191C19",onSurfaceVariant:"#404943",outline:"#707973",outlineVariant:"#C0C9C1",
    error:"#BA1A1A",errorContainer:"#FFDAD6",success:"#1C6B4A",successContainer:"#A8F2C8",
    warning:"#7C5800",warningContainer:"#FFDEA5",navBg:"#EEF4EE",
    inverseSurface:"#2E312E",inverseOnSurface:"#EFF1ED",
  },
  team:{
    primary:"#0061A4",onPrimary:"#fff",primaryContainer:"#D1E4FF",onPrimaryContainer:"#001D36",
    secondary:"#535F70",secondaryContainer:"#D7E3F8",surface:"#F8FCFF",surfaceVariant:"#DDE3EA",
    onSurface:"#1A1C1E",onSurfaceVariant:"#41474D",outline:"#72787E",outlineVariant:"#C1C7CE",
    error:"#BA1A1A",errorContainer:"#FFDAD6",success:"#1C6B4A",successContainer:"#A8F2C8",
    warning:"#7C5800",warningContainer:"#FFDEA5",navBg:"#ECF1F8",
    inverseSurface:"#2F3033",inverseOnSurface:"#F1F0F4",
  },
};

const MODES = {
  family:{id:"family",label:"Family",tagline:"Household finances, together",emoji:"🏠",
    income:"Income",expense:"Expense",period:"Month",surplus:"Savings",
    cats:["Groceries","Rent","Utilities","Transport","Health","Education","Dining Out","Entertainment","Clothing","Savings"]},
  team:{id:"team",label:"Team",tagline:"Shared costs, zero confusion",emoji:"👥",
    income:"Contributions",expense:"Expense",period:"Period",surplus:"Leftover",
    cats:["Accommodation","Food & Drinks","Transport","Activities","Shopping","Insurance","Fees","Equipment"]},
};

const SEED=[
  {id:1,date:"2024-03-15",desc:"Weekly groceries",  cat:"Groceries",    amt:-142.50,who:"Can"},
  {id:2,date:"2024-03-14",desc:"Monthly rent",       cat:"Rent",         amt:-1800,  who:"Joint"},
  {id:3,date:"2024-03-14",desc:"March salary",       cat:"Income",       amt:4200,   who:"Melike"},
  {id:4,date:"2024-03-13",desc:"Netflix & Spotify",  cat:"Entertainment",amt:-28.98, who:"Can"},
  {id:5,date:"2024-03-12",desc:"Electricity bill",   cat:"Utilities",    amt:-87.40, who:"Joint"},
  {id:6,date:"2024-03-11",desc:"School supplies",    cat:"Education",    amt:-64.20, who:"Joint"},
  {id:7,date:"2024-03-10",desc:"Freelance income",   cat:"Income",       amt:850,    who:"Can"},
  {id:8,date:"2024-03-09",desc:"Restaurant dinner",  cat:"Dining Out",   amt:-93.60, who:"Melike"},
  {id:9,date:"2024-03-08",desc:"Metro passes",       cat:"Transport",    amt:-45,    who:"Melike"},
  {id:10,date:"2024-03-07",desc:"Pharmacy",          cat:"Health",       amt:-32.80, who:"Can"},
];

const BUDGETS={
  Groceries:500,Rent:1800,Utilities:200,Transport:150,Health:100,Education:150,
  "Dining Out":200,Entertainment:100,Clothing:100,Savings:500,
  Accommodation:1200,"Food & Drinks":400,Activities:300,Shopping:200,Insurance:150,Fees:100,Equipment:500,
};

const BILLS_SEED=[
  {id:1,name:"Rent",         amt:1800, cat:"Housing",  due:1, icon:"🏠",on:true, type:"bill"},
  {id:2,name:"Electricity",  amt:87,   cat:"Utilities",due:5, icon:"⚡",on:true, type:"bill"},
  {id:3,name:"Internet",     amt:49,   cat:"Utilities",due:8, icon:"📡",on:true, type:"bill"},
  {id:4,name:"Netflix",      amt:15.99,cat:"Streaming",due:12,icon:"🎬",on:true, type:"sub"},
  {id:5,name:"Spotify",      amt:9.99, cat:"Streaming",due:12,icon:"🎵",on:true, type:"sub"},
  {id:6,name:"Phone",        amt:45,   cat:"Utilities",due:15,icon:"📱",on:true, type:"bill"},
  {id:7,name:"Car Insurance",amt:112,  cat:"Insurance",due:18,icon:"🚗",on:true, type:"bill"},
  {id:8,name:"Gym",          amt:39,   cat:"Health",   due:20,icon:"💪",on:true, type:"sub"},
  {id:9,name:"iCloud",       amt:2.99, cat:"Software", due:22,icon:"☁️",on:true, type:"sub"},
  {id:10,name:"Amazon Prime",amt:14.99,cat:"Shopping", due:24,icon:"📦",on:false,type:"sub"},
  {id:11,name:"Water Bill",  amt:34,   cat:"Utilities",due:25,icon:"💧",on:true, type:"bill"},
];

const DEBT_SEED=[
  {id:1,name:"Car Loan",    total:12400,remaining:8750, monthly:320,rate:6.9, icon:"🚗"},
  {id:2,name:"Student Loan",total:28000,remaining:19200,monthly:480,rate:4.5, icon:"🎓"},
  {id:3,name:"Credit Card", total:3200, remaining:2100, monthly:150,rate:19.9,icon:"💳"},
];

const TREND=[
  {m:"Oct",inc:5050,exp:3820},{m:"Nov",inc:5050,exp:4210},{m:"Dec",inc:5900,exp:5100},
  {m:"Jan",inc:5050,exp:3650},{m:"Feb",inc:5050,exp:3990},{m:"Mar",inc:5050,exp:2294,cur:true},
];
const YEARLY=[
  {m:"Jan",inc:4800,exp:3600},{m:"Feb",inc:5050,exp:3990},{m:"Mar",inc:5050,exp:2294},
  {m:"Apr",inc:5200,exp:4100},{m:"May",inc:5050,exp:3750},{m:"Jun",inc:5400,exp:4800},
  {m:"Jul",inc:5050,exp:3400},{m:"Aug",inc:5050,exp:4200},{m:"Sep",inc:5600,exp:3900},
  {m:"Oct",inc:5050,exp:3820},{m:"Nov",inc:5050,exp:4210},{m:"Dec",inc:5900,exp:5100},
];

const TODAY = 17;

const $  = (n,abs=false) => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(abs?Math.abs(n):n);
const $d = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(n);

const CCOLS=["#6750A4","#1C6B4A","#0061A4","#B3261E","#7C5800","#006874","#984061","#006E1C","#4A6267","#775930"];
const cc = s => CCOLS[Math.abs([...s].reduce((a,c)=>a+c.charCodeAt(0),0))%CCOLS.length];

const CAT_EMOJI = {
  Groceries:"🛒", Rent:"🏠", Utilities:"⚡", Transport:"🚌", Health:"💊",
  Education:"📚", "Dining Out":"🍽", Entertainment:"🎬", Clothing:"👗",
  Savings:"💰", Income:"💵", Accommodation:"🏨", "Food & Drinks":"🥗",
  Activities:"🎿", Shopping:"🛍", Insurance:"🛡", Fees:"📋", Equipment:"🔧",
  Housing:"🏠", Streaming:"📺", Software:"💻",
};

/* ── ICONS ── */
const Icon = ({n,s=22,col="currentColor",w=1.9}) => {
  const P = {
    home:"M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1z M9 21V12h6v9",
    list:"M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    wallet:"M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M21 12a2 2 0 000 4h1v-4h-1z",
    repeat:"M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3",
    chart:"M18 20V10M12 20V4M6 20v-6",
    plus:"M12 5v14M5 12h14",
    x:"M18 6L6 18M6 6l12 12",
    chevR:"M9 18l6-6-6-6",
    chevL:"M15 18l-6-6 6-6",
    warn:"M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    dl:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
    up:"M18 15l-6-6-6 6",
    dn:"M6 9l6 6 6-6",
    cal:"M3 4h18M3 8h18M3 4v16a2 2 0 002 2h14a2 2 0 002-2V4M8 2v4m8-4v4",
    spark:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={col}
      strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {(P[n]||"").split("M").filter(Boolean).map((d,i)=><path key={i} d={"M"+d}/>)}
    </svg>
  );
};

/* ── LOGO ── */
const Logo = ({size=44,primary="#1C6B4A"}) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
    <rect width="44" height="44" rx="14" fill={primary}/>
    <circle cx="14" cy="15" r="4.5" fill="rgba(255,255,255,.93)"/>
    <path d="M7 30c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="rgba(255,255,255,.93)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
    <circle cx="30" cy="15" r="4.5" fill="rgba(255,255,255,.93)"/>
    <path d="M23 30c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="rgba(255,255,255,.93)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
    <path d="M19 22h6" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M20.5 20.2L18.5 22l2 1.8" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M23.5 20.2L25.5 22l-2 1.8" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

/* ── PRIMITIVES ── */
const Card = ({children,r=16,p=16,style={}}) => (
  <div style={{background:"#fff",borderRadius:r,padding:p,overflow:"hidden",...style}}>{children}</div>
);
const Divider = ({indent=0}) => (
  <div style={{height:1,background:"rgba(0,0,0,.07)",marginLeft:indent}}/>
);
const Bar = ({pct,color,h=7}) => (
  <div style={{height:h,background:"rgba(0,0,0,.08)",borderRadius:h/2,overflow:"hidden"}}>
    <div className="bi" style={{"--bw":Math.min(100,pct)+"%",height:"100%",background:color,borderRadius:h/2}}/>
  </div>
);
const M3Switch = ({on,toggle,pal}) => (
  <button onClick={toggle} style={{width:52,height:32,borderRadius:16,border:"none",cursor:"pointer",
    padding:2,background:on?pal.primary:"transparent",
    boxShadow:on?"none":"inset 0 0 0 2px "+pal.outline,
    transition:"background .2s",position:"relative",flexShrink:0}}>
    <div style={{width:on?24:20,height:on?24:20,borderRadius:"50%",
      background:on?pal.onPrimary:pal.outline,position:"absolute",top:"50%",
      left:on?"calc(100% - 2px)":"2px",
      transform:on?"translate(-100%,-50%)":"translateY(-50%)",
      transition:"all .2s cubic-bezier(.34,1.2,.64,1)",
      boxShadow:"0 1px 4px rgba(0,0,0,.22)"}}/>
  </button>
);
const Chip = ({label,active,pal,onClick}) => (
  <button className="chip rip" onClick={onClick} style={{
    background:active?pal.secondaryContainer:"transparent",
    color:active?pal.primary:pal.onSurfaceVariant,
    borderColor:active?"transparent":pal.outline}}>
    {label}
  </button>
);
const Seg = ({opts,val,onChange,pal}) => (
  <div className="seg" style={{background:pal.surfaceVariant}}>
    {opts.map(([v,l]) => (
      <button key={v} className="segb rip" onClick={()=>onChange(v)} style={{
        background:val===v?"#fff":"transparent",
        color:val===v?pal.primary:pal.onSurfaceVariant,
        boxShadow:val===v?"0 1px 4px rgba(0,0,0,.12)":"none"}}>
        {l}
      </button>
    ))}
  </div>
);
const SLbl = ({children}) => (
  <div style={{fontSize:11,fontWeight:800,letterSpacing:".7px",textTransform:"uppercase",
    color:"rgba(0,0,0,.38)",marginBottom:8,padding:"0 2px"}}>{children}</div>
);
const CatIcon = ({cat,size=44}) => {
  const emoji = CAT_EMOJI[cat] || "💳";
  const col = cc(cat);
  return (
    <div style={{width:size,height:size,borderRadius:Math.round(size*.27),
      background:col+"1A",display:"flex",alignItems:"center",
      justifyContent:"center",flexShrink:0,fontSize:Math.round(size*.46),lineHeight:1}}>
      {emoji}
    </div>
  );
};
const Amt = ({v,pal,size=14}) => (
  <span style={{fontSize:size,fontWeight:900,color:v>0?pal.success:"#1A1C1E",whiteSpace:"nowrap"}}>
    {v>0?"+":""}{$d(v)}
  </span>
);
const Toast = ({msg,pal}) => (
  <div style={{position:"fixed",bottom:96,left:"50%",transform:"translateX(-50%)",
    background:pal.inverseSurface,color:pal.inverseOnSurface,
    padding:"12px 24px",borderRadius:4,fontSize:14,fontWeight:700,
    zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 6px 12px rgba(0,0,0,.22)",pointerEvents:"none"}}>
    {msg}
  </div>
);
const FAB = ({onClick,pal,label}) => (
  <button className="fab rip" onClick={onClick} style={{
    position:"fixed",bottom:90,right:20,
    background:pal.primaryContainer,color:pal.primary,
    border:"none",borderRadius:16,padding:"16px 22px",
    display:"flex",alignItems:"center",gap:10,
    fontSize:15,fontWeight:800,cursor:"pointer",
    boxShadow:"0 3px 10px rgba(0,0,0,.18)",zIndex:100}}>
    <Icon n="plus" s={20} col={pal.primary} w={2.5}/>{label}
  </button>
);
const Field = ({placeholder,value,onChange,type="text",style={}}) => (
  <div style={{position:"relative",marginBottom:12}}>
    <input placeholder=" " value={value} onChange={onChange} type={type}
      style={{width:"100%",padding:"20px 16px 8px",border:"1.5px solid rgba(0,0,0,.2)",
        borderRadius:4,fontSize:16,fontWeight:600,color:"#1A1C1E",
        background:"transparent",outline:"none",...style}}/>
    <div style={{position:"absolute",top:value?"6px":"50%",left:16,
      transform:value?"none":"translateY(-50%)",
      fontSize:value?11:16,fontWeight:600,color:"rgba(0,0,0,.45)",
      transition:"all .15s",pointerEvents:"none"}}>
      {placeholder}
    </div>
  </div>
);
const SelField = ({label,value,onChange,children}) => (
  <div style={{position:"relative",marginBottom:12}}>
    <select value={value} onChange={onChange}
      style={{width:"100%",padding:"20px 16px 8px",border:"1.5px solid rgba(0,0,0,.2)",
        borderRadius:4,fontSize:16,fontWeight:600,color:"#1A1C1E",
        background:"transparent",outline:"none",appearance:"none"}}>
      {children}
    </select>
    <div style={{position:"absolute",top:6,left:16,fontSize:11,fontWeight:600,
      color:"rgba(0,0,0,.45)",pointerEvents:"none"}}>{label}</div>
  </div>
);

/* ── BOTTOM SHEET ── */
const Sheet = ({onClose,title,children}) => (
  <div className="fi" onClick={onClose}
    style={{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",zIndex:400,
      display:"flex",alignItems:"flex-end"}}>
    <div className="shu" onClick={e=>e.stopPropagation()}
      style={{background:"#FFFBFE",borderRadius:"28px 28px 0 0",width:"100%",
        maxWidth:430,margin:"0 auto",maxHeight:"92vh",overflowY:"auto"}}>
      <div style={{width:32,height:4,borderRadius:2,background:"rgba(0,0,0,.18)",
        margin:"12px auto 0"}}/>
      <div style={{display:"flex",alignItems:"center",padding:"14px 20px 16px"}}>
        <button className="rip" onClick={onClose}
          style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",
            cursor:"pointer",color:"#0061A4",fontSize:15,fontWeight:800,padding:"4px 0"}}>
          <Icon n="chevL" s={20} col="currentColor" w={2.5}/>Back
        </button>
        <div style={{flex:1,textAlign:"center",fontSize:17,fontWeight:900,color:"#1A1C1E"}}>{title}</div>
        <div style={{width:64}}/>
      </div>
      <div style={{padding:"0 20px 40px"}}>{children}</div>
    </div>
  </div>
);

/* ── NAV BAR ── */
const NavBar = ({tab,set,pal}) => {
  const tabs=[
    {id:"home",n:"home",label:"Home"},
    {id:"entries",n:"list",label:"Entries"},
    {id:"budget",n:"wallet",label:"Budget"},
    {id:"bills",n:"repeat",label:"Bills"},
    {id:"reports",n:"chart",label:"Reports"},
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
      width:"100%",maxWidth:430,background:pal.navBg,
      borderTop:"1px solid "+pal.outlineVariant,display:"flex",zIndex:200,paddingBottom:14}}>
      {tabs.map(t => {
        const active = tab===t.id;
        return (
          <button key={t.id} className="rip" onClick={()=>set(t.id)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",
              gap:2,paddingTop:10,background:"none",border:"none",cursor:"pointer"}}>
            <div className="npill" style={{width:active?64:0,height:32,borderRadius:16,
              background:active?pal.secondaryContainer:"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
              {active && <Icon n={t.n} s={22} col={pal.primary} w={2.2}/>}
            </div>
            {!active && (
              <div style={{height:32,display:"flex",alignItems:"center",marginTop:-32}}>
                <Icon n={t.n} s={22} col={pal.onSurfaceVariant} w={1.8}/>
              </div>
            )}
            <span style={{fontSize:11,fontWeight:active?900:600,
              color:active?pal.primary:pal.onSurfaceVariant}}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};

/* ══ SCREENS ══════════════════════════════════════════════════════════════ */

/* MODE PICKER */
function ModePicker({onPick}) {
  return (
    <div style={{minHeight:"100vh",background:"#FFFBFE",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",padding:"0 24px"}}>
      <GS/>
      <div className="su" style={{textAlign:"center",marginBottom:52}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
          <Logo size={84} primary="#1C6B4A"/>
        </div>
        <div style={{fontSize:42,fontWeight:900,letterSpacing:"-1.2px",color:"#1A1C1E",lineHeight:1}}>Splitty</div>
        <div style={{fontSize:16,color:"rgba(0,0,0,.5)",marginTop:10,fontWeight:700}}>Simple budgeting for every situation</div>
      </div>
      <div className="su d2" style={{width:"100%",maxWidth:390,display:"flex",flexDirection:"column",gap:12}}>
        {Object.values(MODES).map(m => {
          const p = PAL[m.id];
          return (
            <button key={m.id} className="rip" onClick={()=>onPick(m.id)}
              style={{background:p.primaryContainer,border:"none",borderRadius:24,padding:"22px",
                display:"flex",alignItems:"center",gap:18,cursor:"pointer",textAlign:"left",width:"100%"}}>
              <div style={{width:60,height:60,borderRadius:18,background:p.primary,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0}}>
                {m.emoji}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:19,fontWeight:900,color:p.onPrimaryContainer,marginBottom:4}}>{m.label}</div>
                <div style={{fontSize:14,color:p.secondary,fontWeight:700,lineHeight:1.4}}>{m.tagline}</div>
              </div>
              <Icon n="chevR" s={20} col={p.primary} w={2.5}/>
            </button>
          );
        })}
      </div>
      <div className="su d3" style={{marginTop:32,fontSize:13,fontWeight:700,color:"rgba(0,0,0,.28)"}}>
        Switch modes anytime inside the app
      </div>
    </div>
  );
}

/* HOME */
function HomeScreen({m,pal,tx,income,spent,bal,catSpend,onAdd,onSwitch}) {
  const topCats  = Object.entries(catSpend).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const warnCats = Object.entries(catSpend).filter(([c,v])=>c!=="Rent"&&BUDGETS[c]&&v>BUDGETS[c]*.82);
  const savePct  = income>0?Math.round((bal/income)*100):0;
  const spentPct = income>0?Math.min(100,Math.round((spent/income)*100)):0;

  return (
    <div style={{background:"#FFFBFE",paddingBottom:8}}>
      {/* App bar */}
      <div style={{padding:"16px 20px 8px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Logo size={36} primary={pal.primary}/>
          <div>
            <div style={{fontSize:22,fontWeight:900,color:pal.onSurface,letterSpacing:"-.5px",lineHeight:1}}>Splitty</div>
            <div style={{fontSize:12,fontWeight:700,color:pal.onSurfaceVariant,marginTop:1}}>{m.emoji} {m.label} · March 2024</div>
          </div>
        </div>
        <button className="rip" onClick={onSwitch}
          style={{background:pal.secondaryContainer,color:pal.primary,border:"none",
            borderRadius:20,padding:"8px 16px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
          Switch
        </button>
      </div>

      <div style={{padding:"4px 16px"}}>
        {/* Hero tonal card */}
        <div className="su d1" style={{background:pal.primaryContainer,borderRadius:28,
          padding:"24px 24px 20px",marginBottom:14,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-40,top:-40,width:160,height:160,
            borderRadius:"50%",background:pal.primary,opacity:.07,pointerEvents:"none"}}/>
          <div style={{position:"relative"}}>
            <div style={{fontSize:12,fontWeight:800,color:pal.primary,letterSpacing:".6px",
              textTransform:"uppercase",marginBottom:8}}>{m.period} Balance</div>
            <div style={{fontSize:52,fontWeight:900,color:pal.onPrimaryContainer,
              letterSpacing:"-2px",lineHeight:1,marginBottom:6}}>{$(bal)}</div>
            <div style={{fontSize:14,fontWeight:700,color:pal.secondary,marginBottom:18}}>
              {savePct>=0 ? "Saving "+savePct+"% of "+m.income.toLowerCase() : "Over budget by "+$(Math.abs(bal),true)}
            </div>
            <div style={{marginBottom:4}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                <span style={{fontSize:12,fontWeight:800,color:pal.primary}}>Spent {spentPct}%</span>
                <span style={{fontSize:12,fontWeight:700,color:pal.primary}}>of {m.income.toLowerCase()}</span>
              </div>
              <div style={{height:8,background:pal.primary+"28",borderRadius:4,overflow:"hidden"}}>
                <div className="bi" style={{"--bw":spentPct+"%",height:"100%",background:pal.primary,borderRadius:4}}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,
              marginTop:16,paddingTop:16,borderTop:"1px solid "+pal.primary+"25"}}>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:pal.primary,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>
                  {"↑ "+m.income}
                </div>
                <div style={{fontSize:22,fontWeight:900,color:pal.onPrimaryContainer}}>{$(income)}</div>
              </div>
              <div>
                <div style={{fontSize:11,fontWeight:800,color:pal.primary,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>
                  {"↓ "+m.expense}
                </div>
                <div style={{fontSize:22,fontWeight:900,color:pal.onPrimaryContainer}}>{$(spent)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning */}
        {warnCats.length>0 && (
          <div className="su" style={{background:pal.warningContainer,borderRadius:16,
            padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <Icon n="warn" s={18} col={pal.warning} w={2}/>
            <div>
              <div style={{fontSize:13,fontWeight:800,color:pal.warning}}>Approaching limit</div>
              <div style={{fontSize:12,fontWeight:700,color:pal.warning,opacity:.8,marginTop:1}}>
                {warnCats.map(([c])=>c).join(", ")}
              </div>
            </div>
          </div>
        )}

        {/* Budget health */}
        <div className="su d2" style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 2px",marginBottom:10}}>
            <div style={{fontSize:18,fontWeight:900,color:pal.onSurface,letterSpacing:"-.3px"}}>Budget Health</div>
            <div style={{fontSize:13,fontWeight:700,color:pal.primary}}>March</div>
          </div>
          <Card r={20} p={0}>
            {topCats.map(([cat,val],i) => {
              const bud = BUDGETS[cat]||500;
              const pct = Math.min(100,(val/bud)*100);
              const over = cat!=="Rent"&&pct>85;
              return (
                <div key={cat} style={{padding:"14px 18px",
                  borderBottom:i<topCats.length-1?"1px solid "+pal.outlineVariant:"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <CatIcon cat={cat} size={32}/>
                      <span style={{fontSize:14,fontWeight:700,color:pal.onSurface}}>{cat}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {over && <span style={{fontSize:10,fontWeight:900,color:pal.error,
                        background:pal.errorContainer,padding:"2px 7px",borderRadius:20}}>OVER</span>}
                      <span style={{fontSize:13,fontWeight:700,color:over?pal.error:pal.onSurfaceVariant}}>
                        {$(val,true)}<span style={{opacity:.5}}>{" / "+$(bud,true)}</span>
                      </span>
                    </div>
                  </div>
                  <Bar pct={pct} color={over?pal.error:pal.primary}/>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Recent */}
        <div className="su d3" style={{marginBottom:14}}>
          <div style={{fontSize:18,fontWeight:900,color:pal.onSurface,letterSpacing:"-.3px",padding:"0 2px",marginBottom:10}}>
            Recent
          </div>
          <Card r={20} p={0}>
            {tx.slice(0,5).map((t,i) => (
              <div key={t.id}>
                <div style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px"}}>
                  <CatIcon cat={t.cat} size={44}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:700,color:pal.onSurface,
                      overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc}</div>
                    <div style={{fontSize:12,fontWeight:600,color:pal.onSurfaceVariant,marginTop:2}}>
                      {t.cat+" · "+t.who}
                    </div>
                  </div>
                  <Amt v={t.amt} pal={pal}/>
                </div>
                {i<4&&<Divider indent={76}/>}
              </div>
            ))}
          </Card>
        </div>

        {/* Savings snapshot */}
        <div className="su d4" style={{marginBottom:8}}>
          <div style={{background:pal.secondaryContainer,borderRadius:20,padding:"16px 20px"}}>
            <div style={{fontSize:11,fontWeight:900,color:pal.primary,textTransform:"uppercase",
              letterSpacing:".5px",marginBottom:12}}>{m.surplus+" Snapshot"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr"}}>
              {[
                {l:"Saved",v:$(Math.max(0,bal))},
                {l:"Save rate",v:Math.max(0,savePct)+"%"},
                {l:"Categories",v:Object.keys(catSpend).length+""},
              ].map(s => (
                <div key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:900,color:pal.primary,letterSpacing:"-.5px"}}>{s.v}</div>
                  <div style={{fontSize:11,fontWeight:700,color:pal.secondary,marginTop:3}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Guide */}
        <AIGuide pal={pal} bal={bal} spent={spent} income={income} catSpend={catSpend} m={m}/>

        <div style={{height:88}}/>
      </div>
      <FAB onClick={onAdd} pal={pal} label="Add Entry"/>
    </div>
  );
}

/* AI GUIDE */
function AIGuide({pal,bal,spent,income,catSpend,m}) {
  const [open,setOpen]   = useState(false);
  const [input,setInput] = useState("");
  const [msgs,setMsgs]   = useState([]);
  const [loading,setLoading] = useState(false);

  const topCat = Object.entries(catSpend).sort((a,b)=>b[1]-a[1])[0];
  const savePct = income>0?Math.round((bal/income)*100):0;

  const contextPrompt = `You are Splitty, a friendly and concise personal finance AI guide built into the Splitty budgeting app.
The user's current financial snapshot for March 2024:
- Mode: ${m.label}
- Total income: $${Math.round(income)}
- Total spent: $${Math.round(spent)}
- Balance: $${Math.round(bal)} (${savePct}% savings rate)
- Biggest expense category: ${topCat ? topCat[0]+" ($"+Math.round(topCat[1])+")" : "none"}
- Categories with spending: ${Object.entries(catSpend).map(([k,v])=>k+": $"+Math.round(v)).join(", ")}

Keep responses short (2-4 sentences max), friendly, practical, and specific to their numbers. Use simple language. No markdown formatting.`;

  const quickPrompts = [
    "How am I doing this month?",
    "Where can I save more?",
    "Give me one money tip",
    "Am I on track?",
  ];

  const send = async (text) => {
    const q = text || input.trim();
    if(!q || loading) return;
    setInput("");
    setMsgs(prev => [...prev, {role:"user",content:q}]);
    setLoading(true);
    try {
      const history = [...msgs, {role:"user",content:q}];
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:200,
          system:contextPrompt,
          messages:history.map(msg=>({role:msg.role,content:msg.content})),
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I had trouble responding. Try again!";
      setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
    } catch(e) {
      setMsgs(prev=>[...prev,{role:"assistant",content:"Couldn't connect right now. Check your connection and try again."}]);
    }
    setLoading(false);
  };

  return (
    <div className="su d4" style={{marginBottom:8}}>
      {!open ? (
        <button className="rip" onClick={()=>setOpen(true)}
          style={{width:"100%",background:"linear-gradient(135deg,"+pal.primary+" 0%,"+pal.secondary+" 100%)",
            border:"none",borderRadius:20,padding:"18px 20px",cursor:"pointer",
            display:"flex",alignItems:"center",gap:14,textAlign:"left",boxShadow:"0 4px 16px "+pal.primary+"30"}}>
          <div style={{width:46,height:46,borderRadius:14,background:"rgba(255,255,255,.2)",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:24}}>
            ✨
          </div>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:"#fff",marginBottom:3}}>Ask your Splitty Guide</div>
            <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,.75)"}}>
              Get personalised tips based on your actual spending
            </div>
          </div>
          <div style={{marginLeft:"auto",color:"rgba(255,255,255,.7)"}}>
            <Icon n="chevR" s={20} col="rgba(255,255,255,.7)" w={2.5}/>
          </div>
        </button>
      ) : (
        <div style={{background:"#fff",borderRadius:24,overflow:"hidden",
          boxShadow:"0 4px 20px rgba(0,0,0,.1)"}}>
          {/* Header */}
          <div style={{background:"linear-gradient(135deg,"+pal.primary+" 0%,"+pal.secondary+" 100%)",
            padding:"16px 18px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:22}}>✨</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:900,color:"#fff"}}>Splitty Guide</div>
              <div style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,.75)"}}>Your personal budget AI</div>
            </div>
            <button className="rip" onClick={()=>setOpen(false)}
              style={{background:"rgba(255,255,255,.2)",border:"none",borderRadius:20,
                width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon n="x" s={16} col="#fff" w={2.5}/>
            </button>
          </div>

          {/* Messages */}
          <div style={{padding:"16px 16px 0",maxHeight:280,overflowY:"auto"}}>
            {msgs.length===0 && (
              <div style={{textAlign:"center",padding:"12px 0 8px"}}>
                <div style={{fontSize:13,fontWeight:700,color:pal.onSurfaceVariant,marginBottom:12}}>
                  Quick questions
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                  {quickPrompts.map(q => (
                    <button key={q} className="rip" onClick={()=>send(q)}
                      style={{background:pal.primaryContainer,color:pal.primary,
                        border:"none",borderRadius:20,padding:"7px 14px",
                        fontSize:13,fontWeight:700,cursor:"pointer"}}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {msgs.map((msg,i) => (
              <div key={i} style={{display:"flex",justifyContent:msg.role==="user"?"flex-end":"flex-start",
                marginBottom:10}}>
                <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:18,
                  background:msg.role==="user"?pal.primary:pal.primaryContainer,
                  color:msg.role==="user"?pal.onPrimary:pal.onPrimaryContainer,
                  fontSize:14,fontWeight:600,lineHeight:1.5,
                  borderBottomRightRadius:msg.role==="user"?4:18,
                  borderBottomLeftRadius:msg.role==="assistant"?4:18}}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{display:"flex",justifyContent:"flex-start",marginBottom:10}}>
                <div style={{background:pal.primaryContainer,borderRadius:18,borderBottomLeftRadius:4,
                  padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{width:6,height:6,borderRadius:"50%",background:pal.primary,
                      animation:"bi .8s ease infinite",animationDelay:i*0.15+"s",opacity:.6}}/>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{padding:"12px 16px 16px",display:"flex",gap:10,alignItems:"center"}}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&send()}
              placeholder="Ask anything about your budget..."
              style={{flex:1,padding:"11px 16px",border:"1.5px solid "+pal.outlineVariant,
                borderRadius:24,fontSize:14,fontWeight:600,color:"#1A1C1E",
                background:"transparent",outline:"none",fontFamily:"inherit"}}/>
            <button className="rip" onClick={()=>send()}
              disabled={!input.trim()||loading}
              style={{width:42,height:42,borderRadius:21,
                background:input.trim()&&!loading?pal.primary:pal.surfaceVariant,
                border:"none",cursor:"pointer",display:"flex",alignItems:"center",
                justifyContent:"center",flexShrink:0,transition:"background .2s"}}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                stroke={input.trim()&&!loading?"#fff":pal.onSurfaceVariant} strokeWidth={2.2}
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ENTRIES */
function EntriesScreen({m,pal,tx,onAdd,onDel}) {
  const [filter,setFilter] = useState("all");
  const [who,setWho]       = useState("All");
  const people = ["All",...new Set(tx.map(t=>t.who))];
  const shown  = tx.filter(t=>{
    if(filter==="income"&&t.amt<=0) return false;
    if(filter==="expense"&&t.amt>=0) return false;
    if(who!=="All"&&t.who!==who) return false;
    return true;
  });
  return (
    <div style={{padding:"0 16px",background:"#FFFBFE",minHeight:"100vh",paddingBottom:120}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0 8px"}}>
        <div style={{fontSize:28,fontWeight:900,color:pal.onSurface,letterSpacing:"-.5px"}}>Entries</div>
        <div style={{fontSize:13,fontWeight:700,color:pal.onSurfaceVariant}}>{shown.length+" items"}</div>
      </div>
      <div style={{marginBottom:12}}><Seg opts={[["all","All"],["income",m.income],["expense",m.expense]]} val={filter} onChange={setFilter} pal={pal}/></div>
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
        {people.map(p=><Chip key={p} label={p} active={who===p} pal={pal} onClick={()=>setWho(p)}/>)}
      </div>
      {shown.length===0
        ? <div style={{textAlign:"center",padding:48,color:pal.onSurfaceVariant,fontSize:15,fontWeight:700}}>No entries found</div>
        : <Card r={20} p={0}>
          {shown.map((t,i)=>(
            <div key={t.id}>
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px"}}>
                <CatIcon cat={t.cat} size={44}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:700,color:pal.onSurface,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.desc}</div>
                  <div style={{fontSize:12,fontWeight:600,color:pal.onSurfaceVariant,marginTop:2}}>
                    {t.cat+" · "+t.date+" · "+t.who}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <Amt v={t.amt} pal={pal}/>
                  <button className="rip" onClick={()=>onDel(t.id)}
                    style={{background:"none",border:"none",cursor:"pointer",padding:4,borderRadius:20}}>
                    <Icon n="x" s={16} col={pal.onSurfaceVariant} w={2}/>
                  </button>
                </div>
              </div>
              {i<shown.length-1&&<Divider indent={76}/>}
            </div>
          ))}
        </Card>
      }
      <FAB onClick={onAdd} pal={pal} label="Add Entry"/>
    </div>
  );
}

/* BUDGET */
function BudgetScreen({m,pal,catSpend}) {
  const alloc = m.cats.reduce((a,c)=>a+(BUDGETS[c]||0),0);
  const used  = m.cats.reduce((a,c)=>a+(catSpend[c]||0),0);
  return (
    <div style={{padding:"0 16px",background:"#FFFBFE",minHeight:"100vh",paddingBottom:100}}>
      <div style={{padding:"20px 0 16px"}}>
        <div style={{fontSize:28,fontWeight:900,color:pal.onSurface,letterSpacing:"-.5px"}}>Budget Overview</div>
        <div style={{fontSize:13,fontWeight:700,color:pal.onSurfaceVariant,marginTop:2}}>March 2024</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {l:m.income,   v:$(alloc),      bg:pal.primaryContainer,  tc:pal.primary},
          {l:"Spent",    v:$(used),        bg:pal.errorContainer,    tc:pal.error},
          {l:"Remaining",v:$(alloc-used),  bg:alloc-used>=0?pal.successContainer:pal.errorContainer,tc:alloc-used>=0?pal.success:pal.error},
        ].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:18,padding:"14px 12px",textAlign:"center"}}>
            <div style={{fontSize:10,fontWeight:900,color:s.tc,marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>{s.l}</div>
            <div style={{fontSize:16,fontWeight:900,color:s.tc,letterSpacing:"-.3px"}}>{s.v}</div>
          </div>
        ))}
      </div>
      <SLbl>Categories</SLbl>
      <Card r={20} p={0}>
        {m.cats.map((cat,i)=>{
          const v=catSpend[cat]||0, bud=BUDGETS[cat]||500;
          const pct=Math.min(100,(v/bud)*100);
          const over=cat!=="Rent"&&v>bud, warn=!over&&cat!=="Rent"&&pct>80;
          const col=over?pal.error:warn?pal.warning:pal.primary;
          return(
            <div key={cat} style={{padding:"14px 18px",borderBottom:i<m.cats.length-1?"1px solid "+pal.outlineVariant:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <CatIcon cat={cat} size={36}/>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:pal.onSurface}}>{cat}</div>
                    {over&&<div style={{fontSize:11,fontWeight:800,color:pal.error}}>Over budget</div>}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:900,color:col}}>{$(v,true)}</div>
                  <div style={{fontSize:11,fontWeight:600,color:pal.onSurfaceVariant}}>{"of "+$(bud,true)}</div>
                </div>
              </div>
              <Bar pct={pct} color={col}/>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* BILLS */
function BillsScreen({m,pal,bills,setBills,ping,onOpenCal}) {
  const [filter,setFilter]   = useState("all");
  const [showAdd,setShowAdd] = useState(false);
  const [showDebt,setShowDebt]= useState(false);
  const [draft,setDraft]     = useState({name:"",amt:"",cat:"",due:"1",icon:"💳",type:"bill"});
  const [debts,setDebts]     = useState(DEBT_SEED);
  const [draftD,setDraftD]   = useState({name:"",total:"",remaining:"",monthly:"",rate:"",icon:"💳"});
  const [expandD,setExpandD] = useState(null);

  const toggle  = id => setBills(bills.map(b=>b.id===id?{...b,on:!b.on}:b));
  const addBill = () => {
    if(!draft.name||!draft.amt) return;
    setBills([...bills,{id:Date.now(),name:draft.name,amt:parseFloat(draft.amt),
      cat:draft.cat||"Other",due:parseInt(draft.due)||1,icon:draft.icon,on:true,type:draft.type}]);
    setDraft({name:"",amt:"",cat:"",due:"1",icon:"💳",type:"bill"});
    setShowAdd(false); ping("Added ✓");
  };
  const addDebt = () => {
    if(!draftD.name||!draftD.total||!draftD.monthly) return;
    setDebts([...debts,{id:Date.now(),name:draftD.name,total:parseFloat(draftD.total),
      remaining:parseFloat(draftD.remaining||draftD.total),
      monthly:parseFloat(draftD.monthly),rate:parseFloat(draftD.rate||0),icon:draftD.icon}]);
    setDraftD({name:"",total:"",remaining:"",monthly:"",rate:"",icon:"💳"});
    setShowDebt(false); ping("Debt added ✓");
  };

  const active   = bills.filter(b=>b.on);
  const totalMo  = active.reduce((a,b)=>a+b.amt,0);
  const paid     = active.filter(b=>b.due<TODAY).reduce((a,b)=>a+b.amt,0);
  const upcoming = active.filter(b=>b.due>=TODAY).reduce((a,b)=>a+b.amt,0);
  const shown    = bills.filter(b=>filter==="all"||b.type===filter);
  const dueSoon  = shown.filter(b=>b.on&&b.due>=TODAY&&b.due<TODAY+6);
  const later    = shown.filter(b=>b.on&&b.due>=TODAY+6);
  const paidList = shown.filter(b=>b.on&&b.due<TODAY);
  const paused   = shown.filter(b=>!b.on);
  const DCOLS    = [pal.primary,"#B3261E","#7C5800","#006874","#984061"];

  const BRow = ({b,last}) => {
    const isPaid=b.on&&b.due<TODAY, isSoon=b.on&&b.due>=TODAY&&b.due<TODAY+6;
    const sBg=isPaid?pal.successContainer:isSoon?pal.warningContainer:pal.surfaceVariant;
    const sCol=isPaid?pal.success:isSoon?pal.warning:pal.onSurfaceVariant;
    const sTxt=isPaid?"✓ Paid":!b.on?"Paused":isSoon?"Due in "+(b.due-TODAY)+"d":"Mar "+b.due;
    return (
      <div>
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"13px 18px"}}>
          <div style={{width:44,height:44,borderRadius:12,background:sBg,display:"flex",
            alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,opacity:b.on?1:.5}}>
            {b.icon}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:2}}>
              <span style={{fontSize:15,fontWeight:700,color:b.on?pal.onSurface:pal.onSurfaceVariant,
                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.name}</span>
              {b.type==="sub"&&<span style={{fontSize:9,fontWeight:900,padding:"2px 6px",borderRadius:20,
                background:pal.secondaryContainer,color:pal.primary,flexShrink:0}}>SUB</span>}
            </div>
            <div style={{fontSize:12,fontWeight:700,color:sCol}}>{b.cat+" · "+sTxt}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:15,fontWeight:900,color:b.on?pal.onSurface:pal.onSurfaceVariant}}>
              {"$"+(b.amt%1===0?b.amt:b.amt.toFixed(2))}
            </span>
            <M3Switch on={b.on} toggle={()=>toggle(b.id)} pal={pal}/>
          </div>
        </div>
        {!last&&<Divider indent={76}/>}
      </div>
    );
  };

  const Group = ({label,items,col}) => items.length===0?null:(
    <div style={{marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:900,color:col||pal.onSurfaceVariant,
        textTransform:"uppercase",letterSpacing:".6px",padding:"0 4px 8px"}}>{label}</div>
      <Card r={20} p={0}>
        {items.map((b,i)=><BRow key={b.id} b={b} last={i===items.length-1}/>)}
      </Card>
    </div>
  );

  const totalDebt = debts.reduce((a,d)=>a+d.remaining,0);

  return (
    <div style={{padding:"0 16px",background:"#FFFBFE",minHeight:"100vh",paddingBottom:100}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 0 16px"}}>
        <div style={{fontSize:28,fontWeight:900,color:pal.onSurface,letterSpacing:"-.5px"}}>Bills & Subs</div>
        <button className="rip" onClick={()=>setShowAdd(true)}
          style={{width:40,height:40,borderRadius:20,background:pal.primaryContainer,
            border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon n="plus" s={20} col={pal.primary} w={2.5}/>
        </button>
      </div>

      {/* Summary */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
        {[
          {l:"Monthly",  v:"$"+Math.round(totalMo),  bg:"transparent",   bc:pal.outlineVariant, tc:pal.onSurface},
          {l:"Paid",     v:"$"+Math.round(paid),      bg:pal.successContainer, bc:"transparent",tc:pal.success},
          {l:"Left",     v:"$"+Math.round(upcoming),  bg:upcoming>0?pal.warningContainer:"transparent",bc:upcoming>0?"transparent":pal.outlineVariant,tc:upcoming>0?pal.warning:pal.onSurface},
        ].map(s=>(
          <div key={s.l} style={{background:s.bg,borderRadius:16,padding:"14px 10px",
            textAlign:"center",border:"1.5px solid "+(s.bc||"transparent")}}>
            <div style={{fontSize:10,fontWeight:900,color:s.tc,marginBottom:5,textTransform:"uppercase",letterSpacing:".3px"}}>{s.l}</div>
            <div style={{fontSize:17,fontWeight:900,color:s.tc}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Timeline — tappable */}
      <div className="rip" onClick={onOpenCal}
        style={{background:pal.primaryContainer,borderRadius:20,padding:"16px",marginBottom:14,cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <span style={{fontSize:14,fontWeight:900,color:pal.primary}}>March timeline</span>
          <span style={{fontSize:12,fontWeight:700,color:pal.primary,display:"flex",alignItems:"center",gap:4}}>
            Open <Icon n="cal" s={14} col={pal.primary} w={2}/>
          </span>
        </div>
        <div style={{position:"relative",height:28}}>
          <div style={{position:"absolute",top:11,left:4,right:4,height:4,background:pal.primary+"25",borderRadius:4}}/>
          <div style={{position:"absolute",top:4,left:((TODAY/31)*100)+"%",width:3,height:20,
            background:pal.primary,borderRadius:2,transform:"translateX(-50%)"}}/>
          {active.map(b=>{
            const col=b.due<TODAY?pal.success:b.due<TODAY+6?pal.warning:pal.primary+"66";
            return (
              <div key={b.id} style={{position:"absolute",top:8,
                left:((b.due/31)*100)+"%",transform:"translateX(-50%)",
                width:12,height:12,borderRadius:"50%",background:col,
                border:"2px solid "+pal.primaryContainer,zIndex:1,pointerEvents:"none"}}/>
            );
          })}
        </div>
        <div style={{display:"flex",gap:12,marginTop:10}}>
          {[[pal.success,"Paid"],[pal.warning,"Due soon"],[pal.primary+"66","Upcoming"]].map(([col,lbl])=>(
            <div key={lbl} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:pal.primary}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:col}}/>{lbl}
            </div>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:2}}>
        {[["all","All"],["bill","Bills"],["sub","Subscriptions"]].map(([v,l])=>(
          <Chip key={v} label={l} active={filter===v} pal={pal} onClick={()=>setFilter(v)}/>
        ))}
      </div>

      <Group label="Due soon" items={dueSoon} col={pal.warning}/>
      <Group label="Later this month" items={later}/>
      <Group label="Paid this month" items={paidList} col={pal.success}/>
      <Group label="Paused" items={paused}/>

      {/* Debt */}
      <div style={{marginTop:8}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 4px",marginBottom:10}}>
          <div style={{fontSize:18,fontWeight:900,color:pal.onSurface,letterSpacing:"-.3px"}}>Debt Tracker</div>
          <button className="rip" onClick={()=>setShowDebt(true)}
            style={{background:pal.errorContainer,color:pal.error,border:"none",
              borderRadius:20,padding:"6px 14px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
            + Add
          </button>
        </div>
        <div style={{background:pal.errorContainer,borderRadius:20,padding:"14px 18px",
          marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:10,fontWeight:900,color:pal.error,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>Total outstanding</div>
            <div style={{fontSize:28,fontWeight:900,color:pal.error,letterSpacing:"-.8px"}}>{"$"+totalDebt.toLocaleString()}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:10,fontWeight:900,color:pal.error,textTransform:"uppercase",letterSpacing:".4px",marginBottom:4}}>Monthly</div>
            <div style={{fontSize:20,fontWeight:900,color:pal.error}}>{"$"+debts.reduce((a,d)=>a+d.monthly,0)+"/mo"}</div>
          </div>
        </div>
        {debts.map((d,di)=>{
          const paidOff=d.total-d.remaining, pct=Math.min(100,(paidOff/d.total)*100);
          const moLeft=Math.ceil(d.remaining/d.monthly), isOpen=expandD===d.id;
          const dCol=DCOLS[di%DCOLS.length];
          return (
            <div key={d.id} style={{marginBottom:10}}>
              <Card r={20} p={0}>
                <div className="ink" onClick={()=>setExpandD(isOpen?null:d.id)}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px"}}>
                  <div style={{width:44,height:44,borderRadius:12,background:dCol+"18",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                    {d.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                      <span style={{fontSize:15,fontWeight:700,color:pal.onSurface}}>{d.name}</span>
                      <span style={{fontSize:15,fontWeight:900,color:pal.error}}>{"$"+d.remaining.toLocaleString()}</span>
                    </div>
                    <Bar pct={pct} color={dCol} h={6}/>
                    <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
                      <span style={{fontSize:11,fontWeight:600,color:pal.onSurfaceVariant}}>{"$"+paidOff.toLocaleString()+" paid"}</span>
                      <span style={{fontSize:11,fontWeight:800,color:dCol}}>{pct.toFixed(0)+"%"}</span>
                    </div>
                  </div>
                  <div style={{transform:isOpen?"rotate(90deg)":"none",transition:"transform .2s"}}>
                    <Icon n="chevR" s={18} col={pal.onSurfaceVariant} w={2}/>
                  </div>
                </div>
                {isOpen && (
                  <div style={{borderTop:"1px solid "+pal.outlineVariant,padding:"14px 18px",
                    background:pal.surfaceVariant+"44"}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
                      {[{l:"Monthly",v:"$"+d.monthly},{l:"Rate",v:d.rate+"%"},{l:"Payoff",v:moLeft+" mo"}].map(s=>(
                        <div key={s.l} style={{background:"#fff",borderRadius:12,padding:"10px",textAlign:"center"}}>
                          <div style={{fontSize:10,fontWeight:900,color:pal.onSurfaceVariant,textTransform:"uppercase",letterSpacing:".3px",marginBottom:4}}>{s.l}</div>
                          <div style={{fontSize:15,fontWeight:900,color:pal.onSurface}}>{s.v}</div>
                        </div>
                      ))}
                    </div>
                    <button className="rip" onClick={()=>setDebts(debts.filter(dd=>dd.id!==d.id))}
                      style={{background:pal.errorContainer,color:pal.error,border:"none",
                        borderRadius:20,padding:"8px 16px",fontSize:13,fontWeight:800,cursor:"pointer"}}>
                      Remove debt
                    </button>
                  </div>
                )}
              </Card>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <Sheet onClose={()=>setShowAdd(false)} title="Add Payment">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {["bill","sub"].map(t=>(
              <button key={t} className="rip" onClick={()=>setDraft({...draft,type:t})}
                style={{padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
                  background:draft.type===t?pal.primaryContainer:"transparent",
                  color:draft.type===t?pal.primary:pal.onSurfaceVariant,fontSize:15,fontWeight:800,
                  boxShadow:draft.type===t?"none":"inset 0 0 0 1.5px "+pal.outline}}>
                {t==="bill"?"Bill":"Subscription"}
              </button>
            ))}
          </div>
          <Field placeholder="Name" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/>
          <Field placeholder="Monthly amount" value={draft.amt} onChange={e=>setDraft({...draft,amt:e.target.value})} type="number"/>
          <Field placeholder="Category" value={draft.cat} onChange={e=>setDraft({...draft,cat:e.target.value})}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Field placeholder="Due day" value={draft.due} onChange={e=>setDraft({...draft,due:e.target.value})} type="number"/>
            <Field placeholder="Icon emoji" value={draft.icon} onChange={e=>setDraft({...draft,icon:e.target.value})}/>
          </div>
          <button className="rip" onClick={addBill}
            style={{width:"100%",padding:16,background:pal.primary,color:pal.onPrimary,
              border:"none",borderRadius:12,fontWeight:900,fontSize:16,cursor:"pointer",marginTop:4}}>
            Save Payment
          </button>
        </Sheet>
      )}

      {showDebt && (
        <Sheet onClose={()=>setShowDebt(false)} title="Add Debt">
          <Field placeholder="Name (e.g. Car Loan)" value={draftD.name} onChange={e=>setDraftD({...draftD,name:e.target.value})}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Field placeholder="Total ($)" value={draftD.total} onChange={e=>setDraftD({...draftD,total:e.target.value})} type="number"/>
            <Field placeholder="Remaining ($)" value={draftD.remaining} onChange={e=>setDraftD({...draftD,remaining:e.target.value})} type="number"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <Field placeholder="Monthly ($)" value={draftD.monthly} onChange={e=>setDraftD({...draftD,monthly:e.target.value})} type="number"/>
            <Field placeholder="Rate (%)" value={draftD.rate} onChange={e=>setDraftD({...draftD,rate:e.target.value})} type="number"/>
          </div>
          <Field placeholder="Icon emoji" value={draftD.icon} onChange={e=>setDraftD({...draftD,icon:e.target.value})}/>
          <button className="rip" onClick={addDebt}
            style={{width:"100%",padding:16,background:pal.error,color:"#fff",
              border:"none",borderRadius:12,fontWeight:900,fontSize:16,cursor:"pointer",marginTop:4}}>
            Add Debt
          </button>
        </Sheet>
      )}
    </div>
  );
}

/* CALENDAR MODAL */
function CalModal({m,pal,bills,onClose}) {
  const [selDay,setSelDay] = useState(TODAY);
  const daysInMonth=31, firstDow=5;
  const weeks=[]; let cells=Array(firstDow).fill(null);
  for(let d=1;d<=daysInMonth;d++){
    cells.push(d);
    if(cells.length===7){weeks.push(cells);cells=[];}
  }
  if(cells.length){while(cells.length<7)cells.push(null);weeks.push(cells);}
  const bOnDay = d => bills.filter(b=>b.on&&b.due===d);
  const selBills = bOnDay(selDay);
  const active = bills.filter(b=>b.on);
  const past = [...active].filter(b=>b.due<TODAY).sort((a,b)=>a.due-b.due);
  const upcoming = [...active].filter(b=>b.due>TODAY).sort((a,b)=>a.due-b.due);
  const todayBills = active.filter(b=>b.due===TODAY);

  return (
    <div className="fi" style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",
      zIndex:500,display:"flex",alignItems:"flex-end"}} onClick={onClose}>
      <div className="shu" style={{background:"#FFFBFE",borderRadius:"28px 28px 0 0",
        width:"100%",maxWidth:430,margin:"0 auto",maxHeight:"92vh",overflowY:"auto"}}
        onClick={e=>e.stopPropagation()}>

        {/* Sticky header */}
        <div style={{position:"sticky",top:0,background:"#FFFBFE",zIndex:10,
          borderBottom:"1px solid "+pal.outlineVariant}}>
          <div style={{width:32,height:4,borderRadius:2,background:"rgba(0,0,0,.18)",margin:"12px auto 0"}}/>
          <div style={{display:"flex",alignItems:"center",padding:"12px 20px 14px"}}>
            <button className="rip" onClick={onClose}
              style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",
                cursor:"pointer",color:pal.primary,fontSize:15,fontWeight:800,padding:"4px 0"}}>
              <Icon n="chevL" s={20} col={pal.primary} w={2.5}/>Back
            </button>
            <div style={{flex:1,textAlign:"center"}}>
              <div style={{fontSize:17,fontWeight:900,color:pal.onSurface}}>March 2024</div>
              <div style={{fontSize:12,fontWeight:700,color:pal.onSurfaceVariant,marginTop:1}}>
                {active.length+" recurring · $"+Math.round(active.reduce((a,b)=>a+b.amt,0))+"/mo"}
              </div>
            </div>
            <div style={{width:64}}/>
          </div>
        </div>

        <div style={{padding:"16px 20px 0"}}>
          {/* Day headers */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:6}}>
            {["S","M","T","W","T","F","S"].map((d,i)=>(
              <div key={i} style={{textAlign:"center",fontSize:12,fontWeight:900,
                color:pal.onSurfaceVariant,padding:"4px 0"}}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:20}}>
            {weeks.map((wk,wi)=>(
              <div key={wi} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
                {wk.map((d,di)=>{
                  if(!d) return <div key={di}/>;
                  const bs=bOnDay(d), isSel=d===selDay, isToday=d===TODAY;
                  const dotCol=d<TODAY?pal.success:d<TODAY+6?pal.warning:pal.primary;
                  return (
                    <div key={di} className="rip" onClick={()=>setSelDay(d)}
                      style={{aspectRatio:"1",display:"flex",flexDirection:"column",
                        alignItems:"center",justifyContent:"center",borderRadius:14,
                        background:isSel?pal.primary:isToday?pal.primaryContainer:"transparent",
                        cursor:"pointer",gap:2}}>
                      <span style={{fontSize:14,fontWeight:isSel||isToday?900:600,
                        color:isSel?pal.onPrimary:isToday?pal.primary:pal.onSurface}}>
                        {d}
                      </span>
                      {bs.length>0 && (
                        <div style={{display:"flex",gap:2}}>
                          {bs.slice(0,3).map((_,bi)=>(
                            <div key={bi} style={{width:5,height:5,borderRadius:"50%",
                              background:isSel?pal.onPrimary+"88":dotCol}}/>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Selected day */}
          <div style={{background:pal.primaryContainer,borderRadius:20,overflow:"hidden",marginBottom:20}}>
            <div style={{padding:"12px 18px",display:"flex",justifyContent:"space-between",
              alignItems:"center",borderBottom:"1px solid "+pal.primary+"20"}}>
              <span style={{fontSize:15,fontWeight:900,color:pal.primary}}>
                {"March "+selDay+(selDay===TODAY?" · Today":"")}
              </span>
              <span style={{fontSize:13,fontWeight:700,color:pal.primary}}>
                {selBills.length>0?"$"+selBills.reduce((a,b)=>a+b.amt,0).toFixed(2)+" due":"No payments"}
              </span>
            </div>
            {selBills.length===0
              ? <div style={{padding:"18px",textAlign:"center",color:pal.primary,fontSize:14,fontWeight:600,opacity:.6}}>
                  No bills on this day
                </div>
              : selBills.map((b,i)=>{
                  const isPaid=b.due<TODAY, isSoon=b.due>=TODAY&&b.due<TODAY+6;
                  return (
                    <div key={b.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 18px",
                      borderBottom:i<selBills.length-1?"1px solid "+pal.primary+"15":"none"}}>
                      <span style={{fontSize:22,width:32,textAlign:"center"}}>{b.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:pal.onPrimaryContainer}}>{b.name}</div>
                        <div style={{fontSize:12,fontWeight:600,color:pal.primary,opacity:.7}}>{b.cat}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:14,fontWeight:900,color:pal.onPrimaryContainer}}>
                          {"$"+(b.amt%1===0?b.amt:b.amt.toFixed(2))}
                        </div>
                        <div style={{fontSize:11,fontWeight:700,
                          color:isPaid?pal.success:isSoon?pal.warning:pal.primary}}>
                          {isPaid?"✓ Paid":isSoon?"Due soon":"Upcoming"}
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>

          {/* All payments */}
          <SLbl>All Payments</SLbl>
          {past.length>0 && (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:900,color:pal.success,textTransform:"uppercase",
                letterSpacing:".5px",marginBottom:8,padding:"0 4px"}}>{"✓ Paid · "+past.length+" items"}</div>
              <Card r={16} p={0}>
                {past.map((b,i)=>(
                  <div key={b.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",
                    opacity:.7,borderBottom:i<past.length-1?"1px solid "+pal.outlineVariant:"none"}}>
                    <span style={{fontSize:18,width:28,textAlign:"center"}}>{b.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:pal.onSurface}}>{b.name}</div>
                      <div style={{fontSize:11,fontWeight:600,color:pal.onSurfaceVariant}}>{"Mar "+b.due}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:13,fontWeight:800,color:pal.onSurface}}>
                        {"$"+(b.amt%1===0?b.amt:b.amt.toFixed(2))}
                      </span>
                      <span style={{fontSize:13,fontWeight:900,color:pal.success}}>✓</span>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
          {todayBills.length>0 && (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:900,color:pal.primary,textTransform:"uppercase",
                letterSpacing:".5px",marginBottom:8,padding:"0 4px"}}>{"Today · Mar "+TODAY}</div>
              <div style={{background:pal.primaryContainer,borderRadius:16,overflow:"hidden",
                outline:"2px solid "+pal.primary}}>
                {todayBills.map((b,i)=>(
                  <div key={b.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
                    borderBottom:i<todayBills.length-1?"1px solid "+pal.primary+"20":"none"}}>
                    <span style={{fontSize:18,width:28,textAlign:"center"}}>{b.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:pal.onPrimaryContainer}}>{b.name}</div>
                    </div>
                    <span style={{fontSize:14,fontWeight:900,color:pal.primary}}>
                      {"$"+(b.amt%1===0?b.amt:b.amt.toFixed(2))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {upcoming.length>0 && (
            <div style={{marginBottom:32}}>
              <div style={{fontSize:11,fontWeight:900,color:pal.onSurfaceVariant,textTransform:"uppercase",
                letterSpacing:".5px",marginBottom:8,padding:"0 4px"}}>{"Upcoming · "+upcoming.length+" items"}</div>
              <Card r={16} p={0}>
                {upcoming.map((b,i)=>{
                  const isSoon=b.due<TODAY+6;
                  return (
                    <div key={b.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",
                      borderBottom:i<upcoming.length-1?"1px solid "+pal.outlineVariant:"none"}}>
                      <span style={{fontSize:18,width:28,textAlign:"center"}}>{b.icon}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:pal.onSurface}}>{b.name}</div>
                        <div style={{fontSize:11,fontWeight:700,color:isSoon?pal.warning:pal.onSurfaceVariant}}>
                          {isSoon?"Due in "+(b.due-TODAY)+"d":"Mar "+b.due}
                        </div>
                      </div>
                      <span style={{fontSize:13,fontWeight:800,color:isSoon?pal.warning:pal.onSurface}}>
                        {"$"+(b.amt%1===0?b.amt:b.amt.toFixed(2))}
                      </span>
                    </div>
                  );
                })}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* REPORTS */
function ReportsScreen({m,pal,catSpend,income,spent,bal}) {
  const [period,setPeriod] = useState("monthly");
  const scale={weekly:.23,monthly:1,yearly:12.4};
  const sc=scale[period];
  const pI=Math.round(income*sc), pS=Math.round(spent*sc), pB=pI-pS;
  const rate=pI>0?((pI-pS)/pI*100).toFixed(0):0;
  const scaledCats=Object.fromEntries(Object.entries(catSpend).map(([k,v])=>[k,Math.round(v*sc)]));
  const catList=Object.entries(scaledCats).sort((a,b)=>b[1]-a[1]);
  const maxCat=catList[0]?.[1]||1;
  const vs={
    weekly:["↑ 11% vs last week","↓ 4% vs last week"],
    monthly:["↑ 3.2% vs last","↓ 8.1% vs last"],
    yearly:["↑ 18% vs last year","↓ 12% vs last year"],
  };
  const tData=period==="yearly"?YEARLY:TREND;
  const maxV=Math.max(...tData.map(d=>Math.max(d.inc,d.exp)));
  const W=300,H=90;
  const tx=i=>20+(i/(tData.length-1))*(W-40);
  const ty=v=>H-(v/maxV)*H+8;

  return (
    <div style={{padding:"0 16px",background:"#FFFBFE",minHeight:"100vh",paddingBottom:100}}>
      <div style={{padding:"20px 0 8px"}}>
        <div style={{fontSize:28,fontWeight:900,color:pal.onSurface,letterSpacing:"-.5px"}}>Reports</div>
        <div style={{fontSize:13,fontWeight:700,color:pal.onSurfaceVariant,marginTop:2}}>
          {period==="weekly"?"This week":period==="monthly"?"March 2024":"Full year 2024"}
        </div>
      </div>
      <div style={{marginBottom:20}}>
        <Seg opts={[["weekly","Weekly"],["monthly","Monthly"],["yearly","Yearly"]]} val={period} onChange={setPeriod} pal={pal}/>
      </div>

      <div key={period} style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
        {[
          {l:m.income,   v:$(pI), sub:vs[period][0], bg:pal.primaryContainer,   tc:pal.primary},
          {l:m.expense,  v:$(pS), sub:vs[period][1], bg:pal.errorContainer,     tc:pal.error},
          {l:"Balance",  v:$(pB), sub:m.surplus+" balance",
            bg:pB>=0?pal.successContainer:pal.errorContainer, tc:pB>=0?pal.success:pal.error},
          {l:"Save Rate", v:rate+"%", sub:"of total income", bg:pal.secondaryContainer, tc:pal.secondary},
        ].map(s=>(
          <div key={s.l} className="su" style={{background:s.bg,borderRadius:20,padding:"16px"}}>
            <div style={{fontSize:11,fontWeight:900,color:s.tc,marginBottom:6,textTransform:"uppercase",letterSpacing:".4px"}}>{s.l}</div>
            <div style={{fontSize:26,fontWeight:900,color:s.tc,letterSpacing:"-.5px",lineHeight:1,marginBottom:4}}>{s.v}</div>
            <div style={{fontSize:11,fontWeight:700,color:s.tc,opacity:.7}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <SLbl>Spending Breakdown</SLbl>
      <Card r={20} p={0} style={{marginBottom:20}}>
        {catList.map(([cat,val],i)=>{
          const pct=((val/maxCat)*100).toFixed(0);
          const ofTotal=pS>0?((val/pS)*100).toFixed(0):"0";
          return (
            <div key={cat} style={{padding:"13px 18px",borderBottom:i<catList.length-1?"1px solid "+pal.outlineVariant:"none"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <CatIcon cat={cat} size={32}/>
                  <span style={{fontSize:14,fontWeight:700,color:pal.onSurface}}>{cat}</span>
                </div>
                <div>
                  <span style={{fontSize:14,fontWeight:800,color:pal.onSurface}}>{$(val,true)}</span>
                  <span style={{fontSize:12,fontWeight:600,color:pal.onSurfaceVariant,marginLeft:6}}>{ofTotal+"%"}</span>
                </div>
              </div>
              <Bar pct={parseFloat(pct)} color={cc(cat)} h={6}/>
            </div>
          );
        })}
      </Card>

      {period!=="weekly" && (
        <>
          <SLbl>{period==="yearly"?"12-Month Trend":"6-Month Trend"}</SLbl>
          <Card r={20} p={16} style={{marginBottom:20}}>
            <div style={{display:"flex",gap:16,marginBottom:12}}>
              {[[pal.primary,m.income],["#C1C7CE",m.expense]].map(([col,lbl])=>(
                <div key={lbl} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,fontWeight:700,color:pal.onSurfaceVariant}}>
                  <div style={{width:18,height:3,background:col,borderRadius:2}}/>{lbl}
                </div>
              ))}
            </div>
            <svg width="100%" viewBox={"0 0 "+W+" "+(H+24)} style={{overflow:"visible"}}>
              {tData.map((d,i)=>{
                if(i===0) return null;
                return (
                  <g key={i}>
                    <line x1={tx(i-1)} y1={ty(tData[i-1].inc)} x2={tx(i)} y2={ty(d.inc)}
                      stroke={pal.primary} strokeWidth={2.5} strokeLinecap="round"/>
                    <line x1={tx(i-1)} y1={ty(tData[i-1].exp)} x2={tx(i)} y2={ty(d.exp)}
                      stroke="#C1C7CE" strokeWidth={2.5} strokeLinecap="round"/>
                  </g>
                );
              })}
              {tData.map((d,i)=>(
                <g key={i}>
                  <circle cx={tx(i)} cy={ty(d.inc)} r={d.cur?5.5:3.5}
                    fill={d.cur?pal.primary:"#fff"} stroke={pal.primary} strokeWidth={2}/>
                  <circle cx={tx(i)} cy={ty(d.exp)} r={d.cur?5.5:3.5}
                    fill={d.cur?"#C1C7CE":"#fff"} stroke="#C1C7CE" strokeWidth={2}/>
                  <text x={tx(i)} y={H+20} textAnchor="middle" fontSize={10} fontWeight="700" fill={pal.onSurfaceVariant}>{d.m}</text>
                </g>
              ))}
            </svg>
          </Card>
        </>
      )}
      {period==="weekly" && (
        <>
          <SLbl>Daily Breakdown</SLbl>
          <Card r={20} p={16} style={{marginBottom:20}}>
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day,i)=>{
              const v=[42,118,67,203,89,156,34][i];
              return (
                <div key={day} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                    <span style={{fontSize:13,fontWeight:700,color:pal.onSurface}}>{day}</span>
                    <span style={{fontSize:13,fontWeight:900,color:pal.primary}}>{"$"+v}</span>
                  </div>
                  <Bar pct={(v/203)*100} color={pal.primary} h={6}/>
                </div>
              );
            })}
          </Card>
        </>
      )}

      <div style={{background:pal.primaryContainer,borderRadius:20,padding:"18px 20px",marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:900,color:pal.primary,textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Summary</div>
        <div style={{fontSize:14,fontWeight:700,color:pal.onPrimaryContainer,lineHeight:1.65}}>
          {pB>=0
            ? "You're in great shape "+(period==="weekly"?"this week":period==="monthly"?"this month":"this year")+". Spending is "+((pS/pI)*100).toFixed(0)+"% of "+m.income.toLowerCase()+", with "+$(pB)+" "+m.surplus.toLowerCase()+". "+(catList[0]?.[0]||"Groceries")+" is your biggest expense."
            : "Spending exceeded "+m.income.toLowerCase()+" by "+$(Math.abs(pB),true)+". Review "+(catList[0]?.[0]||"top")+" expenses."}
        </div>
      </div>

      <button className="rip" style={{width:"100%",padding:14,background:"transparent",color:pal.primary,
        border:"1.5px solid "+pal.outline,borderRadius:20,fontWeight:800,fontSize:14,cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:4}}>
        <Icon n="dl" s={17} col={pal.primary}/> Export Report
      </button>
    </div>
  );
}

/* ADD SHEET */
function AddSheet({m,pal,onClose,onSave}) {
  const [form,setForm] = useState({desc:"",amt:"",cat:"",type:"expense",
    who:m.id==="family"?"Joint":"Me",date:"2024-03-17"});
  const set = k => e => setForm({...form,[k]:e.target.value});
  const save = () => {
    if(!form.desc||!form.amt||!form.cat) return;
    const amount = form.type==="expense"?-Math.abs(parseFloat(form.amt)):Math.abs(parseFloat(form.amt));
    onSave({desc:form.desc,cat:form.cat,amt:amount,who:form.who,date:form.date});
  };
  return (
    <Sheet onClose={onClose} title="New Transaction">
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        {["expense","income"].map(t=>(
          <button key={t} className="rip" onClick={()=>setForm({...form,type:t})}
            style={{padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
              background:form.type===t?pal.primaryContainer:"transparent",
              color:form.type===t?pal.primary:pal.onSurfaceVariant,fontSize:15,fontWeight:800,
              boxShadow:form.type===t?"none":"inset 0 0 0 1.5px "+pal.outline}}>
            {t==="expense"?m.expense:m.income}
          </button>
        ))}
      </div>
      <Field placeholder="Description" value={form.desc} onChange={set("desc")}/>
      <Field placeholder="Amount" value={form.amt} onChange={set("amt")} type="number"/>
      <SelField label="Category" value={form.cat} onChange={set("cat")}>
        <option value="">Select category…</option>
        {m.cats.map(c=><option key={c}>{c}</option>)}
      </SelField>
      <SelField label="Who" value={form.who} onChange={set("who")}>
        {(m.id==="family"?["Can","Melike","Joint"]:["Me","Alex","Jordan","Joint"]).map(p=><option key={p}>{p}</option>)}
      </SelField>
      <Field placeholder="Date" value={form.date} onChange={set("date")} type="date"/>
      <button className="rip" onClick={save}
        style={{width:"100%",padding:16,background:pal.primary,color:pal.onPrimary,
          border:"none",borderRadius:12,fontWeight:900,fontSize:16,cursor:"pointer",marginTop:4}}>
        Add Transaction
      </button>
    </Sheet>
  );
}

/* ROOT */
export default function Splitty() {
  const [screen, setScreen] = useState("pick");
  const [modeId, setModeId] = useState(null);
  const [tab,    setTab]    = useState("home");
  const [tx,     setTx]     = useState(SEED);
  const [bills,  setBills]  = useState(BILLS_SEED);
  const [addTx,  setAddTx]  = useState(false);
  const [showCal,setShowCal]= useState(false);
  const [toast,  setToast]  = useState(null);

  const m   = MODES[modeId||"family"];
  const pal = PAL[modeId||"family"];
  const ping = msg => { setToast(msg); setTimeout(()=>setToast(null),2400); };

  const income   = tx.filter(t=>t.amt>0).reduce((a,t)=>a+t.amt,0);
  const spent    = tx.filter(t=>t.amt<0).reduce((a,t)=>a+Math.abs(t.amt),0);
  const bal      = income-spent;
  const catSpend = {};
  tx.filter(t=>t.amt<0).forEach(t=>{ catSpend[t.cat]=(catSpend[t.cat]||0)+Math.abs(t.amt); });

  if(screen==="pick") return (
    <div style={{fontFamily:"'Nunito',sans-serif"}}><GS/>
      <ModePicker onPick={id=>{ setModeId(id); setScreen("app"); }}/>
    </div>
  );

  return (
    <div style={{fontFamily:"'Nunito',sans-serif",background:pal.surface,
      minHeight:"100vh",maxWidth:430,margin:"0 auto",position:"relative"}}>
      <GS/>
      {toast && <Toast msg={toast} pal={pal}/>}

      <div style={{paddingBottom:80,minHeight:"100vh"}}>
        {tab==="home"    && <HomeScreen    m={m} pal={pal} tx={tx} income={income} spent={spent} bal={bal} catSpend={catSpend} onAdd={()=>setAddTx(true)} onSwitch={()=>setScreen("pick")}/>}
        {tab==="entries" && <EntriesScreen m={m} pal={pal} tx={tx} onAdd={()=>setAddTx(true)} onDel={id=>{ setTx(tx.filter(t=>t.id!==id)); ping("Deleted"); }}/>}
        {tab==="budget"  && <BudgetScreen  m={m} pal={pal} catSpend={catSpend}/>}
        {tab==="bills"   && <BillsScreen   m={m} pal={pal} bills={bills} setBills={setBills} ping={ping} onOpenCal={()=>setShowCal(true)}/>}
        {tab==="reports" && <ReportsScreen m={m} pal={pal} catSpend={catSpend} income={income} spent={spent} bal={bal}/>}
      </div>

      {addTx  && <AddSheet m={m} pal={pal} onClose={()=>setAddTx(false)} onSave={t=>{ setTx([{...t,id:Date.now()},...tx]); setAddTx(false); ping("Added ✓"); }}/>}
      {showCal && <CalModal m={m} pal={pal} bills={bills} onClose={()=>setShowCal(false)}/>}

      <NavBar tab={tab} set={setTab} pal={pal}/>
    </div>
  );
}
