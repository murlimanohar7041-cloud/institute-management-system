import React, { useState } from "react";

const student = {
name:"Rahul Kumar", id:"JSCI/001", father:"Rajesh Kumar",
className:"10th", branch:"Itimha", mobile:"98XXXXXX21",
};

const fees = [
{month:"October 2026",amount:"₹300",status:"Paid"},
{month:"November 2026",amount:"₹300",status:"Pending"},
{month:"December 2026",amount:"₹300",status:"Pending"},
];

const results = [
{subject:"Mathematics",marks:"88/100",grade:"A"},
{subject:"Science",marks:"91/100",grade:"A+"},
{subject:"English",marks:"85/100",grade:"A"},
{subject:"Hindi",marks:"89/100",grade:"A"},
];

const menu = ["Dashboard","My Profile","My Fees","Payment History","My Results","Study Materials","Notices"];

const styles = `.student-demo, .student-demo * { box-sizing:border-box; }
.student-demo { width:100%; min-height:100vh; background:#f1f5f9; color:#0f172a; font-family:Arial,sans-serif; overflow-x:clip; }
.student-demo .demo-header { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding:15px 20px; background:#fff; border-bottom:1px solid #e2e8f0; }
.student-demo .brand { margin:0; color:#1d4ed8; font-size:24px; }
.student-demo .demo-back { background:#dc2626; color:#fff; border:0; border-radius:9px; padding:12px 16px; font-weight:700; cursor:pointer; }
.student-demo .demo-warning { background:#fef3c7; color:#92400e; text-align:center; padding:12px; font-weight:700; }
.student-demo .demo-layout { display:flex; width:100%; min-height:calc(100vh - 115px); }
.student-demo .demo-sidebar { width:220px; flex:0 0 220px; padding:12px; background:#fff; border-right:1px solid #e2e8f0; }
.student-demo .demo-nav { display:block; width:100%; text-align:left; padding:12px; margin-bottom:5px; border:0; border-radius:8px; cursor:pointer; background:transparent; color:#334155; font-size:14px; }
.student-demo .demo-nav.active { background:#dbeafe; color:#1d4ed8; font-weight:700; }
.student-demo .demo-main { flex:1; min-width:0; padding:24px 20px; }
.student-demo .demo-inner { width:100%; max-width:1100px; margin:0 auto; }
.student-demo .demo-card { min-width:0; background:#fff; border:1px solid #e2e8f0; border-radius:15px; padding:20px; margin-bottom:18px; box-shadow:0 4px 12px rgba(15,23,42,.04); }
.student-demo .demo-btn { background:#2563eb; color:#fff; border:0; border-radius:9px; padding:11px 16px; font-weight:600; cursor:pointer; }
.student-demo .demo-muted { color:#64748b; }
.student-demo .demo-table-wrap { width:100%; max-width:100%; overflow-x:auto; margin-top:15px; -webkit-overflow-scrolling:touch; }
.student-demo table { width:100%; min-width:400px; border-collapse:collapse; font-size:14px; }
.student-demo th { text-align:left; background:#eff6ff; }
.student-demo th,.student-demo td { padding:12px; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
.student-demo .demo-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(160px,100%),1fr)); gap:14px; margin-bottom:20px; }
@media(max-width:700px) {
  .student-demo .demo-header { padding:12px; }
  .student-demo .brand { font-size:21px; }
  .student-demo .demo-back { width:100%; }
  .student-demo .demo-layout { flex-direction:column; min-height:auto; }
  .student-demo .demo-sidebar { display:flex; width:100%; max-width:100%; flex:0 0 auto; gap:6px; padding:8px; overflow-x:auto; border-right:0; border-bottom:1px solid #e2e8f0; -webkit-overflow-scrolling:touch; }
  .student-demo .demo-nav { width:auto; flex:0 0 auto; white-space:nowrap; margin:0; padding:11px 13px; }
  .student-demo .demo-main { width:100%; min-width:0; padding:15px 10px; }
  .student-demo .demo-card { padding:15px; border-radius:12px; }
  .student-demo h1 { font-size:23px !important; }
  .student-demo h2 { font-size:20px; }
  .student-demo .demo-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
  .student-demo .demo-grid .demo-card { padding:13px; overflow-wrap:anywhere; }
  .student-demo .demo-warning { font-size:13px; }
}
@media(max-width:380px) {
  .student-demo .demo-main { padding:12px 8px; }
  .student-demo .demo-card { padding:12px; }
  .student-demo .demo-grid { grid-template-columns:1fr; }
  .student-demo .brand { font-size:19px; }
}`;

