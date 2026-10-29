import React, { useState } from "react";

const demoStudents = [
{ id:"JSCI/001", name:"Rahul Kumar", className:"10th", branch:"Itimha", mobile:"98XXXXXX21" },
{ id:"JSCI/002", name:"Priya Kumari", className:"12th Science", branch:"Bardiha", mobile:"98XXXXXX42" },
{ id:"JSCI/003", name:"Aman Kumar", className:"11th Arts", branch:"Nasriganj", mobile:"98XXXXXX63" },
{ id:"JSCI/004", name:"Neha Kumari", className:"9th", branch:"Rohtas", mobile:"98XXXXXX84" },
];

const demoResults = [
{ name:"Rahul Kumar", className:"10th", subject:"Mathematics", marks:"88/100" },
{ name:"Priya Kumari", className:"12th Science", subject:"Physics", marks:"92/100" },
{ name:"Aman Kumar", className:"11th Arts", subject:"English", marks:"85/100" },
];

const demoMaterials = [
{ title:"Mathematics — Chapter 1", type:"PDF", date:"25 Oct 2026" },
{ title:"Physics — Important Questions", type:"Notes", date:"24 Oct 2026" },
{ title:"English — Practice Set", type:"Study Material", date:"22 Oct 2026" },
];

const demoNotices = [
{ title:"Monthly Test", text:"Monthly test will be conducted next week." },
{ title:"Class Timing", text:"Students should arrive 10 minutes before class." },
];

const sections = ["Dashboard","Students","Results","Analytics","Study Materials","Payments","Notices","Notifications"];

const styles = `.faculty-demo, .faculty-demo * { box-sizing:border-box; }
.faculty-demo { width:100%; min-height:100vh; background:#f1f5f9; color:#0f172a; font-family:Arial,sans-serif; overflow-x:clip; }
.faculty-demo .demo-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:15px 20px; background:#fff; border-bottom:1px solid #e2e8f0; }
.faculty-demo .brand { margin:0; color:#1d4ed8; font-size:24px; }
.faculty-demo .demo-back { background:#dc2626; color:#fff; border:0; border-radius:9px; padding:12px 16px; font-weight:700; cursor:pointer; }
.faculty-demo .demo-warning { background:#fef3c7; color:#92400e; padding:12px; font-weight:700; text-align:center; }
.faculty-demo .demo-layout { display:flex; width:100%; min-height:calc(100vh - 120px); }
.faculty-demo .demo-sidebar { width:220px; flex:0 0 220px; padding:14px; background:#fff; border-right:1px solid #e2e8f0; }
.faculty-demo .demo-nav { display:block; width:100%; text-align:left; padding:12px; margin-bottom:5px; border:0; border-radius:9px; background:transparent; color:#334155; cursor:pointer; font-size:14px; }
.faculty-demo .demo-nav.active { background:#dbeafe; color:#1d4ed8; font-weight:700; }
.faculty-demo .demo-main { flex:1; min-width:0; padding:24px 20px; }
.faculty-demo .demo-inner { max-width:1200px; width:100%; margin:0 auto; }
.faculty-demo .demo-card { min-width:0; background:#fff; border:1px solid #e5e7eb; border-radius:15px; padding:20px; margin-bottom:18px; box-shadow:0 4px 14px rgba(15,23,42,.04); }
.faculty-demo .demo-btn { border:0; border-radius:9px; padding:11px 15px; background:#2563eb; color:#fff; font-weight:600; cursor:pointer; }
.faculty-demo .demo-muted { color:#64748b; }
.faculty-demo .demo-table-wrap { width:100%; max-width:100%; overflow-x:auto; margin-top:15px; -webkit-overflow-scrolling:touch; }
.faculty-demo table { width:100%; min-width:550px; border-collapse:collapse; font-size:14px; }
.faculty-demo th { background:#eff6ff; text-align:left; }
.faculty-demo th,.faculty-demo td { padding:12px; border-bottom:1px solid #e5e7eb; white-space:nowrap; }
.faculty-demo .demo-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(170px,100%),1fr)); gap:15px; margin-bottom:20px; }
@media(max-width:700px) {
  .faculty-demo .demo-header { padding:12px; }
  .faculty-demo .brand { font-size:21px; }
  .faculty-demo .demo-back { width:100%; }
  .faculty-demo .demo-layout { flex-direction:column; min-height:auto; }
  .faculty-demo .demo-sidebar { display:flex; width:100%; max-width:100%; flex:0 0 auto; gap:6px; padding:8px; overflow-x:auto; border-right:0; border-bottom:1px solid #e2e8f0; -webkit-overflow-scrolling:touch; }
  .faculty-demo .demo-nav { width:auto; flex:0 0 auto; white-space:nowrap; margin:0; padding:11px 13px; }
  .faculty-demo .demo-main { width:100%; min-width:0; padding:15px 10px; }
  .faculty-demo .demo-card { padding:15px; border-radius:12px; }
  .faculty-demo h1 { font-size:23px !important; }
  .faculty-demo h2 { font-size:20px; }
  .faculty-demo .demo-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
  .faculty-demo .demo-grid .demo-card { padding:13px; overflow-wrap:anywhere; }
  .faculty-demo .demo-warning { font-size:13px; }
}
@media(max-width:380px) {
  .faculty-demo .demo-main { padding:12px 8px; }
  .faculty-demo .demo-card { padding:12px; }
  .faculty-demo .demo-grid { grid-template-columns:1fr; }
  .faculty-demo .brand { font-size:19px; }
}`;

