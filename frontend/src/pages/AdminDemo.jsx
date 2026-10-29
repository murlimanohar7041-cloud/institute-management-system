import React, { useState } from "react";

const students = [
{ id: "JSCI/001", name: "Rahul Kumar", className: "10th", branch: "Itimha", fee: "₹300", status: "Paid" },
{ id: "JSCI/002", name: "Priya Kumari", className: "12th Science", branch: "Bardiha", fee: "₹7,000", status: "Pending" },
{ id: "JSCI/003", name: "Aman Kumar", className: "11th Arts", branch: "Nasriganj", fee: "₹4,000", status: "Paid" },
{ id: "JSCI/004", name: "Neha Kumari", className: "9th", branch: "Rohtas", fee: "₹200", status: "Pending" },
];

const faculty = [
{ name: "Amit Kumar", subject: "Mathematics", branch: "Itimha" },
{ name: "Pooja Kumari", subject: "Physics", branch: "Bardiha" },
{ name: "Rakesh Sir", subject: "English", branch: "Nasriganj" },
];

const results = [
{ student: "Rahul Kumar", className: "10th", marks: "88%" },
{ student: "Priya Kumari", className: "12th Science", marks: "92%" },
{ student: "Aman Kumar", className: "11th Arts", marks: "85%" },
];

const sections = [
"Dashboard", "Students", "Classes", "Faculty Management",
"Results", "Fees", "Payments", "Notices", "Admissions", "Settings",
];

const styles = `.admin-demo, .admin-demo * { box-sizing: border-box; }
.admin-demo { width: 100%; min-height: 100vh; background: #f1f5f9; color: #0f172a; font-family: Arial, sans-serif; overflow-x: clip; }
.admin-demo .demo-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:16px 22px; background:#fff; border-bottom:1px solid #e2e8f0; }
.admin-demo .brand { margin:0; color:#1d4ed8; font-size:24px; }
.admin-demo .demo-back { background:#dc2626; color:white; border:0; border-radius:9px; padding:12px 16px; font-weight:700; cursor:pointer; }
.admin-demo .demo-warning { background:#fef3c7; color:#92400e; padding:12px; text-align:center; font-weight:700; }
.admin-demo .demo-layout { display:flex; min-height:calc(100vh - 115px); width:100%; }
.admin-demo .demo-sidebar { width:225px; flex:0 0 225px; padding:12px; background:#fff; border-right:1px solid #e2e8f0; }
.admin-demo .demo-nav { display:block; width:100%; text-align:left; padding:12px; margin-bottom:5px; border:0; border-radius:8px; cursor:pointer; background:transparent; color:#334155; font-size:14px; }
.admin-demo .demo-nav.active { background:#dbeafe; color:#1d4ed8; font-weight:700; }
.admin-demo .demo-main { flex:1; min-width:0; padding:24px 20px; }
.admin-demo .demo-inner { width:100%; max-width:1200px; margin:0 auto; }
.admin-demo .demo-card { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:20px; margin-bottom:18px; box-shadow:0 4px 12px rgba(15,23,42,.04); min-width:0; }
.admin-demo .demo-btn { background:#2563eb; color:#fff; border:0; border-radius:8px; padding:11px 14px; font-weight:600; cursor:pointer; }
.admin-demo .demo-muted { color:#64748b; }
.admin-demo .demo-table-wrap { width:100%; max-width:100%; overflow-x:auto; margin-top:16px; -webkit-overflow-scrolling:touch; }
.admin-demo table { width:100%; min-width:530px; border-collapse:collapse; font-size:14px; }
.admin-demo th { background:#eff6ff; text-align:left; }
.admin-demo th, .admin-demo td { padding:12px; border-bottom:1px solid #e2e8f0; white-space:nowrap; }
.admin-demo input { max-width:100%; }
.admin-demo .demo-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(160px,100%),1fr)); gap:14px; margin-bottom:20px; }
.admin-demo .demo-class-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr)); gap:14px; margin-top:16px; }
@media(max-width:700px) {
  .admin-demo .demo-header { padding:12px; }
  .admin-demo .brand { font-size:21px; }
  .admin-demo .demo-back { width:100%; }
  .admin-demo .demo-layout { display:flex; flex-direction:column; min-height:auto; }
  .admin-demo .demo-sidebar { display:flex; flex:0 0 auto; width:100%; max-width:100%; padding:8px; gap:6px; overflow-x:auto; border-right:0; border-bottom:1px solid #e2e8f0; -webkit-overflow-scrolling:touch; }
  .admin-demo .demo-nav { display:block; width:auto; flex:0 0 auto; white-space:nowrap; margin:0; padding:11px 13px; }
  .admin-demo .demo-main { width:100%; min-width:0; padding:15px 10px; }
  .admin-demo .demo-card { padding:15px; border-radius:12px; }
  .admin-demo h1 { font-size:23px !important; }
  .admin-demo h2 { font-size:20px; }
  .admin-demo .demo-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
  .admin-demo .demo-grid .demo-card { padding:13px; overflow-wrap:anywhere; }
  .admin-demo .demo-warning { font-size:13px; }
}
@media(max-width:380px) {
  .admin-demo .demo-main { padding:12px 8px; }
  .admin-demo .demo-card { padding:12px; }
  .admin-demo .demo-grid { grid-template-columns:1fr; }
  .admin-demo .brand { font-size:19px; }
}`;

