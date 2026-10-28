import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebase";

export default function FacultyDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [facultyData, setFacultyData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [notices, setNotices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("All");
  const [studentStreamFilter, setStudentStreamFilter] = useState("All");
  const [studentBranchFilter, setStudentBranchFilter] = useState("All");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: "", fatherName: "", mobile: "", className: "9th", stream: ""
  });

  const [showResultForm, setShowResultForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showNoticeForm, setShowNoticeForm] = useState(false);

  const [saving, setSaving] = useState(false);

  const [resultForm, setResultForm] = useState({
    studentEmail: "",
    exam: "",
    percentage: "",
  });

  const [materialForm, setMaterialForm] = useState({
    title: "",
    subject: "",
    className: "9th",
    stream: "",
    branch: "",
    description: "",
    materialUrl: "",
  });

  const [noticeForm, setNoticeForm] = useState({
    title: "",
    message: "",
  });

  useEffect(() => {
    let unsubscribeNotifications = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      const facultyEmail = currentUser.email?.trim().toLowerCase();

      if (!facultyEmail) {
        alert("Faculty email not found.");
        await auth.signOut();
        window.location.href = "/login";
        return;
      }

      try {
        const facultyRef = doc(db, "faculty", facultyEmail);
        const facultySnapshot = await getDoc(facultyRef);

        if (!facultySnapshot.exists()) {
          alert("Access denied. Faculty account not found.");
          await auth.signOut();
          window.location.href = "/login";
          return;
        }

        const facultyDoc = facultySnapshot;
        const data = facultyDoc.data();

        if (data.status !== "active") {
          alert("Your faculty account is currently inactive.");
          await auth.signOut();
          window.location.href = "/login";
          return;
        }

        const normalizedFaculty = {
        id: facultyDoc.id,
        name: data.name || currentUser.displayName || "Faculty",
        email: facultyEmail,
        branches: data.branches || [data.branch || ""],
        subject: data.subject || "",
        status: data.status || "active",
        };

        setUser(currentUser);
        setFacultyData(normalizedFaculty);

        localStorage.setItem("facultyId", facultyDoc.id);
        localStorage.setItem("facultyEmail", facultyEmail);
        localStorage.setItem("facultyName", normalizedFaculty.name);

        localStorage.setItem(
        "facultyBranches",
        JSON.stringify(normalizedFaculty.branches)
        );

        localStorage.setItem("facultySubject", normalizedFaculty.subject);

       await loadAllData(normalizedFaculty.branches);

        const notificationQuery = query(
          collection(db, "facultyNotifications"),
          where("facultyEmail", "==", facultyEmail)
        );

        unsubscribeNotifications = onSnapshot(
          notificationQuery,
          (snapshot) => {
            const notificationData = snapshot.docs

              .map((item) => ({ id: item.id, ...item.data() }))
              .filter(
              (item) =>
    !normalizedFaculty.branches?.length ||
    normalizedFaculty.branches.includes(item.branch)
)
              .sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
              });

            setNotifications(notificationData);
          },
          (error) => {
            console.error("Faculty notification error:", error);
          }
        );

        setLoading(false);
      } catch (error) {
        console.error("Faculty authentication error:", error);
        alert("Faculty verification failed. Please try again.");
        try {
          await auth.signOut();
        } catch (signOutError) {
          console.error("Sign out error:", signOutError);
        }
        window.location.href = "/login";
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeNotifications) unsubscribeNotifications();
    };
  }, []);

  const loadAllData = async (assignedBranches = []) => {
    try {
      const studentQuery = query(
        collection(db, "students"),
        where("status", "==", "approved")
      );

      const studentSnap = await getDocs(studentQuery);
      const allStudentData = studentSnap.docs.map((item) => ({
        ...item.data(),
        id: item.id,
        firestoreId: item.id,
      }));

      const branchStudents = allStudentData.filter(
        (student) => !assignedBranches.length || assignedBranches.includes(student.branch)
      );
      const branchStudentEmails = new Set(
        branchStudents.map((student) => student.email?.trim().toLowerCase()).filter(Boolean)
      );
      setStudents(branchStudents);

      const resultSnap = await getDocs(collection(db, "results"));
      const allResults = resultSnap.docs.map((item) => ({
        ...item.data(),
        id: item.id,
        firestoreId: item.id,
      }));
      setResults(
        allResults.filter(
          (result) =>
            !assignedBranches.length || assignedBranches.includes(result.branch)
        )
      );

      const materialSnap = await getDocs(collection(db, "studyMaterials"));
      const allMaterials = materialSnap.docs.map((item) => ({
        ...item.data(),
        id: item.id,
        firestoreId: item.id,
      }));
      setMaterials(
        allMaterials.filter(
          (material) => !assignedBranches.length || assignedBranches.includes(material.branch)
        )
      );

      const noticeSnap = await getDocs(collection(db, "notices"));
      const allNotices = noticeSnap.docs.map((item) => ({
        ...item.data(),
        id: item.id,
        firestoreId: item.id,
      }));
      setNotices(
        allNotices.filter(
          (notice) => !assignedBranches.length || assignedBranches.includes(notice.branch)
        )
      );

      const facultyBranches = Array.isArray(assignedBranches)
  ? assignedBranches.filter(Boolean)
  : [];

let paymentSnap;

if (facultyBranches.length > 0) {
  paymentSnap = await getDocs(
    query(
      collection(db, "payments"),
      where("branch", "in", facultyBranches)
    )
  );
} else {
  paymentSnap = await getDocs(collection(db, "payments"));
}
      const allPayments = paymentSnap.docs.map((item) => ({
        ...item.data(),
        id: item.id,
        firestoreId: item.id,
      }));
      setPayments(
        allPayments
          .filter(
            (payment) =>
              !assignedBranches.length || assignedBranches.includes(payment.branch)
          )
          .sort((a, b) => {
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
          })
      );
    } catch (error) {
      console.error("Data load error:", error);
      alert("Data load nahi ho paya.");
    }
  };

  const markNotificationRead = async (notification) => {
    if (!notification?.id || notification.read) return;
    try {
      await updateDoc(doc(db, "facultyNotifications", notification.id), {
        read: true,
        readAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Notification read error:", error);
    }
  };

  const deleteNotification = async (notification) => {
    if (!notification?.id) return;
    try {
      await deleteDoc(doc(db, "facultyNotifications", notification.id));
    } catch (error) {
      console.error("Notification delete error:", error);
    }
  };

  const openEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({
      name: student.name || "",
      fatherName: student.fatherName || "",
      mobile: student.mobile || "",
      className: student.className || "9th",
      stream: student.stream || "",
    });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!studentForm.name || !studentForm.fatherName || !studentForm.mobile || !studentForm.className) {
      alert("Please fill all required fields.");
      return;
    }
    if ((studentForm.className === "11th" || studentForm.className === "12th") && !studentForm.stream) {
      alert("11th/12th ke liye stream select karein.");
      return;
    }
    try {
      setSaving(true);
      const firestoreStudentId = editingStudent?.firestoreId || editingStudent?.id;
      if (!firestoreStudentId || firestoreStudentId.includes("/")) {
        throw new Error("Invalid student Firestore document ID.");
      }

      await updateDoc(doc(db, "students", firestoreStudentId), {
        name: studentForm.name.trim(),
        fatherName: studentForm.fatherName.trim(),
        mobile: studentForm.mobile.trim(),
        className: studentForm.className,
        stream: (studentForm.className === "11th" || studentForm.className === "12th") ? studentForm.stream : "",
        updatedAt: serverTimestamp(),
      });
      alert("Student details updated successfully.");
      setEditingStudent(null);
     await loadAllData(facultyData?.branches || []);
    } catch (error) {
      console.error(error);
      alert("Student update nahi hua. " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getStudentResults = (student) => {
    if (!student?.email) return [];
    return results.filter((result) => result.studentEmail?.toLowerCase() === student.email.toLowerCase());
  };

  const getStudentPayments = (student) => {
    if (!student?.email) return [];
    return payments.filter((payment) => payment.studentEmail?.toLowerCase() === student.email.toLowerCase());
  };

  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/login";
  };

  const handleAddResult = async (e) => {
    e.preventDefault();

    if (
      !resultForm.studentEmail ||
      !resultForm.exam ||
      !resultForm.percentage
    ) {
      alert("Please fill all fields.");
      return;
    }

    const percentage = Number(resultForm.percentage);

    if (percentage < 0 || percentage > 100) {
      alert("Percentage 0 se 100 ke beech hona chahiye.");
      return;
    }

    const student = students.find(
      (item) =>
        item.email?.toLowerCase() ===
        resultForm.studentEmail.toLowerCase()
    );

    if (!student) {
      alert("Student nahi mila.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "results"), {
        resultId: `RES-${Date.now()}`,
        studentEmail: student.email,
        studentName: student.name,
        studentId: student.studentId || "",
        className: student.className || "",
        stream: student.stream || "",
        exam: resultForm.exam,
        percentage: percentage,
        branch: student.branch || "",
        facultyEmail: user?.email?.trim().toLowerCase() || "",
        facultyName: facultyData?.name || "Faculty",
        subject: facultyData?.subject || "",
        status: "Published",
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
      });

      alert("Result successfully added.");

      setResultForm({
        studentEmail: "",
        exam: "",
        percentage: "",
      });

      setShowResultForm(false);

      await loadAllData(facultyData?.branches || []);
    } catch (error) {
      console.error(error);
      alert("Result save nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();

    if (
      !materialForm.title ||
      !materialForm.subject ||
      !materialForm.materialUrl
    ) {
      alert("Title, Subject aur PDF URL required hai.");
      return;
    }

    if (
      !materialForm.materialUrl.startsWith("http://") &&
      !materialForm.materialUrl.startsWith("https://")
    ) {
      alert("Valid PDF/Google Drive URL dijiye.");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "studyMaterials"), {
        title: materialForm.title,
        subject: materialForm.subject,
        className: materialForm.className,
        stream: materialForm.stream,
        description: materialForm.description,
        materialUrl: materialForm.materialUrl,
        branch: materialForm.branch || "",
        facultyEmail: user?.email?.trim().toLowerCase() || "",
        facultyName: facultyData?.name || "Faculty",
        status: "Published",
        createdAt: serverTimestamp(),
      });

      alert("Study material successfully added.");

      setMaterialForm({
        title: "",
        subject: "",
        className: "9th",
        stream: "",
        branch: "",
        description: "",
        materialUrl: "",
      });

      setShowMaterialForm(false);

      await loadAllData(facultyData?.branches || []);
    } catch (error) {
      console.error(error);
      alert("Study material save nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNotice = async (e) => {
    e.preventDefault();

    if (!noticeForm.title || !noticeForm.message) {
      alert("Notice title aur message required hai.");
      return;
    }

    try {
      setSaving(true);

      const assignedBranches = facultyData?.branches || [];
      if (assignedBranches.length === 0) {
        throw new Error("Faculty account ke saath koi branch assign nahi hai.");
      }

      // Publish a separate notice for each branch assigned to this faculty.
      await Promise.all(
        assignedBranches.map((branch) =>
          addDoc(collection(db, "notices"), {
            title: noticeForm.title.trim(),
            message: noticeForm.message.trim(),
            branch,
            facultyEmail: user?.email?.trim().toLowerCase() || "",
            facultyName: facultyData?.name || "Faculty",
            status: "Published",
            date: new Date().toLocaleDateString(),
            createdAt: serverTimestamp(),
          })
        )
      );

      alert("Notice successfully published.");

      setNoticeForm({
        title: "",
        message: "",
      });

      setShowNoticeForm(false);

      await loadAllData(facultyData?.branches || []);
    } catch (error) {
      console.error(error);
      alert("Notice save nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="faculty-loading">
        <h2>Loading Faculty Dashboard...</h2>
      </div>
    );
  }

  return (
    <>
      <style>{`
        :root { color-scheme: light; }
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { margin: 0; min-height: 100%; width: 100%; }
        body { font-family: Inter, Arial, sans-serif; color: #172033; background: #f5f7fb; }
        button, input, select, textarea { font: inherit; }
        button { -webkit-tap-highlight-color: transparent; }
        .faculty-page { display:flex; min-height:100vh; width:100%; max-width:100vw; overflow-x:clip; background:#f5f7fb; color:#172033; }
        .faculty-sidebar { position:fixed; inset:0 auto 0 0; z-index:1001; display:flex; flex-direction:column; width:270px; height:100vh; height:100dvh; padding:18px 14px 16px; overflow-y:auto; overflow-x:hidden; background:#fff; border-right:1px solid #e5eaf2; box-shadow:0 2px 12px rgba(15,23,42,.03); }
        .faculty-logo { display:flex; align-items:center; gap:12px; min-width:0; padding:7px 8px 20px; border-bottom:1px solid #e8edf5; }
        .faculty-logo-icon { display:flex; align-items:center; justify-content:center; flex:0 0 44px; width:44px; height:44px; border-radius:13px; background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; font-size:22px; font-weight:800; box-shadow:0 5px 12px rgba(37,99,235,.2); }
        .faculty-logo h2 { margin:0; font-size:17px; font-weight:800; color:#15213a; }
        .faculty-logo span { display:block; margin-top:4px; color:#718096; font-size:12px; }
        .faculty-menu { display:flex; flex-direction:column; gap:6px; margin-top:22px; }
        .faculty-menu button { display:flex; align-items:center; gap:12px; width:100%; min-height:44px; padding:11px 13px; border:0; border-radius:11px; background:transparent; color:#536078; text-align:left; font-size:14px; font-weight:600; cursor:pointer; transition:background .18s,color .18s,transform .18s; }
        .faculty-menu button:hover { background:#f1f6ff; color:#1d4ed8; }
        .faculty-menu button.active { background:#eaf1ff; color:#1d4ed8; box-shadow:inset 3px 0 #2563eb; }
        .faculty-menu button span:first-child { display:inline-flex; align-items:center; justify-content:center; width:24px; flex:0 0 24px; font-size:17px; }
        .faculty-logout { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; margin-top:auto; padding:12px; border:1px solid #fee2e2; border-radius:11px; background:#fff1f2; color:#be123c; font-weight:700; cursor:pointer; }
        .faculty-logout:hover { background:#ffe4e6; }
        .faculty-main { min-width:0; width:calc(100% - 270px); min-height:100vh; margin-left:270px; }
        .faculty-header { position:sticky; top:0; z-index:20; display:flex; align-items:center; justify-content:space-between; gap:18px; width:100%; min-width:0; min-height:82px; padding:16px 28px; border-bottom:1px solid #e8edf5; background:rgba(255,255,255,.97); backdrop-filter:blur(10px); }
        .faculty-header > div:first-of-type { min-width:0; }
        .faculty-header h1 { margin:0; color:#172033; font-size:23px; line-height:1.25; font-weight:800; overflow-wrap:anywhere; }
        .faculty-header p { margin:5px 0 0; color:#718096; font-size:13px; }
        .faculty-header-actions { display:flex; align-items:center; justify-content:flex-end; gap:14px; min-width:0; flex-shrink:0; }
        .faculty-notification-bell { position:relative; display:inline-flex; align-items:center; justify-content:center; flex:0 0 44px; width:44px; height:44px; border:1px solid #e2e8f0; border-radius:12px; background:#fff; color:#334155; font-size:19px; cursor:pointer; }
        .faculty-notification-bell:hover { background:#f8fbff; border-color:#bfdbfe; }
        .faculty-notification-count { position:absolute; top:-6px; right:-6px; display:flex; align-items:center; justify-content:center; min-width:20px; height:20px; padding:0 5px; border:2px solid #fff; border-radius:20px; background:#dc2626; color:#fff; font-size:10px; font-weight:800; line-height:1; }
        .faculty-profile { display:flex; align-items:center; gap:10px; min-width:0; max-width:260px; }
        .faculty-avatar { display:flex; align-items:center; justify-content:center; flex:0 0 42px; width:42px; height:42px; border-radius:50%; background:#dbeafe; color:#1d4ed8; font-weight:800; }
        .faculty-profile strong { display:block; max-width:190px; overflow:hidden; color:#1e293b; font-size:13px; text-overflow:ellipsis; white-space:nowrap; }
        .faculty-profile small { display:block; max-width:210px; margin-top:4px; overflow:hidden; color:#718096; font-size:11px; line-height:1.35; text-overflow:ellipsis; white-space:nowrap; }
        .faculty-mobile-menu, .faculty-mobile-close, .faculty-mobile-overlay { display:none; }
        .faculty-welcome { margin:26px 28px 22px; padding:25px; border:1px solid #dbeafe; border-radius:18px; background:linear-gradient(120deg,#eff6ff 0%,#fff 72%); box-shadow:0 5px 18px rgba(15,23,42,.035); }
        .faculty-welcome h2 { margin:0 0 8px; color:#172554; font-size:23px; }
        .faculty-welcome p { margin:0; color:#64748b; line-height:1.6; }
        .faculty-assigned-info { display:flex; gap:12px; margin-top:18px; flex-wrap:wrap; }
        .faculty-assigned-info > div { min-width:160px; max-width:100%; padding:11px 14px; border:1px solid #dbeafe; border-radius:11px; background:#fff; overflow-wrap:anywhere; }
        .faculty-assigned-info span { display:block; margin-bottom:5px; color:#64748b; font-size:11px; }
        .faculty-assigned-info strong { color:#1e40af; font-size:14px; }
        .faculty-stats, .faculty-quick, .faculty-section { margin:0 28px 22px; }
        .faculty-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
        .faculty-stat { display:flex; align-items:center; gap:13px; min-width:0; padding:18px; border:1px solid #e6ebf3; border-radius:15px; background:#fff; box-shadow:0 4px 14px rgba(15,23,42,.035); }
        .faculty-stat-icon { display:flex; align-items:center; justify-content:center; flex:0 0 46px; width:46px; height:46px; border-radius:13px; background:#eff6ff; font-size:22px; }
        .faculty-stat h3 { margin:0 0 5px; color:#718096; font-size:12px; font-weight:600; }
        .faculty-stat-number { color:#172033; font-size:25px; font-weight:800; line-height:1.15; overflow-wrap:anywhere; }
        .faculty-stat-text { margin-top:4px; color:#94a3b8; font-size:11px; }
        .faculty-quick, .faculty-section { padding:21px; border:1px solid #e6ebf3; border-radius:16px; background:#fff; box-shadow:0 4px 14px rgba(15,23,42,.03); }
        .faculty-quick h2, .faculty-section-header h2 { margin:0; color:#172033; font-size:18px; }
        .faculty-quick-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:16px; }
        .faculty-quick-grid button { min-width:0; min-height:84px; padding:15px; border:1px solid #e4ebf5; border-radius:12px; background:#f8fbff; color:#334155; font-weight:700; cursor:pointer; overflow-wrap:anywhere; }
        .faculty-quick-grid button:hover { border-color:#bfdbfe; background:#eff6ff; color:#1d4ed8; }
        .faculty-section-header { display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:17px; }
        .faculty-section-header p { margin:5px 0 0; color:#718096; font-size:13px; line-height:1.5; }
        .faculty-primary { display:inline-flex; align-items:center; justify-content:center; gap:7px; min-height:40px; padding:10px 15px; border:0; border-radius:10px; background:#2563eb; color:#fff; font-size:13px; font-weight:700; cursor:pointer; }
        .faculty-primary:hover { background:#1d4ed8; }
        .faculty-primary:disabled { opacity:.6; cursor:not-allowed; }
        .faculty-form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; padding:19px; margin:0 0 20px; border:1px solid #e5eaf2; border-radius:14px; background:#f8fbff; }
        .faculty-form h3 { grid-column:1/-1; margin:0; color:#172033; font-size:17px; }
        .faculty-form label { display:flex; flex-direction:column; gap:7px; min-width:0; color:#475569; font-size:12px; font-weight:700; }
        .faculty-input, .faculty-textarea, .faculty-form input, .faculty-form select, .faculty-form textarea, .faculty-filters input, .faculty-filters select, .faculty-payment-toolbar input, .faculty-payment-toolbar select { width:100%; min-width:0; min-height:42px; padding:10px 12px; border:1px solid #dbe3ef; border-radius:9px; outline:none; background:#fff; color:#1e293b; font-size:13px; }
        .faculty-input:focus, .faculty-textarea:focus, .faculty-form input:focus, .faculty-form select:focus, .faculty-form textarea:focus, .faculty-filters input:focus, .faculty-filters select:focus { border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.12); }
        .faculty-textarea, .faculty-form textarea { min-height:100px; resize:vertical; }
        .faculty-form .faculty-primary { align-self:end; }
        .faculty-filters { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
        .faculty-table-wrapper { width:100%; max-width:100%; overflow-x:auto; border:1px solid #e6ebf3; border-radius:12px; -webkit-overflow-scrolling:touch; }
        .faculty-table { width:100%; min-width:680px; border-collapse:collapse; background:#fff; font-size:13px; }
        .faculty-table th { padding:13px 14px; background:#f8fafc; color:#64748b; font-size:11px; text-align:left; text-transform:uppercase; letter-spacing:.04em; white-space:nowrap; }
        .faculty-table td { padding:13px 14px; border-top:1px solid #eef2f7; color:#334155; vertical-align:middle; }
        .faculty-cards { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .faculty-card { display:flex; flex-direction:column; min-width:0; padding:17px; border:1px solid #e5eaf2; border-radius:14px; background:#fff; box-shadow:0 4px 14px rgba(15,23,42,.03); }
        .faculty-card h3 { margin:0 0 7px; color:#172033; font-size:16px; overflow-wrap:anywhere; }
        .faculty-card p { color:#64748b; font-size:13px; line-height:1.55; overflow-wrap:anywhere; }
        .faculty-card-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .faculty-badge, .faculty-status { display:inline-flex; align-items:center; width:max-content; max-width:100%; padding:5px 9px; border-radius:30px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; overflow-wrap:anywhere; }
        .faculty-material-icon { display:flex; align-items:center; justify-content:center; width:44px; height:44px; margin-bottom:13px; border-radius:12px; background:#eff6ff; font-size:22px; }
        .faculty-open, .faculty-view-btn, .faculty-edit-btn, .faculty-delete-btn { display:inline-flex; align-items:center; justify-content:center; gap:5px; min-height:34px; padding:7px 10px; border:1px solid #dbeafe; border-radius:8px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700; text-decoration:none; cursor:pointer; }
        .faculty-edit-btn { border-color:#bfdbfe; background:#eff6ff; color:#1d4ed8; }
        .faculty-delete-btn { border-color:#fecaca; background:#fff1f2; color:#be123c; }
        .faculty-view-btn { border-color:#dbeafe; background:#eff6ff; color:#1d4ed8; }
        .faculty-student-actions { display:flex; gap:6px; flex-wrap:wrap; }
        .faculty-modal-overlay { position:fixed; inset:0; z-index:2000; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(15,23,42,.55); overflow-y:auto; }
        .faculty-modal { width:min(760px,100%); max-height:calc(100dvh - 40px); overflow:auto; border:1px solid #e5eaf2; border-radius:17px; background:#fff; box-shadow:0 20px 60px rgba(15,23,42,.2); }
        .faculty-modal-header { position:sticky; top:0; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:17px 20px; border-bottom:1px solid #e8edf5; background:#fff; }
        .faculty-modal-header h2, .faculty-modal-header h3 { margin:0; color:#172033; font-size:18px; }
        .faculty-modal-header p { margin:5px 0 0; color:#718096; font-size:12px; }
        .faculty-close-btn, .faculty-close { display:flex; align-items:center; justify-content:center; flex:0 0 36px; width:36px; height:36px; border:0; border-radius:9px; background:#f1f5f9; color:#475569; font-size:20px; cursor:pointer; }
        .faculty-detail-grid, .faculty-payment-details { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; padding:18px; }
        .faculty-detail-grid > div, .faculty-detail-box { min-width:0; padding:13px; border:1px solid #e6ebf3; border-radius:11px; background:#f8fafc; overflow-wrap:anywhere; }
        .faculty-detail-grid span, .faculty-detail-box small { display:block; margin-bottom:6px; color:#64748b; font-size:11px; }
        .faculty-detail-grid strong, .faculty-detail-box strong { color:#1e293b; font-size:13px; overflow-wrap:anywhere; }
        .faculty-student-results { display:flex; flex-direction:column; gap:10px; padding:0 18px 18px; }
        .faculty-result-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px; border:1px solid #e6ebf3; border-radius:10px; background:#fff; }
        .faculty-result-row small { display:block; margin-top:4px; color:#718096; }
        .faculty-analytics-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
        .faculty-analytics-card { display:flex; align-items:center; gap:12px; min-width:0; padding:17px; border:1px solid #e5eaf2; border-radius:14px; background:#fff; box-shadow:0 4px 12px rgba(15,23,42,.04); }
        .faculty-analytics-card>span { flex:0 0 auto; font-size:26px; }
        .faculty-analytics-card small { display:block; margin-bottom:5px; color:#64748b; font-size:11px; }
        .faculty-analytics-card strong { color:#172033; font-size:23px; overflow-wrap:anywhere; }
        .faculty-analytics-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%; min-width:0; align-items:stretch; }
        .faculty-analytics-panel { min-width:0; width:100%; max-width:100%; padding:19px; border:1px solid #e5eaf2; border-radius:14px; background:#fff; overflow:hidden; }
        .faculty-analytics-panel h3 { margin:0 0 18px; color:#172033; font-size:16px; }
        .faculty-bar-row { margin-bottom:18px; min-width:0; }
        .faculty-bar-label { display:flex; justify-content:space-between; gap:10px; margin-bottom:7px; font-size:13px; }
        .faculty-bar-label span { min-width:0; overflow-wrap:anywhere; }
        .faculty-bar-label b, .faculty-stream-box strong { color:#2563eb; }
        .faculty-bar-track, .faculty-stream-track { width:100%; height:10px; overflow:hidden; border-radius:99px; background:#e5e7eb; }
        .faculty-bar-fill, .faculty-stream-fill { height:100%; max-width:100%; border-radius:99px; background:#2563eb; }
        .faculty-bar-row small { display:block; margin-top:5px; color:#94a3b8; }
        .faculty-stream-box { margin-bottom:20px; min-width:0; }
        .faculty-stream-box>div:first-child { display:flex; justify-content:space-between; gap:10px; margin-bottom:7px; }
        .faculty-stream-fill { background:#dc2626; }
        .faculty-analytics-note { color:#64748b; font-size:12px; line-height:1.5; }
        .faculty-top-panel { margin-bottom:18px; }
        .faculty-top-row { display:flex; align-items:center; gap:12px; min-width:0; padding:12px 0; border-bottom:1px solid #eef2f7; }
        .faculty-rank { display:flex; align-items:center; justify-content:center; flex:0 0 40px; width:40px; height:40px; border-radius:50%; background:#eff6ff; color:#2563eb; font-weight:800; }
        .faculty-top-info { display:flex; flex:1; flex-direction:column; gap:4px; min-width:0; overflow-wrap:anywhere; }
        .faculty-top-info span { color:#64748b; font-size:12px; }
        .faculty-top-score { color:#16a34a; font-size:17px; font-weight:800; white-space:nowrap; }
        .faculty-payment-summary { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
        .faculty-payment-box { min-width:0; padding:17px; border:1px solid #e5eaf2; border-radius:13px; background:#fff; }
        .faculty-payment-box strong { display:block; margin-bottom:6px; color:#172033; font-size:22px; overflow-wrap:anywhere; }
        .faculty-payment-box span { color:#64748b; font-size:12px; }
        .faculty-payment-toolbar { display:grid; grid-template-columns:minmax(0,1fr) 200px; gap:12px; margin-bottom:15px; }
        .faculty-status.pending { background:#fff7ed; color:#c2410c; }
        .faculty-status.approved, .faculty-status.paid { background:#dcfce7; color:#15803d; }
        .faculty-status.rejected, .faculty-status.failed { background:#fee2e2; color:#b91c1c; }
        .faculty-notices { display:flex; flex-direction:column; gap:12px; }
        .faculty-notice { display:flex; align-items:flex-start; gap:13px; min-width:0; padding:16px; border:1px solid #e5eaf2; border-radius:13px; background:#fff; }
        .faculty-notice-icon { display:flex; align-items:center; justify-content:center; flex:0 0 42px; width:42px; height:42px; border-radius:11px; background:#eff6ff; font-size:20px; }
        .faculty-notice-content { flex:1; min-width:0; }
        .faculty-notice-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .faculty-notice-header h3 { margin:0; color:#172033; font-size:15px; overflow-wrap:anywhere; }
        .faculty-notice-content p { margin:7px 0; color:#475569; font-size:13px; line-height:1.6; overflow-wrap:anywhere; }
        .faculty-notice-content small { color:#94a3b8; font-size:11px; }
        .faculty-notification-list { display:flex; flex-direction:column; gap:12px; }
        .faculty-notification-card { display:flex; align-items:flex-start; gap:13px; min-width:0; padding:15px; border:1px solid #e5eaf2; border-radius:14px; background:#fff; cursor:pointer; transition:box-shadow .18s; }
        .faculty-notification-card.unread { border-color:#bfdbfe; background:#eff6ff; }
        .faculty-notification-card:hover { box-shadow:0 5px 18px rgba(15,23,42,.07); }
        .faculty-notification-icon { display:flex; align-items:center; justify-content:center; flex:0 0 42px; width:42px; height:42px; border-radius:11px; background:#fff; font-size:20px; }
        .faculty-notification-content { flex:1; min-width:0; }
        .faculty-notification-top { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
        .faculty-notification-top h3 { margin:0; font-size:15px; overflow-wrap:anywhere; }
        .faculty-notification-content p { margin:7px 0; color:#475569; line-height:1.5; overflow-wrap:anywhere; }
        .faculty-notification-content small { color:#94a3b8; }
        .faculty-unread-dot { flex:0 0 auto; padding:3px 7px; border-radius:20px; background:#dc2626; color:#fff; font-size:10px; font-weight:700; }
        .faculty-notification-delete { flex:0 0 34px; width:34px; height:34px; border:0; border-radius:8px; background:#fee2e2; color:#b91c1c; cursor:pointer; }
        .faculty-empty { padding:30px 18px; border:1px dashed #cbd5e1; border-radius:12px; color:#64748b; text-align:center; background:#fff; }
        .faculty-loading { display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px; background:#f5f7fb; color:#1e3a8a; font-family:Inter,Arial,sans-serif; text-align:center; }
        @media (max-width:1200px) {
          .faculty-stats, .faculty-analytics-stats { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .faculty-cards { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .faculty-quick-grid { grid-template-columns:repeat(3,minmax(0,1fr)); }
        }
        @media (max-width:900px) {
          .faculty-sidebar { width:min(380px,88vw); max-width:88vw; transform:translateX(-105%); transition:transform .25s ease; box-shadow:8px 0 30px rgba(15,23,42,.12); }
          .faculty-sidebar.mobile-open { transform:translateX(0); }
          .faculty-mobile-close { display:flex; align-items:center; justify-content:center; align-self:flex-end; width:36px; height:36px; margin:0 0 4px; border:0; border-radius:9px; background:#fee2e2; color:#b91c1c; font-size:21px; cursor:pointer; }
          .faculty-mobile-overlay { display:block; position:fixed; inset:0; z-index:1000; background:rgba(15,23,42,.45); }
          .faculty-main { width:100%; margin-left:0; }
          .faculty-mobile-menu { display:inline-flex; align-items:center; justify-content:center; flex:0 0 42px; width:42px; height:42px; border:1px solid #e2e8f0; border-radius:11px; background:#fff; color:#1e3a8a; font-size:23px; cursor:pointer; }
          .faculty-header { min-height:72px; padding:13px 18px; gap:12px; }
          .faculty-header h1 { font-size:20px; }
          .faculty-header-actions { gap:10px; }
          .faculty-welcome, .faculty-stats, .faculty-quick, .faculty-section { margin-left:18px; margin-right:18px; }
          .faculty-analytics-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
        }
        @media (min-width:901px) {
          .faculty-mobile-menu, .faculty-mobile-close, .faculty-mobile-overlay { display:none !important; }
          .faculty-sidebar { transform:none !important; }
        }
        @media (max-width:640px) {
          .faculty-header { align-items:center; padding:11px 12px; gap:9px; }
          .faculty-header h1 { font-size:17px; }
          .faculty-header p { max-width:180px; font-size:11px; line-height:1.35; }
          .faculty-header-actions { gap:7px; }
          .faculty-notification-bell { flex-basis:38px; width:38px; height:38px; border-radius:10px; }
          .faculty-profile { max-width:42px; }
          .faculty-profile > div:last-child { display:none; }
          .faculty-avatar { flex-basis:36px; width:36px; height:36px; }
          .faculty-welcome { margin:16px 12px; padding:18px; border-radius:14px; }
          .faculty-welcome h2 { font-size:19px; }
          .faculty-welcome p { font-size:13px; }
          .faculty-assigned-info { gap:8px; }
          .faculty-assigned-info > div { flex:1 1 130px; min-width:0; padding:10px; }
          .faculty-stats, .faculty-quick, .faculty-section { margin:0 12px 15px; }
          .faculty-stats, .faculty-analytics-stats { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
          .faculty-stat { align-items:flex-start; gap:9px; padding:12px 10px; border-radius:12px; }
          .faculty-stat-icon { flex-basis:36px; width:36px; height:36px; border-radius:10px; font-size:18px; }
          .faculty-stat-number { font-size:20px; }
          .faculty-stat h3 { font-size:11px; line-height:1.35; }
          .faculty-stat-text { font-size:10px; }
          .faculty-quick, .faculty-section { padding:14px; border-radius:13px; }
          .faculty-quick h2, .faculty-section-header h2 { font-size:16px; }
          .faculty-quick-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
          .faculty-quick-grid button { min-height:74px; padding:11px 8px; font-size:12px; }
          .faculty-section-header { align-items:flex-start; flex-wrap:wrap; }
          .faculty-primary { max-width:100%; white-space:normal; }
          .faculty-form { grid-template-columns:minmax(0,1fr); padding:13px; gap:12px; }
          .faculty-form h3 { grid-column:auto; }
          .faculty-filters, .faculty-payment-toolbar, .faculty-payment-details { grid-template-columns:minmax(0,1fr); }
          .faculty-cards { grid-template-columns:minmax(0,1fr); }
          .faculty-analytics-grid { grid-template-columns:minmax(0,1fr) !important; gap:12px; width:100%; }
          .faculty-analytics-stats { gap:9px; }
          .faculty-analytics-card { gap:8px; padding:12px 10px; border-radius:12px; }
          .faculty-analytics-card>span { font-size:21px; }
          .faculty-analytics-card small { font-size:10px; line-height:1.35; }
          .faculty-analytics-card strong { font-size:19px; }
          .faculty-analytics-panel { padding:14px; }
          .faculty-analytics-panel h3 { font-size:15px; }
          .faculty-payment-summary { grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; }
          .faculty-payment-box { padding:12px; }
          .faculty-payment-box strong { font-size:18px; }
          .faculty-detail-grid { grid-template-columns:minmax(0,1fr); padding:13px; }
          .faculty-modal-overlay { align-items:flex-start; padding:10px; }
          .faculty-modal { max-height:calc(100dvh - 20px); border-radius:13px; }
          .faculty-modal-header { padding:13px; }
          .faculty-result-row { align-items:flex-start; }
          .faculty-notification-card { gap:8px; padding:11px; }
          .faculty-notification-icon { flex-basis:34px; width:34px; height:34px; }
          .faculty-notification-delete { flex-basis:30px; width:30px; height:30px; }
          .faculty-notification-top { flex-wrap:wrap; }
          .faculty-notice { padding:12px; gap:9px; }
          .faculty-notice-icon { flex-basis:34px; width:34px; height:34px; }
        }
        @media (max-width:360px) {
          .faculty-header { gap:6px; padding-inline:8px; }
          .faculty-mobile-menu { flex-basis:36px; width:36px; height:36px; }
          .faculty-header h1 { font-size:15px; }
          .faculty-header p { max-width:120px; }
          .faculty-stats, .faculty-analytics-stats, .faculty-payment-summary { grid-template-columns:minmax(0,1fr); }
          .faculty-quick-grid { grid-template-columns:minmax(0,1fr); }
        }

      `}</style>

      <div className="faculty-page">
        <aside
  className={`faculty-sidebar ${showMobileMenu ? "mobile-open" : ""}`}
>
          <div className="faculty-logo">
          <button
  type="button"
  className="faculty-mobile-close"
  onClick={() => setShowMobileMenu(false)}
  aria-label="Close menu"
>
  ✕
</button>
            <div className="faculty-logo-icon">J</div>

            <div>
              <h2>J. Solution</h2>
              <span>Faculty Portal</span>
            </div>
          </div>

          <div className="faculty-menu">
            {[
              "Dashboard",
              "Students",
              "Results",
              "Analytics",
              "Study Materials",
              "Payments",
              "Notices",
              "Notifications",
            ].map((item) => (
              <button
                key={item}
                className={activePage === item ? "active" : ""}
                onClick={() => {
                  setActivePage(item);
                  setShowMobileMenu(false);
                }}
              >
                <span>
                  {item === "Dashboard" && "🏠"}
                  {item === "Students" && "👨‍🎓"}
                  {item === "Results" && "📊"}
                  {item === "Analytics" && "📈"}
                  {item === "Study Materials" && "📖"}
                  {item === "Payments" && "💰"}
                  {item === "Notices" && "📢"}
                  {item === "Notifications" && "🔔"}
                </span>

                <span>{item}</span>
              </button>
            ))}
          </div>

          <button className="faculty-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </aside>

        {showMobileMenu && (
  <div
    className="faculty-mobile-overlay"
    onClick={() => setShowMobileMenu(false)}
    aria-hidden="true"
  />
)}

        <main className="faculty-main">
          <header className="faculty-header">
          <button
  type="button"
  className="faculty-mobile-menu"
  onClick={() => setShowMobileMenu(true)}
  aria-label="Open menu"
>
  ☰
</button>
            <div>
              <h1>{activePage}</h1>
              <p>Faculty Management Panel</p>
            </div>

            <div className="faculty-header-actions">
              <button
                type="button"
                className="faculty-notification-bell"
                onClick={() => {
  setActivePage("Notifications");
  setShowMobileMenu(false);
}}
                title="Notifications"
              >
                🔔
                {notifications.filter((item) => !item.read).length > 0 && (
                  <span className="faculty-notification-count">
                    {notifications.filter((item) => !item.read).length > 99
                      ? "99+"
                      : notifications.filter((item) => !item.read).length}
                  </span>
                )}
              </button>

              <div className="faculty-profile">
                <div className="faculty-avatar">
                  {(facultyData?.name || user?.displayName || "F").charAt(0).toUpperCase()}
                </div>

               <div>
  <strong>{facultyData?.name || user?.displayName || "Faculty"}</strong>
  <small>
    {facultyData?.branches?.join(", ") || "Branch not assigned"} •{" "}
    {facultyData?.subject || "Faculty"}
  </small>
</div>
              </div>
            </div>
          </header>

          {activePage === "Dashboard" && (
            <>
              <div className="faculty-welcome">
                <h2>Welcome, Faculty 👋</h2>
                <p>
                  Yahan se aap students, results, study materials aur
                  notices manage kar sakte hain.
                </p>
<div className="faculty-assigned-info">
  <div>
    <span>Assigned Branches</span>
    <strong>{facultyData?.branches?.join(", ") || "-"}</strong>
  </div>

  <div>
    <span>Subject</span>
    <strong>{facultyData?.subject || "-"}</strong>
  </div>
</div>
              </div>

              <div className="faculty-stats">
                <div className="faculty-stat">
                  <div className="faculty-stat-icon">👨‍🎓</div>
                  <h3>Students</h3>
                  <div className="faculty-stat-number">
                    {students.length}
                  </div>
                  <div className="faculty-stat-text">
                    Approved Students
                  </div>
                </div>

                <div className="faculty-stat">
                  <div className="faculty-stat-icon">📊</div>
                  <h3>Results</h3>
                  <div className="faculty-stat-number">
                    {results.length}
                  </div>
                  <div className="faculty-stat-text">
                    Published Results
                  </div>
                </div>

                <div className="faculty-stat">
                  <div className="faculty-stat-icon">📖</div>
                  <h3>Study Materials</h3>
                  <div className="faculty-stat-number">
                    {materials.length}
                  </div>
                  <div className="faculty-stat-text">
                    Available Materials
                  </div>
                </div>

                <div className="faculty-stat">
                  <div className="faculty-stat-icon">💰</div>
                  <h3>Payments</h3>
                  <div className="faculty-stat-number">
                    {payments.filter((item) => item.status === "Pending Verification").length}
                  </div>
                  <div className="faculty-stat-text">
                    Pending Verification
                  </div>
                </div>

                <div className="faculty-stat">
                  <div className="faculty-stat-icon">📢</div>
                  <h3>Notices</h3>
                  <div className="faculty-stat-number">
                    {notices.length}
                  </div>
                  <div className="faculty-stat-text">
                    Published Notices
                  </div>
                </div>
              </div>

              <div className="faculty-quick">
                <h2>Quick Actions</h2>

                <div className="faculty-quick-grid">
                  <button
                    onClick={() => {
                      setActivePage("Results");
                      setShowResultForm(true);
                    }}
                  >
                    📊 Add Result
                  </button>

                  <button
                    onClick={() => {
                      setActivePage("Study Materials");
                      setShowMaterialForm(true);
                    }}
                  >
                    📖 Add Study Material
                  </button>

                  <button
                    onClick={() => {
                      setActivePage("Notices");
                      setShowNoticeForm(true);
                    }}
                  >
                    📢 Publish Notice
                  </button>

                  <button
                    onClick={() => setActivePage("Payments")}
                  >
                    💰 View Payments
                  </button>

                  <button
                    onClick={() => setActivePage("Analytics")}
                  >
                    📈 Result Analytics
                  </button>

                  <button
                    onClick={() => setActivePage("Students")}
                  >
                    👨‍🎓 View Students
                  </button>
                </div>
              </div>
            </>
          )}

          {activePage === "Students" && (
            <section className="faculty-section">
              <div className="faculty-section-header">
                <div>
                  <h2>Student Management</h2>
                  <p>Search, filter and view approved student details.</p>
                </div>
              </div>

              <div className="faculty-filters">
                <input
                  className="faculty-input"
                  type="text"
                  placeholder="Search by name, email or Student ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />

                <select
  className="faculty-input"
  value={studentStreamFilter}
  onChange={(e) => setStudentStreamFilter(e.target.value)}
>
  <option value="All">All Streams</option>
  <option value="Science">Science</option>
  <option value="Arts">Arts</option>
</select>

<select
  className="faculty-input"
  value={studentBranchFilter}
  onChange={(e) => setStudentBranchFilter(e.target.value)}
>
  <option value="All">All Branches</option>

  {facultyData?.branches?.includes("Itimha") && (
    <option value="Itimha">Itimha</option>
  )}

  {facultyData?.branches?.includes("Bardiha") && (
    <option value="Bardiha">Bardiha</option>
  )}
</select>
              </div>

              {(() => {
                const filteredStudents = students.filter((student) => {
                  const search = studentSearch.toLowerCase().trim();

                  const matchesSearch =
                    !search ||
                    student.name?.toLowerCase().includes(search) ||
                    student.email?.toLowerCase().includes(search) ||
                    student.studentId?.toLowerCase().includes(search);

                  const matchesClass =
                    studentClassFilter === "All" ||
                    student.className === studentClassFilter;

                  const matchesStream =
                    studentStreamFilter === "All" ||
                    student.stream === studentStreamFilter;

                  const matchesBranch =
                    studentBranchFilter === "All" ||
                    student.branch === studentBranchFilter;

                  return (
                    matchesSearch &&
                    matchesClass &&
                    matchesStream &&
                    matchesBranch
                  );
                });

                return filteredStudents.length === 0 ? (
                  <div className="faculty-empty">No students found.</div>
                ) : (
                  <div className="faculty-table-wrapper">
                    <table className="faculty-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Class</th>
                          <th>Stream</th>
                          <th>Branch</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id}>
                            <td>{student.studentId || "-"}</td>
                            <td>{student.name || "-"}</td>
                            <td>{student.email || "-"}</td>
                            <td>{student.className || "-"}</td>
                            <td>{student.stream || "-"}</td>
                            <td>{student.branch || "-"}</td>
                            <td>
                              <div className="faculty-student-actions">
                                <button
                                  type="button"
                                  className="faculty-view-btn"
                                  onClick={() => setSelectedStudent(student)}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  className="faculty-edit-btn"
                                  onClick={() => openEditStudent(student)}
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {selectedStudent && (
                <div className="faculty-modal-overlay">
                  <div className="faculty-modal">
                    <div className="faculty-modal-header">
                      <div>
                        <h2>{selectedStudent.name || "Student"}</h2>
                        <p>{selectedStudent.studentId || "-"}</p>
                      </div>
                      <button
                        className="faculty-close-btn"
                        onClick={() => setSelectedStudent(null)}
                      >
                        X
                      </button>
                    </div>

                    <div className="faculty-detail-grid">
                      <div><span>Name</span><strong>{selectedStudent.name || "-"}</strong></div>
                      <div><span>Father Name</span><strong>{selectedStudent.fatherName || "-"}</strong></div>
                      <div><span>Email</span><strong>{selectedStudent.email || "-"}</strong></div>
                      <div><span>Mobile</span><strong>{selectedStudent.mobile || "-"}</strong></div>
                      <div><span>Class</span><strong>{selectedStudent.className || "-"}</strong></div>
                      <div><span>Stream</span><strong>{selectedStudent.stream || "-"}</strong></div>
                      <div><span>Branch</span><strong>{selectedStudent.branch || "-"}</strong></div>
                      <div><span>Status</span><strong>Approved</strong></div>
                    </div>

                    {(() => {
                      const studentResults = getStudentResults(selectedStudent);
                      const studentPayments = getStudentPayments(selectedStudent);
                      const percentages = studentResults.map((r) => Number(r.percentage)).filter((n) => !Number.isNaN(n));
                      const average = percentages.length ? (percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(1) : "0.0";
                      const highest = percentages.length ? Math.max(...percentages) : 0;
                      const approvedPayments = studentPayments.filter((p) => p.status === "Approved");
                      const pendingPayments = studentPayments.filter((p) => p.status === "Pending Verification");
                      const approvedAmount = approvedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                      return (
                        <>
                          <div className="faculty-performance-title"><h3>Student Performance</h3><p>Academic and payment summary</p></div>
                          <div className="faculty-performance-grid">
                            <div className="faculty-performance-card"><span>Average Result</span><strong>{average}%</strong><small>{studentResults.length} exam{studentResults.length !== 1 ? "s" : ""}</small></div>
                            <div className="faculty-performance-card"><span>Highest Result</span><strong>{highest}%</strong><small>Best percentage</small></div>
                            <div className="faculty-performance-card"><span>Fees Approved</span><strong>₹{approvedAmount}</strong><small>{approvedPayments.length} payment{approvedPayments.length !== 1 ? "s" : ""}</small></div>
                            <div className="faculty-performance-card"><span>Pending Fees</span><strong>{pendingPayments.length}</strong><small>Verification pending</small></div>
                          </div>
                          <div className="faculty-student-results"><h3>Result History</h3>
                            {studentResults.length === 0 ? <div className="faculty-empty">No results available for this student.</div> : studentResults.map((result) => (
                              <div className="faculty-result-row" key={result.id}><div><strong>{result.exam || "-"}</strong><small>{result.className || "-"}{result.stream ? ` • ${result.stream}` : ""}{result.date ? ` • ${result.date}` : ""}</small></div><strong>{result.percentage}%</strong></div>
                            ))}
                          </div>
                          <div className="faculty-student-results"><h3>Payment History</h3>
                            {studentPayments.length === 0 ? <div className="faculty-empty">No payment records available for this student.</div> : studentPayments.map((payment) => (
                              <div className="faculty-result-row" key={payment.id}><div><strong>₹{Number(payment.amount || 0)}</strong><small>UTR: {payment.utr || "-"}{payment.date ? ` • ${payment.date}` : ""}</small></div><span className={`faculty-payment-status ${payment.status === "Approved" ? "approved" : payment.status === "Rejected" ? "rejected" : "pending"}`}>{payment.status || "Pending Verification"}</span></div>
                            ))}
                          </div>
                        </>
                      );
                    })()}

                  </div>
                </div>
              )}
            </section>
          )}

          {activePage === "Results" && (
            <section className="faculty-section">
              <div className="faculty-section-header">
                <div>
                  <h2>Results Management</h2>
                  <p>Add and publish student results.</p>
                </div>

                <button
                  className="faculty-primary"
                  onClick={() =>
                    setShowResultForm(!showResultForm)
                  }
                >
                  {showResultForm ? "✕ Close" : "+ Add Result"}
                </button>
              </div>

              {showResultForm && (
                <form
                  onSubmit={handleAddResult}
                  className="faculty-form"
                >
                  <h3>Add Student Result</h3>

                  <label>Student</label>

                  <select
                    value={resultForm.studentEmail}
                    onChange={(e) =>
                      setResultForm({
                        ...resultForm,
                        studentEmail: e.target.value,
                      })
                    }
                    className="faculty-input"
                  >
                    <option value="">
                      Select Student
                    </option>

                    {students.map((student) => (
                      <option
                        key={student.id}
                        value={student.email}
                      >
                        {student.name} -{" "}
                        {student.studentId || student.email}
                      </option>
                    ))}
                  </select>

                  <label>Exam</label>

                  <input
                    type="text"
                    placeholder="e.g. Unit Test 1"
                    value={resultForm.exam}
                    onChange={(e) =>
                      setResultForm({
                        ...resultForm,
                        exam: e.target.value,
                      })
                    }
                    className="faculty-input"
                  />

                  <label>Percentage</label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 85"
                    value={resultForm.percentage}
                    onChange={(e) =>
                      setResultForm({
                        ...resultForm,
                        percentage: e.target.value,
                      })
                    }
                    className="faculty-input"
                  />

                  <button
                    type="submit"
                    className="faculty-primary"
                  >
                    {saving ? "Saving..." : "Publish Result"}
                  </button>
                </form>
              )}

              <div className="faculty-cards">
                {results.length === 0 ? (
                  <div className="faculty-empty">
                    No results available.
                  </div>
                ) : (
                  results.map((result) => (
                    <div
                      className="faculty-card"
                      key={result.id}
                    >
                      <div className="faculty-card-top">
                        <span className="faculty-badge">
                          Published
                        </span>

                        <strong>
                          {result.percentage}%
                        </strong>
                      </div>

                      <h3>{result.studentName}</h3>

                      <p>
                        <b>Student ID:</b>{" "}
                        {result.studentId || "-"}
                      </p>

                      <p>
                        <b>Exam:</b> {result.exam || "-"}
                      </p>

                      <p>
                        <b>Class:</b>{" "}
                        {result.className || "-"}
                      </p>

                      <p>
                        <b>Branch:</b>{" "}
                        {result.branch || "-"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activePage === "Analytics" && (() => {
            const validResults = results.filter((r) => Number.isFinite(Number(r.percentage)));
            const average = validResults.length ? validResults.reduce((a,r) => a + Number(r.percentage), 0) / validResults.length : 0;
            const highest = validResults.length ? Math.max(...validResults.map(r => Number(r.percentage))) : 0;
            const classes = ["9th", "10th", "11th", "12th"].map((className) => {
              const items = validResults.filter(r => r.className === className);
              return { className, count: items.length, avg: items.length ? items.reduce((a,r)=>a+Number(r.percentage),0)/items.length : 0 };
            });
            const streamAvg = (stream) => {
              const items = validResults.filter(r => r.stream === stream);
              return items.length ? items.reduce((a,r)=>a+Number(r.percentage),0)/items.length : 0;
            };
            const topStudents = students.map(student => {
              const items = validResults.filter(r => r.studentEmail?.toLowerCase() === student.email?.toLowerCase() || r.studentId === student.studentId);
              const avg = items.length ? items.reduce((a,r)=>a+Number(r.percentage),0)/items.length : 0;
              return {...student, avg, resultCount: items.length};
            }).filter(s => s.resultCount > 0).sort((a,b)=>b.avg-a.avg).slice(0,5);
            return (
              <section className="faculty-section">
                <div className="faculty-section-header">
                  <div><h2>📈 Result Analytics</h2><p>Overall academic performance</p></div>
                </div>
                <div className="faculty-analytics-stats">
                  <div className="faculty-analytics-card"><span>📝</span><div><small>Total Results</small><strong>{validResults.length}</strong></div></div>
                  <div className="faculty-analytics-card"><span>📊</span><div><small>Average Result</small><strong>{average.toFixed(1)}%</strong></div></div>
                  <div className="faculty-analytics-card"><span>🏆</span><div><small>Highest Result</small><strong>{highest.toFixed(1)}%</strong></div></div>
                  <div className="faculty-analytics-card"><span>👨‍🎓</span><div><small>Students With Results</small><strong>{topStudents.length}</strong></div></div>
                </div>
                <div className="faculty-analytics-grid">
                  <div className="faculty-analytics-panel">
                    <h3>Class-wise Average</h3>
                    {classes.map(item => <div className="faculty-bar-row" key={item.className}>
                      <div className="faculty-bar-label"><span>Class {item.className}</span><b>{item.avg.toFixed(1)}%</b></div>
                      <div className="faculty-bar-track"><div className="faculty-bar-fill" style={{width:`${Math.min(item.avg,100)}%`}} /></div>
                      <small>{item.count} result{item.count !== 1 ? "s" : ""}</small>
                    </div>)}
                  </div>
                  <div className="faculty-analytics-panel">
                    <h3>Stream Performance</h3>
                    {["Science","Arts"].map(stream => <div className="faculty-stream-box" key={stream}>
                      <div><span>{stream === "Science" ? "🔬" : "🎨"} {stream}</span><strong>{streamAvg(stream).toFixed(1)}%</strong></div>
                      <div className="faculty-stream-track"><div className="faculty-stream-fill" style={{width:`${Math.min(streamAvg(stream),100)}%`}} /></div>
                    </div>)}
                    <p className="faculty-analytics-note">Only valid result percentages are included.</p>
                  </div>
                </div>
                <div className="faculty-analytics-panel faculty-top-panel">
                  <h3>🏆 Top Students</h3>
                  {topStudents.length === 0 ? <div className="faculty-empty">No result data available yet.</div> : topStudents.map((student,index) => (
                    <div className="faculty-top-row" key={student.studentId || student.email}>
                      <div className="faculty-rank">#{index+1}</div>
                      <div className="faculty-top-info"><strong>{student.name}</strong><span>{student.studentId || "No ID"} • Class {student.className}</span></div>
                      <strong className="faculty-top-score">{student.avg.toFixed(1)}%</strong>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {activePage === "Study Materials" && (
            <section className="faculty-section">
              <div className="faculty-section-header">
                <div>
                  <h2>Study Materials</h2>
                  <p>
                    Publish PDF and study materials for students.
                  </p>
                </div>

                <button
                  className="faculty-primary"
                  onClick={() =>
                    setShowMaterialForm(
                      !showMaterialForm
                    )
                  }
                >
                  {showMaterialForm
                    ? "✕ Close"
                    : "+ Add Material"}
                </button>
              </div>

              {showMaterialForm && (
                <form
                  onSubmit={handleAddMaterial}
                  className="faculty-form"
                >
                  <h3>Add Study Material</h3>

                  <label>Title</label>

                  <input
                    type="text"
                    placeholder="e.g. Mathematics Chapter 1"
                    value={materialForm.title}
                    onChange={(e) =>
                      setMaterialForm({
                        ...materialForm,
                        title: e.target.value,
                      })
                    }
                    className="faculty-input"
                  />

                  <label>Subject</label>

                  <input
                    type="text"
                    placeholder="e.g. Mathematics"
                    value={materialForm.subject}
                    onChange={(e) =>
                      setMaterialForm({
                        ...materialForm,
                        subject: e.target.value,
                      })
                    }
                    className="faculty-input"
                  />

                  <label>Class</label>

                  <select
                    value={materialForm.className}
                    onChange={(e) =>
                      setMaterialForm({
                        ...materialForm,
                        className: e.target.value,
                        stream: "",
                      })
                    }
                    className="faculty-input"
                  >
                    <option value="9th">9th</option>
                    <option value="10th">10th</option>
                    <option value="11th">11th</option>
                    <option value="12th">12th</option>
                  </select>

                  {(materialForm.className === "11th" ||
                    materialForm.className === "12th") && (
                    <>
                      <label>Stream</label>

                      <select
                        value={materialForm.stream}
                        onChange={(e) =>
                          setMaterialForm({
                            ...materialForm,
                            stream: e.target.value,
                          })
                        }
                        className="faculty-input"
                      >
                        <option value="">
                          Select Stream
                        </option>
                        <option value="Science">
                          Science
                        </option>
                        <option value="Arts">
                          Arts
                        </option>
                      </select>
                    </>
                  )}

                  <label>Branch</label>

                  <select
                    value={materialForm.branch || ""}
                    onChange={(e) =>
                      setMaterialForm({
                        ...materialForm,
                        branch: e.target.value,
                      })
                    }
                    className="faculty-input"
                    required
                  >
                    <option value="">Select Branch</option>

                    {facultyData?.branches?.includes("Itimha") && (
                      <option value="Itimha">Itimha</option>
                    )}

                    {facultyData?.branches?.includes("Bardiha") && (
                      <option value="Bardiha">Bardiha</option>
                    )}
                  </select>

                  {(materialForm.className === "11th" ||
  materialForm.className === "12th") && (
  <>
    <label>Stream</label>

    <select
      value={materialForm.stream}
      onChange={(e) =>
        setMaterialForm({
          ...materialForm,
          stream: e.target.value,
        })
      }
      className="faculty-input"
    >
      <option value="">
        Select Stream
      </option>
      <option value="Science">
        Science
      </option>
      <option value="Arts">
        Arts
      </option>
    </select>
  </>
)}

                  <label>Description</label>

                  <textarea
                    placeholder="Material ke baare me short description"
                    value={materialForm.description}
                    onChange={(e) =>
                      setMaterialForm({
                        ...materialForm,
                        description: e.target.value,
                      })
                    }
                    className="faculty-textarea"
                  />

                  <label>
                    Google Drive / PDF URL
                  </label>

                  <input
                    type="url"
                    placeholder="https://drive.google.com/..."
                    value={materialForm.materialUrl}
                    onChange={(e) =>
                      setMaterialForm({
                        ...materialForm,
                        materialUrl: e.target.value,
                      })
                    }
                    className="faculty-input"
                  />

                  <button
                    type="submit"
                    className="faculty-primary"
                  >
                    {saving
                      ? "Saving..."
                      : "Publish Material"}
                  </button>
                </form>
              )}

              <div className="faculty-cards">
                {materials.length === 0 ? (
                  <div className="faculty-empty">
                    No study materials available.
                  </div>
                ) : (
                  materials.map((material) => (
                    <div
                      className="faculty-card"
                      key={material.id}
                    >
                      <div className="faculty-material-icon">
                        📖
                      </div>

                      <h3>{material.title}</h3>

                      <p>
                        <b>Subject:</b>{" "}
                        {material.subject}
                      </p>

                      <p>
                        <b>Class:</b>{" "}
                        {material.className}

                        {material.stream
                          ? ` - ${material.stream}`
                          : ""}
                      </p>

                      <p>
                        {material.description ||
                          "No description."}
                      </p>

                      {material.materialUrl && (
                        <a
                          href={material.materialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="faculty-open"
                        >
                          📄 Open Material
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {activePage === "Payments" && (
            <section className="faculty-section">
              <div className="faculty-section-header">
                <div>
                  <h2>Fees & Payments</h2>
                  <p>View student payment records and verification status.</p>
                </div>
              </div>

              <div className="faculty-payment-summary">
                <div className="faculty-payment-box">
                  <span>Total Payments</span>
                  <strong>{payments.length}</strong>
                </div>
                <div className="faculty-payment-box">
                  <span>Pending</span>
                  <strong>{payments.filter((item) => item.status === "Pending Verification").length}</strong>
                </div>
                <div className="faculty-payment-box">
                  <span>Approved</span>
                  <strong>{payments.filter((item) => item.status === "Approved").length}</strong>
                </div>
                <div className="faculty-payment-box">
                  <span>Approved Amount</span>
                  <strong>₹{payments.filter((item) => item.status === "Approved").reduce((sum, item) => sum + Number(item.amount || 0), 0)}</strong>
                </div>
              </div>

              <div className="faculty-payment-toolbar">
                <input
                  className="faculty-input"
                  type="text"
                  placeholder="Search student, email, Student ID or UTR..."
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                />
                <select
                  className="faculty-input"
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Pending Verification">Pending Verification</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {(() => {
                const search = paymentSearch.trim().toLowerCase();
                const filteredPayments = payments.filter((payment) => {
                  const matchesStatus =
                    paymentStatusFilter === "All" ||
                    payment.status === paymentStatusFilter;

                  const searchable = [
                    payment.studentName,
                    payment.studentEmail,
                    payment.studentId,
                    payment.utr,
                    payment.paymentId,
                    payment.branch,
                  ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                  return matchesStatus && (!search || searchable.includes(search));
                });

                return filteredPayments.length === 0 ? (
                  <div className="faculty-empty">
                    No payment records found.
                  </div>
                ) : (
                  <div className="faculty-table-wrapper">
                    <table className="faculty-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Student ID</th>
                          <th>Amount</th>
                          <th>UTR</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPayments.map((payment) => {
                          const statusClass =
                            payment.status === "Approved"
                              ? "approved"
                              : payment.status === "Rejected"
                              ? "rejected"
                              : "pending";

                          return (
                            <tr key={payment.id}>
                              <td>
                                <strong>{payment.studentName || "-"}</strong>
                                <br />
                                <small>{payment.studentEmail || "-"}</small>
                              </td>
                              <td>{payment.studentId || "-"}</td>
                              <td>₹{Number(payment.amount || 0)}</td>
                              <td>{payment.utr || "-"}</td>
                              <td>
                                <span className={`faculty-status ${statusClass}`}>
                                  {payment.status || "Pending Verification"}
                                </span>
                              </td>
                              <td>{payment.date || "-"}</td>
                              <td>
                                <button
                                  className="faculty-view-btn"
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </section>
          )}


          {editingStudent && (
            <div className="faculty-modal-overlay" onClick={() => setEditingStudent(null)}>
              <div className="faculty-modal" onClick={(e) => e.stopPropagation()}>
                <div className="faculty-modal-header">
                  <h3>Edit Student</h3>
                  <button className="faculty-close" onClick={() => setEditingStudent(null)}>×</button>
                </div>
                <form onSubmit={handleUpdateStudent}>
                  <label>Name</label>
                  <input className="faculty-input" value={studentForm.name} onChange={(e) => setStudentForm({...studentForm, name:e.target.value})} />
                  <label>Father Name</label>
                  <input className="faculty-input" value={studentForm.fatherName} onChange={(e) => setStudentForm({...studentForm, fatherName:e.target.value})} />
                  <label>Mobile</label>
                  <input className="faculty-input" value={studentForm.mobile} onChange={(e) => setStudentForm({...studentForm, mobile:e.target.value})} />
                  <label>Class</label>
                  <select className="faculty-input" value={studentForm.className} onChange={(e) => setStudentForm({...studentForm, className:e.target.value, stream:""})}>
                    <option value="9th">9th</option><option value="10th">10th</option><option value="11th">11th</option><option value="12th">12th</option>
                  </select>
                  {(studentForm.className === "11th" || studentForm.className === "12th") && (
                    <>
                      <label>Stream</label>
                      <select className="faculty-input" value={studentForm.stream} onChange={(e) => setStudentForm({...studentForm, stream:e.target.value})}>
                        <option value="">Select Stream</option><option value="Science">Science</option><option value="Arts">Arts</option>
                      </select>
                    </>
                  )}
                  <button type="submit" className="faculty-primary" style={{marginTop:"18px"}}>{saving ? "Updating..." : "Update Student"}</button>
                </form>
              </div>
            </div>
          )}

          {selectedPayment && (
            <div className="faculty-modal-overlay" onClick={() => setSelectedPayment(null)}>
              <div className="faculty-modal" onClick={(e) => e.stopPropagation()}>
                <div className="faculty-modal-header">
                  <h3>Payment Details</h3>
                  <button className="faculty-close" onClick={() => setSelectedPayment(null)}>
                    ×
                  </button>
                </div>

                <div className="faculty-payment-details">
                  <div className="faculty-detail-box">
                    <small>Student Name</small>
                    <strong>{selectedPayment.studentName || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>Student ID</small>
                    <strong>{selectedPayment.studentId || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>Email</small>
                    <strong>{selectedPayment.studentEmail || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>Branch</small>
                    <strong>{selectedPayment.branch || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>Class</small>
                    <strong>{selectedPayment.className || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>Stream</small>
                    <strong>{selectedPayment.stream || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>Amount</small>
                    <strong>₹{Number(selectedPayment.amount || 0)}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>UPI ID</small>
                    <strong>{selectedPayment.upiId || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>UTR / Transaction ID</small>
                    <strong>{selectedPayment.utr || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>Date</small>
                    <strong>{selectedPayment.date || "-"}</strong>
                  </div>
                  <div className="faculty-detail-box">
                    <small>Status</small>
                    <strong>{selectedPayment.status || "-"}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === "Notifications" && (
            <section className="faculty-section">
              <div className="faculty-section-header">
                <div>
                  <h2>Notifications 🔔</h2>
                  <p>Realtime notifications for your faculty account.</p>
                </div>
                <span className="faculty-badge">
                  {notifications.filter((item) => !item.read).length} Unread
                </span>
              </div>

              {notifications.length === 0 ? (
                <div className="faculty-empty">
                  No notifications available.
                </div>
              ) : (
                <div className="faculty-notification-list">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`faculty-notification-card ${notification.read ? "read" : "unread"}`}
                      onClick={() => markNotificationRead(notification)}
                    >
                      <div className="faculty-notification-icon">
                        {notification.type === "payment" ? "💰" :
                         notification.type === "result" ? "📊" :
                         notification.type === "material" ? "📖" :
                         notification.type === "notice" ? "📢" : "🔔"}
                      </div>
                      <div className="faculty-notification-content">
                        <div className="faculty-notification-top">
                          <h3>{notification.title || "New Notification"}</h3>
                          {!notification.read && <span className="faculty-unread-dot">New</span>}
                        </div>
                        <p>{notification.message || "You have a new notification."}</p>
                        <small>
                          {notification.createdAt?.seconds
                            ? new Date(notification.createdAt.seconds * 1000).toLocaleString()
                            : "Just now"}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="faculty-notification-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification);
                        }}
                        title="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {activePage === "Notices" && (
            <section className="faculty-section">
              <div className="faculty-section-header">
                <div>
                  <h2>Notices</h2>
                  <p>
                    Publish important notices for students.
                  </p>
                </div>

                <button
                  className="faculty-primary"
                  onClick={() =>
                    setShowNoticeForm(!showNoticeForm)
                  }
                >
                  {showNoticeForm
                    ? "✕ Close"
                    : "+ Publish Notice"}
                </button>
              </div>

              {showNoticeForm && (
                <form
                  onSubmit={handleAddNotice}
                  className="faculty-form"
                >
                  <h3>Publish New Notice</h3>

                  <label>Notice Title</label>

                  <input
                    type="text"
                    placeholder="e.g. Holiday Notice"
                    value={noticeForm.title}
                    onChange={(e) =>
                      setNoticeForm({
                        ...noticeForm,
                        title: e.target.value,
                      })
                    }
                    className="faculty-input"
                  />

                  <label>Message</label>

                  <textarea
                    placeholder="Write notice message..."
                    value={noticeForm.message}
                    onChange={(e) =>
                      setNoticeForm({
                        ...noticeForm,
                        message: e.target.value,
                      })
                    }
                    className="faculty-textarea"
                  />

                  <button
                    type="submit"
                    className="faculty-primary"
                  >
                    {saving
                      ? "Publishing..."
                      : "Publish Notice"}
                  </button>
                </form>
              )}

              <div className="faculty-notices">
                {notices.length === 0 ? (
                  <div className="faculty-empty">
                    No notices available.
                  </div>
                ) : (
                  notices.map((notice) => (
                    <div
                      className="faculty-notice"
                      key={notice.id}
                    >
                      <div className="faculty-notice-icon">
                        📢
                      </div>

                      <div className="faculty-notice-content">
                        <div className="faculty-notice-header">
                          <h3>{notice.title}</h3>

                          <span className="faculty-badge">
                            Published
                          </span>
                        </div>

                        <p>{notice.message}</p>

                        <small>
                          {notice.date ||
                            "Date not available"}
                        </small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}