export default function FacultyDemo() {
const [active,setActive] = useState("Dashboard");
const [search,setSearch] = useState("");

const buttonStyle = { border:0,borderRadius:9,padding:"10px 15px",background:"#2563eb",color:"#fff",fontWeight:600,cursor:"pointer" };
const demoMessage = () => alert("Demo Mode: This is sample data. No real data has been changed.");

const filteredStudents = demoStudents.filter(student =>
`${student.name} ${student.id} ${student.className} ${student.branch}`.toLowerCase().includes(search.toLowerCase())
);

const table = (headers,rows) => ( <div className="demo-table-wrap"><table> <thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead> <tbody>{rows.map((row,i) => <tr key={i}>{row.map((v,j) => <td key={j}>{v}</td>)}</tr>)}
{rows.length===0 && <tr><td colSpan={headers.length}>No sample records found.</td></tr>}</tbody> </table></div>
);

function renderContent() {
if(active==="Students") return <section className="demo-card"> <h2>Students</h2><p className="demo-muted">View students assigned to your branch.</p>
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, ID, class or branch..."
style={{width:"100%",maxWidth:450,boxSizing:"border-box",padding:12,margin:"12px 0",border:"1px solid #cbd5e1",borderRadius:9}}/>
{table(["Student ID","Name","Class","Branch","Mobile"],filteredStudents.map(s=>[s.id,s.name,s.className,s.branch,s.mobile]))} </section>;

if(active==="Results") return <section className="demo-card"><h2>Student Results</h2>
  <p className="demo-muted">Sample results for demonstration.</p>
  {demoResults.map((r,i)=><div key={i} style={{padding:15,borderBottom:"1px solid #e5e7eb"}}>
    <strong>{r.name}</strong><p style={{margin:"6px 0"}}>{r.className} · {r.subject}</p>
    <span style={{color:"#15803d",fontWeight:700}}>Marks: {r.marks}</span>
  </div>)}
  <button className="demo-btn" style={{marginTop:15}} onClick={demoMessage}>＋ Add Result (Demo)</button>
</section>;

if(active==="Study Materials") return <section className="demo-card"><h2>Study Materials</h2>
  {demoMaterials.map((item,i)=><div key={i} style={{padding:15,marginTop:12,border:"1px solid #e5e7eb",borderRadius:10}}>
    <strong>📘 {item.title}</strong><p className="demo-muted" style={{marginBottom:0}}>{item.type} · {item.date}</p>
  </div>)}
  <button className="demo-btn" style={{marginTop:16}} onClick={demoMessage}>＋ Upload Material (Demo)</button>
</section>;

if(active==="Payments") return <section className="demo-card"><h2>Payments</h2>
  <p className="demo-muted">Sample payment overview — view only.</p>
  {[["Rahul Kumar","₹300","Paid"],["Priya Kumari","₹7,000","Pending"],["Aman Kumar","₹4,000","Paid"]].map((p,i)=>
    <div key={i} style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap",padding:14,borderBottom:"1px solid #e5e7eb"}}>
      <strong>{p[0]}</strong><span>{p[1]}</span><span style={{color:p[2]==="Paid"?"#15803d":"#b45309",fontWeight:700}}>{p[2]}</span>
    </div>)}
</section>;

if(active==="Notices") return <section className="demo-card"><h2>Notices</h2>
  {demoNotices.map((n,i)=><div key={i} style={{padding:15,marginTop:12,background:"#f8fafc",borderRadius:10}}>
    <strong>{n.title}</strong><p>{n.text}</p>
  </div>)}
  <button className="demo-btn" style={{marginTop:15}} onClick={demoMessage}>＋ Publish Notice (Demo)</button>
</section>;

if(active==="Analytics") return <section className="demo-card"><h2>Class Analytics</h2>
  <div className="demo-grid">{[["Total Students","124"],["Average Marks","86%"],["Results Published","32"],["Study Materials","18"]].map(([l,v])=>
    <div key={l} style={{padding:18,background:"#eff6ff",borderRadius:12}}><p>{l}</p><h2 style={{color:"#1d4ed8"}}>{v}</h2></div>)}</div>
</section>;

if(active==="Notifications") return <section className="demo-card"><h2>Notifications</h2>
  <div style={{padding:15,borderRadius:10,background:"#eff6ff",marginTop:15}}><strong>Demo notification</strong><p>This is an example notification for the faculty dashboard.</p></div>
</section>;

return <>
  <section className="demo-card" style={{background:"linear-gradient(120deg,#eff6ff,#fff)"}}>
    <p style={{color:"#2563eb",fontWeight:700}}>FACULTY PORTAL</p><h2>Welcome, Faculty 👋</h2>
    <p className="demo-muted">Manage students, results and study materials from one place.</p>
  </section>
  <div className="demo-grid">{[["Total Students","124","👨‍🎓"],["Results Published","32","📊"],["Study Materials","18","📚"],["Pending Payments","12","💳"]].map(([l,v,icon])=>
    <div className="demo-card" key={l}><div style={{fontSize:26}}>{icon}</div><p className="demo-muted">{l}</p><h2 style={{margin:0,color:"#1d4ed8"}}>{v}</h2></div>)}</div>
  <section className="demo-card"><h2>Recent Students</h2>
    {demoStudents.slice(0,3).map(s=><div key={s.id} style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap",padding:13,borderBottom:"1px solid #e5e7eb"}}>
      <strong>{s.name}</strong><span>{s.className}</span><span className="demo-muted">{s.branch}</span>
    </div>)}
    <button className="demo-btn" style={{marginTop:16}} onClick={()=>setActive("Students")}>View All Students →</button>
  </section>
</>;


}

return <div className="faculty-demo"> <style>{styles}</style> <header className="demo-header"> <div><h2 className="brand">J. Solution Classes</h2><small className="demo-muted">Faculty Dashboard · Demo</small></div>
<button className="demo-back" onClick={()=>{window.location.href="/live-demo";}}>← Back to Live Demo</button> </header> <div className="demo-warning">DEMO MODE — Sample data only. No real student data is accessed or changed.</div> <div className="demo-layout"> <aside className="demo-sidebar">{sections.map(s=><button key={s} className={`demo-nav ${active===s?"active":""}`} onClick={()=>{setActive(s);setSearch("");}}>{s}</button>)}</aside> <main className="demo-main"><div className="demo-inner">
<h1 style={{margin:"0 0 6px",fontSize:27}}>{active}</h1> <p className="demo-muted" style={{marginTop:0,marginBottom:22}}>J. Solution Classes · Faculty Demo Account</p>
{renderContent()} </div></main> </div>

  </div>;
}
