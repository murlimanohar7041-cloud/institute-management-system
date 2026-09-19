import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "../firebase"

export const sendStudentNotification = async ({
  studentEmail,
  studentId = "",
  studentFirestoreId = "",
  studentName = "",
  branch = "",
  className = "",
  stream = "",
  title,
  message,
  type = "General",
}) => {
  if (!studentEmail || !title || !message) return

  await addDoc(collection(db, "notifications"), {
    title,
    message,
    type,
    branch,
    studentEmail: String(studentEmail).toLowerCase(),
    studentId,
    studentFirestoreId,
    studentName,
    className,
    stream,
    status: "Published",
    read: false,
    createdAt: serverTimestamp(),
    date: new Date().toLocaleDateString(),
  })
}

export const sendAdminNotification = async ({
  studentEmail = "",
  studentId = "",
  studentFirestoreId = "",
  studentName = "",
  branch = "",
  title,
  message,
  type = "General",
}) => {
  if (!title || !message) return

  await addDoc(collection(db, "adminNotifications"), {
    title,
    message,
    type,
    branch,
    studentEmail: studentEmail ? String(studentEmail).toLowerCase() : "",
    studentId,
    studentFirestoreId,
    studentName,
    status: "New",
    read: false,
    createdAt: serverTimestamp(),
    date: new Date().toLocaleDateString(),
  })
}
