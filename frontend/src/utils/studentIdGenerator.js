
import {
  collection,
  getDocs,
} from "firebase/firestore"

import { db } from "../firebase"

// =========================================================
// COMMON STUDENT ID GENERATOR
// Itimha  -> JSCI/001, JSCI/002, JSCI/003...
// Bardiha -> JSCB/001, JSCB/002, JSCB/003...
// =========================================================

export const generateNextStudentId = async (branch) => {
  const normalizedBranch = String(branch || "")
    .trim()
    .toLowerCase()

  let branchName = ""
  let prefix = ""

  if (normalizedBranch === "itimha") {
    branchName = "Itimha"
    prefix = "JSCI"
  } else if (normalizedBranch === "bardiha") {
    branchName = "Bardiha"
    prefix = "JSCB"
  } else {
    throw new Error("Invalid branch selected.")
  }

  // Get all students from Firestore
  const studentsSnapshot = await getDocs(
    collection(db, "students")
  )

  let maxNumber = 0

  studentsSnapshot.docs.forEach((docItem) => {
    const student = docItem.data()

    const studentBranch = String(
      student.branch || ""
    )
      .trim()
      .toLowerCase()

    // Only check students of the selected branch
    if (studentBranch !== normalizedBranch) {
      return
    }

    const existingId =
      student.studentId ||
      student.id ||
      ""

    // Check new format: JSCI/001 or JSCB/001
    const regex = new RegExp(
      `^${prefix}/(\\d+)$`,
      "i"
    )

    const match = String(existingId).match(regex)

    if (match) {
      const number = Number(match[1])

      if (number > maxNumber) {
        maxNumber = number
      }
    }
  })

  const nextNumber = maxNumber + 1

  return `${prefix}/${String(nextNumber).padStart(3, "0")}`
}
