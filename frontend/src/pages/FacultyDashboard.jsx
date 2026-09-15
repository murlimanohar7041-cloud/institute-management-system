import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const FACULTY_EMAIL = "mdey9006690@gmail.com";

export default function FacultyDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState("Dashboard");

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
    description: "",
    materialUrl: "",
  });

  const [noticeForm, setNoticeForm] = useState({
    title: "",
    message: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      if (
        currentUser.email?.toLowerCase() !== FACULTY_EMAIL.toLowerCase()
      ) {
        alert("Access denied. Faculty account required.");
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      try {
        await loadAllData();
      } catch (error) {
        console.error(error);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadAllData = async () => {
    try {
      const studentQuery = query(
        collection(db, "students"),
        where("status", "==", "approved")
      );

      const studentSnap = await getDocs(studentQuery);

      const studentData = studentSnap.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setStudents(studentData);

      const resultSnap = await getDocs(collection(db, "results"));

      setResults(
        resultSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      const materialSnap = await getDocs(
        collection(db, "studyMaterials")
      );

      setMaterials(
        materialSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      const noticeSnap = await getDocs(collection(db, "notices"));

      const paymentSnap = await getDocs(collection(db, "payments"));

      setNotices(
        noticeSnap.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }))
      );

      setPayments(
        paymentSnap.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
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
      await updateDoc(doc(db, "students", editingStudent.id), {
        name: studentForm.name.trim(),
        fatherName: studentForm.fatherName.trim(),
        mobile: studentForm.mobile.trim(),
        className: studentForm.className,
        stream: (studentForm.className === "11th" || studentForm.className === "12th") ? studentForm.stream : "",
        updatedAt: serverTimestamp(),
      });
      alert("Student details updated successfully.");
      setEditingStudent(null);
      await loadAllData();
    } catch (error) {
      console.error(error);
      alert("Student update nahi hua.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    const ok = window.confirm(`Kya aap ${student.name || "is student"} ko delete karna chahte hain?`);
    if (!ok) return;
    try {
      await deleteDoc(doc(db, "students", student.id));
      setSelectedStudent(null);
      alert("Student deleted successfully.");
      await loadAllData();
    } catch (error) {
      console.error(error);
      alert("Student delete nahi hua.");
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

      await loadAllData();
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
        status: "Published",
        createdAt: serverTimestamp(),
      });

      alert("Study material successfully added.");

      setMaterialForm({
        title: "",
        subject: "",
        className: "9th",
        stream: "",
        description: "",
        materialUrl: "",
      });

      setShowMaterialForm(false);

      await loadAllData();
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

      await addDoc(collection(db, "notices"), {
        title: noticeForm.title,
        message: noticeForm.message,
        status: "Published",
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
      });

      alert("Notice successfully published.");

      setNoticeForm({
        title: "",
        message: "",
      });

      setShowNoticeForm(false);

      await loadAllData();
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
        * {
          box-sizing: border-box;
        }

        .faculty-page {
          min-height: 100vh;
          display: flex;
          background: #f5f7fb;
          font-family: Arial, sans-serif;
          color: #1f2937;
        }

        .faculty-sidebar {
          width: 250px;
          background: white;
          border-right: 1px solid #e5e7eb;
          padding: 22px 15px;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
        }

        .faculty-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 5px 8px 25px;
          border-bottom: 1px solid #e5e7eb;
        }

        .faculty-logo-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: #e11d48;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        }

        .faculty-logo h2 {
          margin: 0;
          font-size: 18px;
        }

        .faculty-logo span {
          font-size: 12px;
          color: #6b7280;
        }

        .faculty-menu {
          margin-top: 25px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .faculty-menu button {
          border: none;
          background: transparent;
          padding: 13px 14px;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
          font-size: 14px;
          color: #4b5563;
        }

        .faculty-menu button.active {
          background: #fee2e2;
          color: #dc2626;
          font-weight: 600;
        }

        .faculty-logout {
          margin-top: auto;
          border: none;
          background: #fee2e2;
          color: #dc2626;
          padding: 12px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        .faculty-main {
          margin-left: 250px;
          flex: 1;
          min-height: 100vh;
        }

        .faculty-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 18px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .faculty-header h1 {
          margin: 0;
          font-size: 24px;
        }

        .faculty-header p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .faculty-profile {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .faculty-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }

        .faculty-profile small {
          display: block;
          color: #6b7280;
          font-size: 11px;
          margin-top: 3px;
        }

        .faculty-welcome {
          margin: 30px;
          padding: 25px;
          background: linear-gradient(135deg, #eff6ff, white);
          border: 1px solid #dbeafe;
          border-radius: 16px;
        }

        .faculty-welcome h2 {
          margin: 0 0 8px;
        }

        .faculty-welcome p {
          margin: 0;
          color: #6b7280;
        }

        .faculty-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
          margin: 0 30px;
        }

        .faculty-stat {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 20px;
        }

        .faculty-stat-icon {
          font-size: 25px;
        }

        .faculty-stat h3 {
          margin: 12px 0 0;
          font-size: 15px;
        }

        .faculty-stat-number {
          margin: 10px 0 3px;
          font-size: 28px;
          font-weight: bold;
        }

        .faculty-stat-text {
          color: #6b7280;
          font-size: 12px;
        }

        .faculty-quick {
          margin: 30px;
        }

        .faculty-quick h2 {
          margin-bottom: 15px;
        }

        .faculty-quick-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .faculty-quick-grid button {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 18px;
          cursor: pointer;
          font-weight: 600;
          color: #374151;
        }

        .faculty-section {
          padding: 30px;
        }

        .faculty-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 22px;
        }

        .faculty-section-header h2 {
          margin: 0;
        }

        .faculty-section-header p {
          margin: 5px 0;
          color: #6b7280;
        }

        .faculty-primary {
          border: none;
          background: #e11d48;
          color: white;
          padding: 11px 17px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 600;
        }

        .faculty-form {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 15px;
          padding: 22px;
          margin-bottom: 25px;
          max-width: 700px;
        }

        .faculty-form h3 {
          margin-top: 0;
        }

        .faculty-form label {
          display: block;
          margin-top: 15px;
          margin-bottom: 7px;
          font-size: 13px;
          font-weight: 600;
        }

        .faculty-input,
        .faculty-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          background: white;
        }

        .faculty-textarea {
          min-height: 110px;
          resize: vertical;
        }

        .faculty-form .faculty-primary {
          margin-top: 18px;
        }

        .faculty-table-wrapper {
          overflow-x: auto;
          background: white;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
        }

        .faculty-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .faculty-table th {
          text-align: left;
          padding: 14px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }

        .faculty-table td {
          padding: 14px;
          border-bottom: 1px solid #f0f0f0;
        }

        .faculty-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .faculty-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 18px;
        }

        .faculty-card h3 {
          margin: 10px 0;
        }

        .faculty-card p {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .faculty-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .faculty-badge {
          display: inline-block;
          background: #dcfce7;
          color: #15803d;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .faculty-material-icon {
          font-size: 28px;
        }

        .faculty-open {
          display: inline-block;
          margin-top: 10px;
          padding: 9px 13px;
          border-radius: 8px;
          background: #2563eb;
          color: white;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }


        .faculty-filters {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 18px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 16px;
        }


        .faculty-edit-btn {
          border: none; background: #f59e0b; color: white; padding: 7px 11px;
          border-radius: 7px; cursor: pointer; font-size: 12px; font-weight: 600;
        }
        .faculty-delete-btn {
          border: none; background: #dc2626; color: white; padding: 7px 11px;
          border-radius: 7px; cursor: pointer; font-size: 12px; font-weight: 600;
        }

        .faculty-view-btn {
          border: none;
          background: #2563eb;
          color: white;
          padding: 8px 12px;
          border-radius: 7px;
          cursor: pointer;
          font-weight: 600;
        }

        .faculty-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .faculty-modal {
          width: min(850px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
        }

        .faculty-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .faculty-modal-header h2 {
          margin: 0 0 5px;
        }

        .faculty-modal-header p {
          margin: 0;
          color: #6b7280;
        }

        .faculty-close-btn {
          border: none;
          background: #fee2e2;
          color: #dc2626;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
        }

        .faculty-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .faculty-detail-grid > div {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 13px;
        }

        .faculty-detail-grid span {
          display: block;
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .faculty-detail-grid strong {
          display: block;
          word-break: break-word;
        }

        .faculty-student-results {
          margin-top: 24px;
        }

        .faculty-result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 13px;
          margin-bottom: 9px;
        }

        .faculty-result-row small {
          display: block;
          margin-top: 4px;
          color: #6b7280;
        }

        .faculty-analytics-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:20px}
        .faculty-analytics-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px;display:flex;align-items:center;gap:14px;box-shadow:0 4px 12px rgba(15,23,42,.05)}
        .faculty-analytics-card>span{font-size:28px}.faculty-analytics-card small{display:block;color:#64748b;margin-bottom:4px}.faculty-analytics-card strong{font-size:24px;color:#0f172a}
        .faculty-analytics-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px}.faculty-analytics-panel{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:20px;box-shadow:0 4px 12px rgba(15,23,42,.05)}.faculty-analytics-panel h3{margin:0 0 20px;color:#0f172a}
        .faculty-bar-row{margin-bottom:18px}.faculty-bar-label{display:flex;justify-content:space-between;margin-bottom:7px;font-size:14px}.faculty-bar-label b{color:#2563eb}.faculty-bar-track,.faculty-stream-track{height:10px;background:#e5e7eb;border-radius:99px;overflow:hidden}.faculty-bar-fill,.faculty-stream-fill{height:100%;background:#2563eb;border-radius:99px}.faculty-bar-row small{color:#94a3b8;display:block;margin-top:5px}.faculty-stream-box{margin-bottom:22px}.faculty-stream-box>div:first-child{display:flex;justify-content:space-between;margin-bottom:7px}.faculty-stream-box strong{color:#2563eb}.faculty-stream-fill{background:#dc2626}.faculty-analytics-note{color:#64748b;font-size:13px}.faculty-top-panel{margin-bottom:20px}.faculty-top-row{display:flex;align-items:center;gap:14px;padding:13px 0;border-bottom:1px solid #eef2f7}.faculty-rank{width:42px;height:42px;border-radius:50%;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-weight:700}.faculty-top-info{flex:1;display:flex;flex-direction:column;gap:3px}.faculty-top-info span{color:#64748b;font-size:13px}.faculty-top-score{color:#16a34a;font-size:18px}

        @media (max-width: 1000px) {
          .faculty-stats,
          .faculty-quick-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        .faculty-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }

        .faculty-detail-grid > div {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 13px;
        }

        .faculty-detail-grid span {
          display: block;
          color: #6b7280;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .faculty-detail-grid strong {
          display: block;
          word-break: break-word;
        }

        .faculty-student-results {
          margin-top: 24px;
        }

        .faculty-result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 13px;
          margin-bottom: 9px;
        }

        .faculty-result-row small {
          display: block;
          margin-top: 4px;
          color: #6b7280;
        }

        @media (max-width: 1000px) {
          .faculty-stats,
          .faculty-quick-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        .faculty-student-results {
          margin-top: 24px;
        }

        .faculty-result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 13px;
          margin-bottom: 9px;
        }

        .faculty-result-row small {
          display: block;
          margin-top: 4px;
          color: #6b7280;
        }

        @media (max-width: 1000px) {
          .faculty-stats,
          .faculty-quick-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        .faculty-result-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 13px;
          margin-bottom: 9px;
        }

        .faculty-result-row small {
          display: block;
          margin-top: 4px;
          color: #6b7280;
        }

        @media (max-width: 1000px) {
          .faculty-stats,
          .faculty-quick-grid {
            grid-template-columns: repeat(2, 1fr);
          }

        .faculty-payment-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
          margin-bottom: 20px;
        }

        .faculty-payment-box {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
        }

        .faculty-payment-box strong {
          display: block;
          font-size: 24px;
          margin-top: 7px;
        }

        .faculty-payment-box span {
          color: #6b7280;
          font-size: 12px;
        }

        .faculty-payment-toolbar {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 12px;
          margin-bottom: 18px;
        }

        .faculty-status {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
        }

        .faculty-status.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .faculty-status.approved {
          background: #dcfce7;
          color: #166534;
        }

        .faculty-status.rejected {
          background: #fee2e2;
          color: #991b1b;
        }

        .faculty-view-btn {
          border: none;
          background: #2563eb;
          color: white;
          padding: 7px 11px;
          border-radius: 7px;
          cursor: pointer;
          font-size: 12px;
        }

        .faculty-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 1000;
        }

        .faculty-modal {
          width: 100%;
          max-width: 520px;
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .faculty-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 18px;
        }

        .faculty-modal-header h3 {
          margin: 0;
        }

        .faculty-close {
          border: none;
          background: #f3f4f6;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
        }

        .faculty-payment-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .faculty-detail-box {
          background: #f9fafb;
          border-radius: 9px;
          padding: 12px;
        }

        .faculty-detail-box small {
          display: block;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .faculty-detail-box strong {
          word-break: break-word;
        }

        .faculty-notices {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .faculty-notice {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 18px;
          display: flex;
          gap: 15px;
        }

        .faculty-notice-icon {
          width: 45px;
          height: 45px;
          border-radius: 10px;
          background: #fff7ed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .faculty-notice-content {
          flex: 1;
        }

        .faculty-notice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .faculty-notice-header h3 {
          margin: 0;
        }

        .faculty-notice-content p {
          color: #4b5563;
          line-height: 1.5;
        }

        .faculty-notice-content small {
          color: #9ca3af;
        }

        .faculty-empty {
          background: white;
          border: 1px dashed #d1d5db;
          border-radius: 12px;
          padding: 30px;
          text-align: center;
          color: #6b7280;
        }

        .faculty-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Arial, sans-serif;
        }

        @media (max-width: 1000px) {
          .faculty-stats,
          .faculty-quick-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .faculty-cards {
            grid-template-columns: repeat(2, 1fr);
          }

          .faculty-payment-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .faculty-performance-grid { grid-template-columns: 1fr; }
          .faculty-filters {
            grid-template-columns: 1fr;
          }
          .faculty-sidebar {
            width: 210px;
          }

          .faculty-main {
            margin-left: 210px;
          }

          .faculty-stats,
          .faculty-quick-grid,
          .faculty-cards,
          .faculty-payment-summary {
            grid-template-columns: 1fr;
          }

          .faculty-payment-toolbar {
            grid-template-columns: 1fr;
          }

          .faculty-payment-details {
            grid-template-columns: 1fr;
          }

          .faculty-header {
            padding: 15px;
          }

          .faculty-section,
          .faculty-welcome,
          .faculty-quick,
          .faculty-stats {
            margin-left: 15px;
            margin-right: 15px;
          }
        }
      `}</style>

      <div className="faculty-page">
        <aside className="faculty-sidebar">
          <div className="faculty-logo">
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
            ].map((item) => (
              <button
                key={item}
                className={activePage === item ? "active" : ""}
                onClick={() => setActivePage(item)}
              >
                <span>
                  {item === "Dashboard" && "🏠"}
                  {item === "Students" && "👨‍🎓"}
                  {item === "Results" && "📊"}
                  {item === "Analytics" && "📈"}
                  {item === "Study Materials" && "📖"}
                  {item === "Payments" && "💰"}
                  {item === "Notices" && "📢"}
                </span>

                <span>{item}</span>
              </button>
            ))}
          </div>

          <button className="faculty-logout" onClick={handleLogout}>
            🚪 Logout
          </button>
        </aside>

        <main className="faculty-main">
          <header className="faculty-header">
            <div>
              <h1>{activePage}</h1>
              <p>Faculty Management Panel</p>
            </div>

            <div className="faculty-profile">
              <div className="faculty-avatar">
                {user?.displayName?.charAt(0) || "F"}
              </div>

              <div>
                <strong>{user?.displayName || "Faculty"}</strong>
                <small>{user?.email}</small>
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
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                >
                  <option value="All">All Classes</option>
                  <option value="9th">9th</option>
                  <option value="10th">10th</option>
                  <option value="11th">11th</option>
                  <option value="12th">12th</option>
                </select>

                <select
                  className="faculty-input"
                  value={studentStreamFilter}
                  onChange={(e) => setStudentStreamFilter(e.target.value)}
                >
                  <option value="All">All Streams</option>
                  <option value="Science">Science</option>
                  <option value="Arts">Arts</option>
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

                  return matchesSearch && matchesClass && matchesStream;
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
                                <button
                                  type="button"
                                  className="faculty-delete-btn"
                                  onClick={() => handleDeleteStudent(student)}
                                >
                                  Delete
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