export default function AdminDemo() {
const [active, setActive] = useState("Dashboard");
const [search, setSearch] = useState("");

const button = {
background: "#2563eb", color: "#fff", border: 0,
borderRadius: 8, padding: "11px 14px", fontWeight: 600, cursor: "pointer",
};

const demoAction = () =>
alert("Demo Mode: Sample data only. No real data has been changed.");

const filteredStudents = students.filter((s) =>
`${s.id} ${s.name} ${s.className} ${s.branch}`
.toLowerCase().includes(search.toLowerCase())
);

const table = (headers, rows) => ( <div className="demo-table-wrap"> <table> <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead> <tbody>
{rows.map((row, i) => ( <tr key={i}>
{row.map((value, j) => <td key={j}>{value}</td>)} </tr>
))}
{rows.length === 0 && <tr><td colSpan={headers.length}>No records found.</td></tr>} </tbody> </table> </div>
);

function content() {
if (active === "Students") {
return ( <section className="demo-card"> <h2>Student Management</h2> <p className="demo-muted">View and search sample student records.</p>
<input
value={search}
onChange={(e) => setSearch(e.target.value)}
placeholder="Search student name, ID, class or branch..."
style={{ width:"100%", padding:12, border:"1px solid #cbd5e1", borderRadius:8, marginTop:8 }}
/>
{table(["Student ID","Name","Class","Branch","Fee Status"], filteredStudents.map(s => [s.id,s.name,s.className,s.branch,s.status]))}
<button className="demo-btn" style={{ marginTop:16 }} onClick={demoAction}>+ Add Student (Demo)</button> </section>
);
}


if (active === "Faculty Management") {
  return <section className="demo-card"><h2>Faculty Management</h2>
    {table(["Faculty Name","Subject","Branch","Status"],faculty.map(f => [f.name,f.subject,f.branch,"Active"]))}
    <button className="demo-btn" style={{marginTop:16}} onClick={demoAction}>+ Add Faculty (Demo)</button>
  </section>;
}

if (active === "Results") {
  return <section className="demo-card"><h2>Student Results</h2>
    {table(["Student","Class","Result"],results.map(r => [r.student,r.className,r.marks]))}
    <button className="demo-btn" style={{marginTop:16}} onClick={demoAction}>+ Publish Result (Demo)</button>
  </section>;
}

if (active === "Fees" || active === "Payments") {
  return <section className="demo-card"><h2>{active} Management</h2>
    <p className="demo-muted">Sample fee records. No real transactions are processed.</p>
    {table(["Student","Class","Amount","Status"],students.map(s => [s.name,s.className,s.fee,s.status]))}
    <button className="demo-btn" style={{marginTop:16}} onClick={demoAction}>View Payment Details (Demo)</button>
  </section>;
}

if (active === "Classes") {
  return <section className="demo-card"><h2>Classes Management</h2>
    <div className="demo-class-grid">
      {["9th","10th","11th Science","11th Arts","12th Science","12th Arts"].map(c => (
        <div key={c} style={{padding:18,background:"#eff6ff",borderRadius:12}}>
          <h3 style={{color:"#1d4ed8",marginTop:0}}>{c}</h3>
          <p style={{marginBottom:0}}>Available Class</p>
        </div>
      ))}
    </div>
  </section>;
}

if (active === "Notices") {
  return <section className="demo-card"><h2>Notices & Announcements</h2>
    {[["Monthly Test","Monthly test will be conducted next week."],["Fee Reminder","Please submit pending fees on time."],["Class Schedule","Regular classes will follow the updated timetable."]].map(([title,text]) => (
      <div key={title} style={{padding:15,marginTop:12,background:"#f8fafc",borderRadius:10}}>
        <strong>{title}</strong><p>{text}</p>
      </div>
    ))}
    <button className="demo-btn" style={{marginTop:15}} onClick={demoAction}>+ Create Notice (Demo)</button>
  </section>;
}

if (active === "Admissions") {
  return <section className="demo-card"><h2>Admission Enquiries</h2>
    {table(["Applicant","Class","Branch","Status"],[["Suman Kumar","9th","Itimha","New"],["Anjali Kumari","11th Science","Bardiha","Under Review"]])}
    <p className="demo-muted">These are example admission enquiries.</p>
  </section>;
}

if (active === "Settings") {
  return <section className="demo-card"><h2>Institute Settings</h2>
    <p><strong>Institute:</strong> J. Solution Classes</p>
    <p><strong>Branches:</strong> Itimha, Bardiha, Nasriganj, Rohtas</p>
    <p><strong>Account:</strong> Admin Demo</p>
    <p style={{color:"#b45309"}}>Settings are view-only in Demo Mode.</p>
  </section>;
}

return <>
  <section className="demo-card" style={{background:"linear-gradient(120deg,#eff6ff,#fff)"}}>
    <p style={{color:"#2563eb",fontWeight:700,margin:"0 0 8px"}}>ADMIN CONTROL PANEL</p>
    <h2>Welcome, Admin 👋</h2>
    <p className="demo-muted">Manage your institute from one dashboard.</p>
  </section>
  <div className="demo-grid">
    {[["Total Students","248","👨‍🎓"],["Faculty Members","12","👩‍🏫"],["Fees Collected","₹1.8L","💰"],["Pending Payments","18","💳"]].map(([label,value,icon]) => (
      <div className="demo-card" key={label}>
        <div style={{fontSize:26}}>{icon}</div>
        <p className="demo-muted">{label}</p>
        <h2 style={{color:"#1d4ed8",margin:0}}>{value}</h2>
      </div>
    ))}
  </div>
  <section className="demo-card"><h2>Recent Student Records</h2>
    {table(["Student ID","Name","Class","Branch","Fee Status"],students.slice(0,3).map(s => [s.id,s.name,s.className,s.branch,s.status]))}
    <button className="demo-btn" style={{marginTop:16}} onClick={() => setActive("Students")}>View All Students →</button>
  </section>
</>;


}

return ( <div className="admin-demo"> <style>{styles}</style> <header className="demo-header"> <div><h2 className="brand">J. Solution Classes</h2><small className="demo-muted">Admin Dashboard · Demo</small></div>
<button className="demo-back" onClick={() => { window.location.href="/live-demo"; }}>← Back to Live Demo</button> </header> <div className="demo-warning">DEMO MODE — Sample data only. No real institute data is accessed or changed.</div> <div className="demo-layout"> <aside className="demo-sidebar">
{sections.map(section => (
<button key={section} className={`demo-nav ${active===section?"active":""}`}
onClick={() => {setActive(section);setSearch("");}}>{section}</button>
))} </aside> <main className="demo-main"> <div className="demo-inner">
<h1 style={{margin:"0 0 6px",fontSize:27}}>{active}</h1> <p className="demo-muted" style={{marginTop:0,marginBottom:22}}>J. Solution Classes · Admin Demo Account</p>
{content()} </div> </main> </div> </div>
);
}