export default function StudentDemo() {
const [active,setActive] = useState("Dashboard");
const button = {background:"#2563eb",color:"#fff",border:0,borderRadius:9,padding:"11px 16px",fontWeight:600,cursor:"pointer"};
const demoMessage = () => alert("Demo Mode: This is sample data. No real payment or data changes occur.");

const table = (headers,rows) => ( <div className="demo-table-wrap"><table> <thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead> <tbody>{rows.map((row,i)=><tr key={i}>{row.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody> </table></div>
);

function content() {
if(active==="My Profile") return <section className="demo-card"><h2>Student Profile</h2>
{[["Student Name",student.name],["Student ID",student.id],["Father's Name",student.father],["Class",student.className],["Branch",student.branch],["Mobile Number",student.mobile]].map(([label,value])=>
<div key={label} style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",padding:14,borderBottom:"1px solid #e2e8f0"}}> <span className="demo-muted">{label}</span><strong>{value}</strong> </div>)} </section>;


if(active==="My Fees"||active==="Payment History") return <section className="demo-card"><h2>{active}</h2>
  <p className="demo-muted">Sample fee details. Real payments are disabled in demo.</p>
  {table(["Month","Amount","Status"],fees.map(f=>[f.month,f.amount,f.status]))}
  <div style={{marginTop:20,padding:15,background:"#eff6ff",borderRadius:12}}>
    <p>Total sample fees: <strong>₹900</strong></p>
    <p>Paid: <strong style={{color:"#15803d"}}>₹300</strong></p>
    <p>Pending: <strong style={{color:"#b45309"}}>₹600</strong></p>
    <button className="demo-btn" onClick={demoMessage}>Pay Fees (Demo Only)</button>
  </div>
</section>;

if(active==="My Results") return <section className="demo-card"><h2>My Academic Results</h2>
  <div style={{padding:18,background:"#eff6ff",borderRadius:12,marginTop:15}}>
    <p className="demo-muted">Sample Overall Percentage</p>
    <h1 style={{color:"#1d4ed8",fontSize:36,margin:"8px 0"}}>88.25%</h1>
    <span>Academic Session: 2026–27</span>
  </div>
  {table(["Subject","Marks","Grade"],results.map(r=>[r.subject,r.marks,r.grade]))}
</section>;

if(active==="Study Materials") return <section className="demo-card"><h2>Study Materials</h2>
  {[["Mathematics Chapter 1","PDF Notes"],["Science Important Questions","Practice Set"],["English Grammar","Study Notes"]].map(([title,type])=>
    <div key={title} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",padding:15,marginTop:12,border:"1px solid #e2e8f0",borderRadius:10}}>
      <div><strong>📘 {title}</strong><p className="demo-muted">{type}</p></div>
      <button className="demo-btn" onClick={demoMessage}>View (Demo)</button>
    </div>)}
</section>;

if(active==="Notices") return <section className="demo-card"><h2>Institute Notices</h2>
  {[["Monthly Test","Monthly test will be held next week."],["Fee Reminder","Please check your pending fee details."],["Class Schedule","Attend classes according to the timetable."]].map(([title,text])=>
    <div key={title} style={{padding:15,marginTop:12,background:"#f8fafc",borderRadius:10}}>
      <strong>{title}</strong><p style={{marginBottom:0}}>{text}</p>
    </div>)}
</section>;

return <>
  <section className="demo-card" style={{background:"linear-gradient(120deg,#eff6ff,#fff)"}}>
    <p style={{color:"#2563eb",fontWeight:700}}>STUDENT PORTAL</p>
    <h2>Welcome, {student.name}! 👋</h2>
    <p className="demo-muted">Your learning journey starts here.</p>
  </section>
  <div className="demo-grid">
    {[["My Class",student.className,"🎓"],["Overall Result","88.25%","📊"],["Fees Paid","₹300","✅"],["Pending Fees","₹600","💳"]].map(([label,value,icon])=>
      <div className="demo-card" key={label}><div style={{fontSize:25}}>{icon}</div><p className="demo-muted">{label}</p><h2 style={{margin:0,color:"#1d4ed8"}}>{value}</h2></div>)}
  </div>
  <section className="demo-card"><h2>Recent Results</h2>
    {results.slice(0,3).map(r=><div key={r.subject} style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",padding:13,borderBottom:"1px solid #e2e8f0"}}>
      <span>{r.subject}</span><strong>{r.marks}</strong>
    </div>)}
    <button className="demo-btn" style={{marginTop:16}} onClick={()=>setActive("My Results")}>View All Results →</button>
  </section>
</>;

}

return <div className="student-demo"> <style>{styles}</style> <header className="demo-header"> <div><h2 className="brand">J. Solution Classes</h2><small className="demo-muted">Student Dashboard · Demo</small></div>
<button className="demo-back" onClick={()=>{window.location.href="/live-demo";}}>← Back to Live Demo</button> </header> <div className="demo-warning">DEMO MODE — Sample data only. No real payment is processed.</div> <div className="demo-layout"> <aside className="demo-sidebar">{menu.map(item=><button key={item} className={`demo-nav ${active===item?"active":""}`} onClick={()=>setActive(item)}>{item}</button>)}</aside> <main className="demo-main"><div className="demo-inner">
<h1 style={{margin:"0 0 6px",fontSize:27}}>{active}</h1> <p className="demo-muted" style={{marginTop:0,marginBottom:22}}>Student ID: {student.id}</p>
{content()} </div></main> </div>

  </div>;
}
