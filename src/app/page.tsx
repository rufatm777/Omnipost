"use client";
import { useState, useEffect } from "react";
import { PLATFORMS, TONES, CONTENT_TYPES } from "@/lib/platforms";
import { PlatformIcon } from "@/components/PlatformIcons";
import Link from "next/link";

export default function Home() {
  const [topic, setTopic] = useState(""); const [tone, setTone] = useState("Professional"); const [contentType, setContentType] = useState("Educational Post");
  const [selPlatforms, setSelPlatforms] = useState<string[]>(["twitter","linkedin","telegram"]);
  const [genContent, setGenContent] = useState<Record<string,string>>({}); const [editContent, setEditContent] = useState<Record<string,string>>({});
  const [activeTab, setActiveTab] = useState("twitter"); const [generating, setGenerating] = useState(false); const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string|null>(null); const [accounts, setAccounts] = useState<Record<string,any>>({});
  const [history, setHistory] = useState<any[]>([]); const [view, setView] = useState<"create"|"history">("create");

  useEffect(() => { fetch("/api/accounts").then(r=>r.json()).then(d=>setAccounts(d.platforms||{})).catch(()=>{}); }, []);
  const toggle = (p:string) => setSelPlatforms(v => v.includes(p)?v.filter(x=>x!==p):[...v,p]);
  const flash = (m:string) => { setToast(m); setTimeout(()=>setToast(null),3200); };
  const connCount = Object.values(accounts).filter((a:any)=>a?.connected).length;

  const generate = async () => {
    if(!topic.trim()||!selPlatforms.length) return; setGenerating(true);
    try { const r=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic,tone,contentType,platforms:selPlatforms})}); const d=await r.json();
      if(d.content){setGenContent(d.content);setEditContent(d.content);setActiveTab(selPlatforms[0]);}else flash("Generation failed");
    } catch{flash("Failed — check Claude API key");} setGenerating(false);
  };

  const publish = async () => {
    setPublishing(true);
    try { const r=await fetch("/api/publish",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({platforms:selPlatforms,content:editContent})}); const d=await r.json();
      const ok=d.results?.filter((x:any)=>x.success).length||0; const fail=d.results?.filter((x:any)=>!x.success).length||0;
      setHistory(h=>[{id:Date.now(),topic,platforms:selPlatforms,date:new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),status:d.success?"published":"failed",results:d.results},...h]);
      if(d.success){flash(`Published to ${selPlatforms.length} platforms`);setGenContent({});setEditContent({});setTopic("");}
      else flash(`${ok} ok, ${fail} failed`);
    } catch{flash("Publish failed");} setPublishing(false);
  };

  const has = Object.keys(genContent).length>0;

  return (
    <div style={{minHeight:"100vh"}}>
      <header style={{padding:"20px 28px",borderBottom:"1px solid var(--bd)",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:40,height:40,borderRadius:12,background:"var(--ac)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L15 8.5L22 9.5L17 14.5L18 21.5L12 18L6 21.5L7 14.5L2 9.5L9 8.5L12 2Z" fill="var(--bg)"/></svg>
          </div>
          <h1 style={{fontSize:24,fontWeight:800,fontFamily:"var(--fs)",letterSpacing:"-0.5px"}}>Omni<span style={{fontWeight:400,color:"var(--tx2)"}}>Post</span></h1>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Link href="/settings" style={{padding:"9px 18px",borderRadius:12,border:"1px solid var(--bd)",background:"transparent",fontSize:13,fontWeight:600,color:"var(--tx2)",textDecoration:"none",display:"flex",alignItems:"center",gap:7}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--tx2)" strokeWidth="2.2" strokeLinecap="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            Accounts {connCount>0&&<span style={{background:"var(--ok)",color:"#fff",fontSize:10,fontWeight:800,padding:"2px 7px",borderRadius:20}}>{connCount}</span>}
          </Link>
          <div style={{display:"flex",background:"var(--bg3)",borderRadius:12,padding:3}}>
            {(["create","history"] as const).map(v=><button key={v} onClick={()=>setView(v)} style={{padding:"8px 20px",borderRadius:10,border:"none",background:view===v?"var(--ac)":"transparent",color:view===v?"#fff":"var(--tx2)",fontSize:13,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{v}</button>)}
          </div>
        </div>
      </header>

      {view==="create"?(
        <main style={{padding:"28px 28px 60px",maxWidth:1100,margin:"0 auto"}}>
          {/* Platforms */}
          <Lbl text="Platforms"/>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:28}}>
            {Object.entries(PLATFORMS).map(([k,p])=>{const s=selPlatforms.includes(k);const c=accounts[k]?.connected;return(
              <button key={k} onClick={()=>toggle(k)} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 16px",borderRadius:"var(--r)",border:s?`2px solid ${p.color}`:"1.5px solid var(--bd)",background:s?`${p.color}08`:"transparent",cursor:"pointer",position:"relative"}}>
                <PlatformIcon platform={k} size={18} color={s?p.color:"var(--tx3)"}/><span style={{fontSize:13,fontWeight:700,color:s?p.color:"var(--tx2)"}}>{p.name}</span>
                {c&&<span style={{width:7,height:7,borderRadius:"50%",background:"var(--ok)",border:"2px solid var(--bg)",position:"absolute",top:-2,right:-2}}/>}
                {!c&&s&&<span style={{width:7,height:7,borderRadius:"50%",background:"var(--wn)",border:"2px solid var(--bg)",position:"absolute",top:-2,right:-2}}/>}
              </button>
            );})}
          </div>
          {/* Warning for unconnected */}
          {selPlatforms.some(p=>!accounts[p]?.connected)&&(
            <div style={{padding:"12px 18px",borderRadius:12,background:"#fff8e1",border:"1px solid #ffe0b2",marginBottom:24,display:"flex",alignItems:"center",gap:10,fontSize:13,color:"#e65100"}}>
              <span style={{fontSize:16}}>!</span>
              Some selected platforms aren't connected yet. <Link href="/settings" style={{color:"#e65100",fontWeight:700}}>Connect them in Settings</Link>
            </div>
          )}
          {/* Topic */}
          <Lbl text="Topic or idea"/>
          <div style={{position:"relative",marginBottom:28}}>
            <input type="text" value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Our new AI tool saves 10 hours/week..." onKeyDown={e=>e.key==="Enter"&&generate()} style={{width:"100%",padding:"16px 20px",paddingRight:56,borderRadius:16,border:"1.5px solid var(--bd)",fontSize:15,background:"var(--bg2)",boxSizing:"border-box"}}/>
            {topic&&<button onClick={generate} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",width:36,height:36,borderRadius:10,border:"none",background:"var(--ac)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{"\u2192"}</button>}
          </div>
          {/* Tone + Type */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:28}}>
            <div><Lbl text="Tone"/><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{TONES.map(t=><Pill key={t} l={t} a={tone===t} o={()=>setTone(t)}/>)}</div></div>
            <div><Lbl text="Content type"/><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{CONTENT_TYPES.map(c=><Pill key={c} l={c} a={contentType===c} o={()=>setContentType(c)}/>)}</div></div>
          </div>
          {/* Generate */}
          <button onClick={generate} disabled={!topic.trim()||!selPlatforms.length||generating} style={{width:"100%",padding:"17px 0",borderRadius:16,border:"none",background:(!topic.trim()||!selPlatforms.length)?"#d8d6d0":"var(--ac)",color:"#fff",fontSize:15,fontWeight:800,cursor:(!topic.trim()||!selPlatforms.length)?"not-allowed":"pointer",marginBottom:36,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            {generating?<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" style={{animation:"sp 1s linear infinite"}}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>Generating with Claude AI...</>:<>Generate for {selPlatforms.length} platform{selPlatforms.length!==1?"s":""} {"\u2192"}</>}
          </button>
          {/* Preview */}
          {has&&(
            <div className="ani">
              <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4}}>
                {selPlatforms.map(p=>{const pl=PLATFORMS[p];const a=activeTab===p;const c=accounts[p]?.connected;return(
                  <button key={p} onClick={()=>setActiveTab(p)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 18px",borderRadius:12,border:a?`2px solid ${pl.color}`:"1.5px solid var(--bd)",background:a?`${pl.color}08`:"transparent",cursor:"pointer",whiteSpace:"nowrap"}}>
                    <PlatformIcon platform={p} size={15} color={a?pl.color:"var(--tx3)"}/>
                    <span style={{fontSize:13,fontWeight:700,color:a?pl.color:"var(--tx2)"}}>{pl.name}</span>
                    {!c&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:10,background:"#fff3e0",color:"var(--wn)",fontWeight:800}}>NO AUTH</span>}
                  </button>
                );})}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:28}}>
                <div><Lbl text="Edit content"/><textarea value={editContent[activeTab]||""} onChange={e=>setEditContent(p=>({...p,[activeTab]:e.target.value}))} style={{width:"100%",height:400,padding:20,borderRadius:16,border:"1.5px solid var(--bd)",fontSize:14,lineHeight:1.75,resize:"vertical",background:"var(--bg2)",boxSizing:"border-box"}}/></div>
                <div><Lbl text="Preview"/>
                  <div style={{background:"var(--bg2)",border:"1.5px solid var(--bd)",borderRadius:18,padding:22,position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,right:0,height:4,background:PLATFORMS[activeTab]?.gradient}}/>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,paddingTop:4}}>
                      <div style={{width:40,height:40,borderRadius:12,background:`${PLATFORMS[activeTab]?.color}12`,display:"flex",alignItems:"center",justifyContent:"center"}}><PlatformIcon platform={activeTab} size={20} color={PLATFORMS[activeTab]?.color}/></div>
                      <div><div style={{fontSize:14,fontWeight:700}}>{PLATFORMS[activeTab]?.name}</div><div style={{fontSize:11.5,color:"var(--tx3)"}}>{PLATFORMS[activeTab]?.specs.split(".")[0]}</div></div>
                    </div>
                    <div style={{whiteSpace:"pre-wrap",fontSize:13.5,lineHeight:1.7,maxHeight:310,overflowY:"auto"}}>{editContent[activeTab]||<span style={{color:"var(--tx3)",fontStyle:"italic"}}>Content appears here...</span>}</div>
                    <Bar cur={(editContent[activeTab]||"").length} max={PLATFORMS[activeTab]?.maxChars||2200}/>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end",flexWrap:"wrap"}}>
                <button onClick={generate} style={{padding:"13px 22px",borderRadius:"var(--r)",border:"1.5px solid var(--bd)",background:"transparent",color:"var(--tx2)",fontSize:13.5,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>Regenerate</button>
                <button onClick={publish} disabled={publishing} style={{padding:"13px 32px",borderRadius:"var(--r)",border:"none",background:"var(--ac)",color:"#fff",fontSize:13.5,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:8,opacity:publishing?0.6:1}}>
                  {publishing?"Publishing...":"Publish now"}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg></button>
              </div>
            </div>
          )}
        </main>
      ):(
        <main style={{padding:28,maxWidth:820,margin:"0 auto"}}>
          <h2 style={{fontFamily:"var(--fs)",fontSize:26,fontWeight:800,marginBottom:28}}>Post history</h2>
          {history.length===0?<div style={{textAlign:"center",padding:"80px 20px",color:"var(--tx3)"}}><p style={{fontSize:15,fontWeight:600,marginBottom:4}}>No posts yet</p></div>:(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {history.map((h:any)=>(
                <div key={h.id} style={{padding:"18px 22px",borderRadius:16,border:"1px solid var(--bd)",background:"var(--bg2)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>{h.topic}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {h.platforms.map((pl:string)=>{const r=h.results?.find((x:any)=>x.platform===pl);return(
                        <span key={pl} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,padding:"4px 10px",borderRadius:20,background:r?.success===false?"#fde8e8":`${PLATFORMS[pl]?.color}10`,fontWeight:600}}>
                          <PlatformIcon platform={pl} size={11} color={r?.success===false?"var(--er)":PLATFORMS[pl]?.color}/>
                          <span style={{color:r?.success===false?"var(--er)":PLATFORMS[pl]?.color}}>{PLATFORMS[pl]?.name}</span>
                          {r?.success===false&&<span title={r.error} style={{cursor:"help"}}>!</span>}
                        </span>
                      );})}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:11,padding:"5px 14px",borderRadius:20,background:h.status==="published"?"#e6f5ec":"#fde8e8",color:h.status==="published"?"var(--ok)":"var(--er)",fontWeight:800,textTransform:"uppercase"}}>{h.status}</span>
                    <div style={{fontSize:12,color:"var(--tx3)",marginTop:6}}>{h.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}
      {toast&&<div style={{position:"fixed",bottom:32,left:"50%",transform:"translateX(-50%)",background:"var(--ac)",color:"#fff",padding:"14px 28px",borderRadius:16,fontSize:14,fontWeight:600,zIndex:2000,animation:"fi .35s cubic-bezier(.16,1,.3,1)",boxShadow:"0 12px 40px rgba(0,0,0,.25)",whiteSpace:"nowrap"}}>{toast}</div>}
    </div>
  );
}

function Lbl({text}:{text:string}){return<label style={{display:"block",fontSize:11,color:"var(--tx3)",fontWeight:800,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:10}}>{text}</label>}
function Pill({l,a,o}:{l:string;a:boolean;o:()=>void}){return<button onClick={o} style={{padding:"8px 14px",borderRadius:24,border:a?"2px solid var(--ac)":"1.5px solid var(--bd)",background:a?"var(--ac)":"transparent",color:a?"#fff":"var(--tx2)",fontSize:12,fontWeight:700,cursor:"pointer"}}>{l}</button>}
function Bar({cur,max}:{cur:number;max:number}){const p=(cur/max)*100;const o=cur>max;const c=p>85;return<div style={{display:"flex",alignItems:"center",gap:10,marginTop:12}}><div style={{flex:1,height:4,background:"var(--bd)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(p,100)}%`,background:o?"var(--er)":c?"var(--wn)":"var(--ok)",transition:"all .4s",borderRadius:4}}/></div><span style={{fontSize:11.5,fontFamily:"var(--fm)",color:o?"var(--er)":c?"var(--wn)":"var(--tx3)",fontWeight:600,minWidth:65,textAlign:"right"}}>{cur}/{max}</span></div>}
