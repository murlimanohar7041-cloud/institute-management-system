import React, { useEffect, useRef, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore"

import { auth, db } from "../firebase"
import { QRCodeSVG } from "qrcode.react"
import { getApp } from "firebase/app"
import { getStorage, ref, getBlob } from "firebase/storage"


function StudentHome() {

  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showFees, setShowFees] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [utr, setUtr] = useState("")
  const [selectedUpi, setSelectedUpi] = useState("9122993866@ybl")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState([])
  const [resultsLoading, setResultsLoading] = useState(false)
  const [resultsError, setResultsError] = useState("")
  const [showNotices, setShowNotices] = useState(false)
  const [notices, setNotices] = useState([])
  const [noticesLoading, setNoticesLoading] = useState(false)
  const [noticesError, setNoticesError] = useState("")
  const [showCertificates, setShowCertificates] = useState(false)
  const [certificates, setCertificates] = useState([])
  const [certificatesLoading, setCertificatesLoading] = useState(false)
  const [certificatesError, setCertificatesError] = useState("")
  const [showStudyMaterials, setShowStudyMaterials] = useState(false)
  const [studyMaterials, setStudyMaterials] = useState([])
  const [studyMaterialsLoading, setStudyMaterialsLoading] = useState(false)
  const [studyMaterialsError, setStudyMaterialsError] = useState("")
  const [locationSharing, setLocationSharing] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [lastLocation, setLastLocation] = useState(null)
  const locationWatchRef = useRef(null)
  const lastLocationSaveRef = useRef(0)

  const [showProfileEdit, setShowProfileEdit] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState("")
  const [profileForm, setProfileForm] = useState({ name: "", fatherName: "", mobile: "" })
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(true)
  const audioContextRef = useRef(null)
  const notificationTimerRef = useRef(null)


  useEffect(() => {

    // Firebase Auth ka wait karo
    const unsubscribe = onAuthStateChanged(auth, async (user) => {

      try {

        if (!user) {
          setError(
            "Student login nahi mila. Please dobara login karein."
          )

          setLoading(false)

          return
        }


        console.log("Logged in student:", user.email)


        const email = user.email.toLowerCase()


        // Firestore me student search
        const q = query(
          collection(db, "students"),
          where("email", "==", email)
        )


        const snapshot = await getDocs(q)


        console.log(
          "Student records found:",
          snapshot.size
        )


        if (snapshot.empty) {

          setError(
            "Aapka student record Firestore me nahi mila."
          )

          setLoading(false)

          return
        }


        const studentData = snapshot.docs[0].data()


        console.log(
          "Student data:",
          studentData
        )


        // Admission approved check
        if (studentData.status !== "approved") {

          setError(
            `Aapka admission abhi ${studentData.status || "pending"} hai.`
          )

          setLoading(false)

          return
        }


        // Student data set
        setStudent({
          id: snapshot.docs[0].id,
          ...studentData,
        })


        // LocalStorage bhi update kar do
        localStorage.setItem(
          "userRole",
          "student"
        )

        localStorage.setItem(
          "userEmail",
          email
        )

        localStorage.setItem(
          "userName",
          studentData.name || ""
        )

        localStorage.setItem(
          "studentId",
          studentData.studentId || ""
        )

        localStorage.setItem(
          "studentBranch",
          studentData.branch || ""
        )

        localStorage.setItem(
          "studentClass",
          studentData.className || ""
        )

        localStorage.setItem(
          "studentStream",
          studentData.stream || ""
        )


        setLoading(false)

      } catch (err) {

        console.error(
          "Student Dashboard Error:",
          err
        )


        if (
          err.code ===
          "permission-denied"
        ) {

          setError(
            "Firestore permission denied. Firebase Rules check karein."
          )

        } else {

          setError(
            "Student details load nahi ho pa rahi hain."
          )

        }


        setLoading(false)
      }

    })


    return () => unsubscribe()

  }, [])



  // =========================
  // AUTOMATIC GPS TRACKING
  // =========================
  const startLocationTracking = () => {
    if (!student?.id) return

    if (!navigator.geolocation) {
      setLocationError("Is device/browser me GPS location support nahi hai.")
      return
    }

    // Duplicate GPS watcher mat banao.
    if (locationWatchRef.current !== null) return

    setLocationLoading(true)
    setLocationError("")

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        try {
          const now = Date.now()

          // First location immediately save karo.
          // Uske baad maximum har 10 seconds me Firestore update karo.
          if (lastLocationSaveRef.current !== 0 && now - lastLocationSaveRef.current < 10000) {
            setLastLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              updatedAt: new Date(),
            })
            setLocationLoading(false)
            setLocationSharing(true)
            return
          }

          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            updatedAt: serverTimestamp(),
          }

          await updateDoc(doc(db, "students", student.id), {
            lastLocation: locationData,
            locationSharing: true,
          })

          lastLocationSaveRef.current = now

          setLastLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            updatedAt: new Date(),
          })

          setLocationSharing(true)
          setLocationLoading(false)
        } catch (err) {
          console.error("Location save error:", err)
          setLocationError("GPS location save nahi ho pa rahi hai.")
          setLocationLoading(false)
        }
      },
      (err) => {
        console.error("Location error:", err)
        setLocationLoading(false)
        setLocationSharing(false)

        if (err.code === 1) {
          setLocationError("Browser me Location permission Allow karein.")
        } else if (err.code === 2) {
          setLocationError("GPS location available nahi hai. Phone ki Location/GPS ON karein.")
        } else {
          setLocationError("GPS location lene me problem aa rahi hai.")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    )

    locationWatchRef.current = watchId
  }

  // Student approved/login hote hi GPS automatically start.
  useEffect(() => {
    if (!student?.id) return

    startLocationTracking()

    return () => {
      if (locationWatchRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(locationWatchRef.current)
        locationWatchRef.current = null
      }
    }
  }, [student?.id])

  const openMyLocation = () => {
    if (!lastLocation) return

    const url = `https://www.google.com/maps?q=${lastLocation.latitude},${lastLocation.longitude}`
    window.open(url, "_blank", "noopener,noreferrer")
  }


  const submitPayment = async () => {
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert("Please payment amount enter karein.")
      return
    }

    if (!utr.trim()) {
      alert("Please UTR / Transaction ID enter karein.")
      return
    }

    if (!student?.email) {
      alert("Student details nahi mili.")
      return
    }

    try {
      setPaymentLoading(true)
      setPaymentMessage("Payment details save ho rahi hain...")

      await addDoc(collection(db, "payments"), {
        studentId: student.studentId || "",
        studentFirestoreId: student.id || "",
        studentEmail: student.email.toLowerCase(),
        studentName: student.name || "",
        branch: student.branch || "",
        className: student.className || "",
        stream: student.stream || "",
        amount: Number(paymentAmount),
        upiId: selectedUpi,
        utr: utr.trim(),
        status: "Pending Verification",
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      })

      setPaymentMessage(
        "Payment details successfully submit ho gayi hain. Admin verification ke baad payment approve hogi."
      )
      setPaymentAmount("")
      setUtr("")
    } catch (err) {
      console.error("Payment Error:", err)
      setPaymentMessage(
        "Payment submit nahi ho payi. Please dobara try karein."
      )
    } finally {
      setPaymentLoading(false)
    }
  }

  // =========================
  // LOAD STUDENT RESULTS
  // =========================

  const loadResults = async () => {
    if (!student?.email) {
      alert("Student details nahi mili.")
      return
    }

    try {
      setResultsLoading(true)
      setResultsError("")

      const email = student.email.toLowerCase().trim()

      const resultQuery = query(
        collection(db, "results"),
        where("studentEmail", "==", email),
        where("branch", "==", student.branch || "")
      )

      const snapshot = await getDocs(resultQuery)

      const resultList = snapshot.docs
        .map((item) => ({
          firestoreId: item.id,
          ...item.data(),
        }))
        .filter(
          (item) =>
            String(item.status || "Published").toLowerCase() ===
            "published"
        )

      resultList.sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        return dateB - dateA
      })

      setResults(resultList)
      setShowResults(true)
    } catch (err) {
      console.error("Results Error:", err)
      setResultsError(
        err.code === "permission-denied"
          ? "Results dekhne ki permission nahi hai. Firebase Rules check karein."
          : "Results load nahi ho pa rahe hain. Please dobara try karein."
      )
      setShowResults(true)
    } finally {
      setResultsLoading(false)
    }
  }

  const getResultAnalytics = () => {
    const values = results
      .map((item) => Number(item.percentage))
      .filter((value) => Number.isFinite(value))

    if (values.length === 0) {
      return { average: 0, highest: 0, lowest: 0, total: 0, passed: 0 }
    }

    const total = values.length
    const average = values.reduce((sum, value) => sum + value, 0) / total
    const highest = Math.max(...values)
    const lowest = Math.min(...values)
    const passed = values.filter((value) => value >= 33).length

    return {
      average: average.toFixed(2),
      highest,
      lowest,
      total,
      passed,
    }
  }

  const loadNotices = async () => {
    if (!student) {
      alert("Student details nahi mili.")
      return
    }

    try {
      setNoticesLoading(true)
      setNoticesError("")

      const snapshot = await getDocs(collection(db, "notices"))
      const branch = String(student.branch || "").trim().toLowerCase()
      const studentClass = String(student.className || student.class || "").trim().toLowerCase()
      const studentStream = String(student.stream || "").trim().toLowerCase()

      const list = snapshot.docs
        .map((item) => ({ firestoreId: item.id, ...item.data() }))
        .filter((item) => {
          const itemBranch = String(item.branch || "").trim().toLowerCase()
          if (itemBranch && itemBranch !== branch) return false

          const status = String(item.status || item.noticeStatus || "Published").toLowerCase()
          if (["draft", "inactive", "rejected", "false"].includes(status)) return false

          const targetClass = String(item.className || item.class || item.targetClass || "all").trim().toLowerCase()
          const targetStream = String(item.stream || item.targetStream || "all").trim().toLowerCase()

          const classOk = !targetClass || ["all", "all classes", "everyone"].includes(targetClass) || targetClass === studentClass
          const streamOk = !targetStream || ["all", "all streams", "everyone"].includes(targetStream) || targetStream === studentStream
          return classOk && streamOk
        })

      list.sort((a, b) => {
        const da = a.createdAt?.seconds || new Date(a.date || 0).getTime() / 1000 || 0
        const dbv = b.createdAt?.seconds || new Date(b.date || 0).getTime() / 1000 || 0
        return dbv - da
      })

      setNotices(list)
      setShowNotices(true)
    } catch (err) {
      console.error("Notices Error:", err)
      setNoticesError("Notices load nahi ho pa rahe hain. Please dobara try karein.")
      setShowNotices(true)
    } finally {
      setNoticesLoading(false)
    }
  }

  // =========================
  // LOAD STUDY MATERIALS
  // =========================

  const loadStudyMaterials = async () => {
    if (!student) {
      alert("Student details nahi mili.")
      return
    }

    try {
      setStudyMaterialsLoading(true)
      setStudyMaterialsError("")

      const snapshot = await getDocs(collection(db, "studyMaterials"))
      const studentBranch = String(student.branch || "").trim().toLowerCase()
      const studentClass = String(student.className || student.class || "").trim().toLowerCase()
      const studentStream = String(student.stream || "").trim().toLowerCase()

      const list = snapshot.docs
        .map((item) => ({ firestoreId: item.id, ...item.data() }))
        .filter((item) => {
          const itemBranch = String(item.branch || "").trim().toLowerCase()
          const itemClass = String(item.className || item.class || "").trim().toLowerCase()
          const itemStream = String(item.stream || "").trim().toLowerCase()
          const status = String(item.status || "Published").trim().toLowerCase()

          if (status !== "published") return false
          if (itemBranch && itemBranch !== studentBranch) return false
          if (itemClass && itemClass !== studentClass) return false

          if (studentClass === "11th" || studentClass === "12th") {
            if (itemStream && !["all", "all streams", "everyone", studentStream].includes(itemStream)) return false
          }
          return true
        })

      list.sort((a, b) => {
        const dateA = a.createdAt?.seconds || new Date(a.date || 0).getTime() / 1000 || 0
        const dateB = b.createdAt?.seconds || new Date(b.date || 0).getTime() / 1000 || 0
        return dateB - dateA
      })

      setStudyMaterials(list)
      setShowStudyMaterials(true)
    } catch (err) {
      console.error("Study Materials Error:", err)
      setStudyMaterialsError(
        err.code === "permission-denied"
          ? "Study materials dekhne ki permission nahi hai. Firebase Rules check karein."
          : "Study materials load nahi ho pa rahe hain. Please dobara try karein."
      )
      setShowStudyMaterials(true)
    } finally {
      setStudyMaterialsLoading(false)
    }
  }

  const downloadCertificate = async (item) => {
    if (!item?.certificateUrl) return

    try {
      const storage = getStorage(getApp())

      if (item.storagePath) {
        const blob = await getBlob(ref(storage, item.storagePath))
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = item.fileName || `${item.certificateNumber || "certificate"}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        return
      }

      const a = document.createElement("a")
      a.href = item.certificateUrl
      a.download = item.fileName || `${item.certificateNumber || "certificate"}.pdf`
      a.target = "_blank"
      a.rel = "noreferrer"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (error) {
      console.error("Certificate download error:", error)
      window.open(item.certificateUrl, "_blank", "noopener,noreferrer")
    }
  }

  const loadCertificates = async () => {
    if (!student) {
      alert("Student details nahi mili.")
      return
    }

    try {
      setCertificatesLoading(true)
      setCertificatesError("")

      const snapshot = await getDocs(collection(db, "certificates"))
      const email = String(student.email || "").trim().toLowerCase()
      const studentId = String(student.studentId || "").trim().toLowerCase()
      const firestoreId = String(student.id || "").trim().toLowerCase()

      const list = snapshot.docs
        .map((item) => ({ firestoreId: item.id, ...item.data() }))
        .filter((item) => {
          const itemEmail = String(item.studentEmail || item.email || item.gmail || "").trim().toLowerCase()
          const itemStudentId = String(item.studentId || item.studentID || "").trim().toLowerCase()
          const itemFirestoreId = String(item.studentFirestoreId || "").trim().toLowerCase()
          const itemBranch = String(item.branch || "").trim().toLowerCase()
          const branch = String(student.branch || "").trim().toLowerCase()

          const sameStudent =
            (email && itemEmail === email) ||
            (studentId && itemStudentId === studentId) ||
            (firestoreId && itemFirestoreId === firestoreId)

          return sameStudent && (!itemBranch || itemBranch === branch)
        })

      list.sort((a, b) => {
        const da = a.createdAt?.seconds || new Date(a.issueDate || a.date || 0).getTime() / 1000 || 0
        const dbv = b.createdAt?.seconds || new Date(b.issueDate || b.date || 0).getTime() / 1000 || 0
        return dbv - da
      })

      setCertificates(list)
      setShowCertificates(true)
    } catch (err) {
      console.error("Certificates Error:", err)
      setCertificatesError("Certificates load nahi ho pa rahe hain. Please dobara try karein.")
      setShowCertificates(true)
    } finally {
      setCertificatesLoading(false)
    }
  }

  // =========================
  // EDIT / SAVE PROFILE
  // =========================
  const openProfileEdit = () => {
    setProfileForm({
      name: student?.name || "",
      fatherName: student?.fatherName || "",
      mobile: student?.mobile || "",
    })
    setProfileMessage("")
    setShowProfileEdit(true)
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    const name = profileForm.name.trim()
    const fatherName = profileForm.fatherName.trim()
    const mobile = profileForm.mobile.trim()

    if (!name || !fatherName || !mobile) {
      setProfileMessage("Please Name, Father's Name aur Mobile Number fill karein.")
      return
    }
    if (!/^[0-9]{10}$/.test(mobile)) {
      setProfileMessage("Mobile number 10 digits ka hona chahiye.")
      return
    }
    if (!student?.id) {
      setProfileMessage("Student record nahi mila.")
      return
    }

    try {
      setProfileSaving(true)
      setProfileMessage("")
      await updateDoc(doc(db, "students", student.id), { name, fatherName, mobile })
      setStudent({ ...student, name, fatherName, mobile })
      localStorage.setItem("userName", name)
      setProfileMessage("Profile successfully update ho gaya. ✅")
      setTimeout(() => {
        setShowProfileEdit(false)
        setProfileMessage("")
      }, 900)
    } catch (err) {
      console.error("Profile update error:", err)
      setProfileMessage(
        err.code === "permission-denied"
          ? "Profile update ki permission nahi hai."
          : "Profile update nahi ho pa raha hai. Please dobara try karein."
      )
    } finally {
      setProfileSaving(false)
    }
  }


  // =========================
  // NOTIFICATIONS + SOUND
  // =========================

  const playNotificationSound = () => {
    try {
      if (!notificationSoundEnabled) return

      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext

      if (!AudioContextClass) return

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const ctx = audioContextRef.current

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {})
      }

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.type = "sine"
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(1175, ctx.currentTime + 0.12)

      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.start()
      oscillator.stop(ctx.currentTime + 0.35)
    } catch (err) {
      console.log("Notification sound unavailable:", err)
    }
  }

  const getNotificationTime = (data) => {
    if (data?.createdAt?.toMillis) {
      return data.createdAt.toMillis()
    }

    if (data?.createdAt?.seconds) {
      return data.createdAt.seconds * 1000
    }

    return Date.now()
  }

  const isNotificationForStudent = (data) => {
    if (!student) return false

    const sameBranch =
      !data?.branch ||
      data.branch === student.branch

    const sameClass =
      !data?.className ||
      data.className === student.className

    const sameStream =
      !data?.stream ||
      !student.stream ||
      data.stream === student.stream

    const sameStudent =
      !data?.studentEmail ||
      data.studentEmail?.toLowerCase() === student.email?.toLowerCase()

    const sameStudentId =
      !data?.studentId ||
      data.studentId === student.studentId

    return sameBranch && sameClass && sameStream && sameStudent && sameStudentId
  }

  const createNotificationText = (collectionName, data) => {
    if (collectionName === "results") {
      return {
        type: "Result",
        icon: "📊",
        title: "New Result Published",
        message: `${data.exam || "Exam"} result is now available.`,
      }
    }

    if (collectionName === "notices") {
      return {
        type: "Notice",
        icon: "📢",
        title: "New Notice",
        message: data.title || data.message || "A new notice has been published.",
      }
    }

    if (collectionName === "studyMaterials") {
      return {
        type: "Study Material",
        icon: "📖",
        title: "New Study Material",
        message: data.title || "New study material is available.",
      }
    }

    if (collectionName === "certificates") {
      return {
        type: "Certificate",
        icon: "📜",
        title: "New Certificate",
        message: data.certificateTitle || "A new certificate has been issued.",
      }
    }

    if (collectionName === "fees") {
      return {
        type: "Fees",
        icon: "💰",
        title: "Fees Update",
        message: data.title || data.description || "Your fee information has been updated.",
      }
    }

    return null
  }

  const checkForNewNotifications = async () => {
    if (!student?.id) return

    const collectionsToCheck = [
      "results",
      "notices",
      "studyMaterials",
      "certificates",
      "fees",
    ]

    const storageKey = `jsc_notification_seen_${student.id}`
    let seenIds = {}

    try {
      seenIds = JSON.parse(localStorage.getItem(storageKey) || "{}")
    } catch {
      seenIds = {}
    }

    const newNotifications = []
    const nextSeenIds = { ...seenIds }

    for (const collectionName of collectionsToCheck) {
      try {
        const snapshot = await getDocs(collection(db, collectionName))

        snapshot.forEach((item) => {
          const data = item.data()

          if (!isNotificationForStudent(data)) return

          const status = String(data.status || "").toLowerCase()

          if (["draft", "inactive", "rejected"].includes(status)) return

          const itemKey = `${collectionName}_${item.id}`

          if (!Object.prototype.hasOwnProperty.call(seenIds, itemKey)) {
            const notification = createNotificationText(collectionName, data)

            if (notification) {
              newNotifications.push({
                id: itemKey,
                ...notification,
                createdAt: getNotificationTime(data),
                read: false,
              })
            }
          }

          nextSeenIds[itemKey] = true
        })
      } catch (err) {
        console.log(`Notification check failed for ${collectionName}:`, err)
      }
    }

    localStorage.setItem(storageKey, JSON.stringify(nextSeenIds))

    if (newNotifications.length > 0) {
      setNotifications((prev) => [
        ...newNotifications.reverse(),
        ...prev,
      ].slice(0, 50))

      playNotificationSound()
    }
  }

  useEffect(() => {
    if (!student?.id) return

    checkForNewNotifications()

    notificationTimerRef.current = setInterval(() => {
      checkForNewNotifications()
    }, 15000)

    const unlockSound = () => {
      try {
        const AudioContextClass =
          window.AudioContext || window.webkitAudioContext

        if (!AudioContextClass) return

        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContextClass()
        }

        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().catch(() => {})
        }
      } catch {}
    }

    window.addEventListener("click", unlockSound, { once: true })

    return () => {
      if (notificationTimerRef.current) {
        clearInterval(notificationTimerRef.current)
      }

      window.removeEventListener("click", unlockSound)
    }
  }, [student?.id])

  const unreadNotificationCount = notifications.filter(
    (item) => !item.read
  ).length

  const openNotifications = () => {
    setShowNotifications(true)
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, read: true }))
    )
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  // =========================
  // LOADING
  // =========================


  if (loading) {

    return (
      <div style={styles.loadingPage}>

        <div style={styles.loadingBox}>

          <div style={styles.spinner}></div>

          <h2>
            Loading Student Dashboard...
          </h2>

          <p>
            Please wait...
          </p>

        </div>

      </div>
    )

  }



  // =========================
  // ERROR
  // =========================

  if (error) {

    return (
      <div style={styles.errorPage}>

        <div style={styles.errorBox}>

          <div style={styles.errorIcon}>
            ⚠️
          </div>

          <h2>
            Access Error
          </h2>

          <p>
            {error}
          </p>

          <button
            style={styles.loginButton}
            onClick={() => {
              window.location.href = "/login"
            }}
          >
            Go to Login
          </button>

        </div>

      </div>
    )

  }



  // =========================
  // STUDENT DASHBOARD
  // =========================

  return (

    <div style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>

        <div style={styles.logoSection}>

          <div style={styles.logo}>
            JSC
          </div>

          <div>

            <h2 style={styles.logoTitle}>
              J. Solution Classes
            </h2>

            <p style={styles.logoSubtitle}>
              Student Portal
            </p>

          </div>

        </div>


        <div style={styles.headerRight}>

          <button
            type="button"
            style={styles.headerNotificationButton}
            onClick={openNotifications}
            title="Notifications"
          >
            <span style={styles.headerBell}>🔔</span>
            {unreadNotificationCount > 0 && (
              <span style={styles.headerNotificationBadge}>
                {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
              </span>
            )}
          </button>

          <div style={styles.studentMini}>

            <div style={styles.miniAvatar}>

              {student?.name
                ?.charAt(0)
                ?.toUpperCase() || "S"}

            </div>


            <div>

              <strong>
                {student?.name || "Student"}
              </strong>

              <small>
                {student?.studentId || "Student ID"}
              </small>

            </div>

          </div>


          <button
            style={styles.logoutButton}
            onClick={() => {
              auth.signOut()
              window.location.href = "/login"
            }}
          >
            Logout
          </button>

        </div>

      </header>



      {/* MAIN */}

      <main style={styles.main}>

        {/* WELCOME */}

        <section style={styles.welcomeCard}>

          <div>

            <p style={styles.welcomeSmall}>
              Welcome back 👋
            </p>

            <h1 style={styles.welcomeTitle}>
              Hello, {student?.name || "Student"}!
            </h1>

            <p style={styles.welcomeText}>
              Welcome to your J. Solution Classes
              Student Dashboard.
            </p>

          </div>


          <div style={styles.approvedBadge}>
            ✓ Admission Approved
          </div>

        </section>



        {/* SUMMARY */}

        <section style={styles.cardGrid}>

          <SummaryCard
            icon="🆔"
            label="Student ID"
            value={student?.studentId}
          />

          <SummaryCard
            icon="🎓"
            label="Class"
            value={student?.className}
          />

          <SummaryCard
            icon="🏫"
            label="Branch"
            value={student?.branch}
          />

          <SummaryCard
            icon="📚"
            label="Stream"
            value={student?.stream || "N/A"}
          />

        </section>



        {/* PROFILE */}

        <section style={styles.section}>

          <div style={styles.sectionHeader}>

            <div>

              <h2 style={styles.sectionTitle}>
                My Profile
              </h2>

              <p style={styles.sectionSubtitle}>
                Your registered student information
              </p>

            </div>


            <div style={styles.profileHeaderActions}>
              <div style={styles.profileStatus}>Approved</div>
              <button type="button" style={styles.editProfileButton} onClick={openProfileEdit}>
                ✏️ Edit Profile
              </button>
            </div>

          </div>



          <div style={styles.profileGrid}>

            <ProfileItem
              label="Student Name"
              value={student?.name}
              icon="👤"
            />

            <ProfileItem
              label="Father's Name"
              value={student?.fatherName}
              icon="👨"
            />

            <ProfileItem
              label="Gmail"
              value={student?.email}
              icon="📧"
            />

            <ProfileItem
              label="Mobile Number"
              value={student?.mobile}
              icon="📱"
            />

            <ProfileItem
              label="Class"
              value={student?.className}
              icon="🎓"
            />

            <ProfileItem
              label="Stream"
              value={student?.stream || "N/A"}
              icon="📖"
            />

            <ProfileItem
              label="Branch"
              value={student?.branch}
              icon="🏫"
            />

            <ProfileItem
              label="Student ID"
              value={student?.studentId}
              icon="🆔"
            />

          </div>

        </section>



        {/* SERVICES */}

        <section style={styles.section}>

          <div style={styles.sectionHeader}>

            <div>

              <h2 style={styles.sectionTitle}>
                Student Services
              </h2>

              <p style={styles.sectionSubtitle}>
                Access your academic information
              </p>

            </div>

          </div>



          <div style={styles.serviceGrid}>

            <ServiceCard
              icon="💰"
              title="Fees"
              text="View and pay your fees"
              onClick={() => {
                setShowFees(true)
                setPaymentMessage("")
              }}
            />

            <ServiceCard
              icon="📊"
              title="Results"
              text="View your examination results"
              onClick={loadResults}
            />

            <ServiceCard
              icon="📢"
              title="Notices"
              text="View latest class notices"
              onClick={loadNotices}
            />

            <ServiceCard
              icon="📜"
              title="Certificates"
              text="View your certificates"
              onClick={loadCertificates}
            />

            <ServiceCard
              icon="📖"
              title="Study Materials"
              text="View notes and study PDFs"
              onClick={loadStudyMaterials}
            />

            <ServiceCard
              icon="📍"
              title="My Location"
              text="GPS location automatically shared with Admin"
              onClick={openMyLocation}
            />

          </div>

        </section>



        {/* LOCATION SHARING */}

        <section style={styles.locationCard}>

          <div style={styles.locationHeader}>
            <div>
              <h3 style={styles.locationTitle}>📍 Location Sharing</h3>
              <p style={styles.locationText}>
                Share your latest location with the J. Solution Classes admin.
              </p>
            </div>

            <div style={{
              ...styles.locationBadge,
              background: locationSharing ? "#dcfce7" : "#f3f4f6",
              color: locationSharing ? "#15803d" : "#6b7280",
            }}>
              {locationSharing ? "● GPS ACTIVE" : "● WAITING"}
            </div>
          </div>

          {locationLoading && (
            <p style={styles.locationStatus}>📡 Getting your location...</p>
          )}

          {locationError && (
            <p style={styles.locationError}>⚠️ {locationError}</p>
          )}

          {lastLocation && (
            <div style={styles.locationDetails}>
              <span>
                Latitude: <strong>{lastLocation.latitude.toFixed(6)}</strong>
              </span>
              <span>
                Longitude: <strong>{lastLocation.longitude.toFixed(6)}</strong>
              </span>
              <span>
                Accuracy: <strong>±{Math.round(lastLocation.accuracy)} m</strong>
              </span>
              <button
                type="button"
                style={styles.mapButton}
                onClick={openMyLocation}
              >
                🗺️ Open Map
              </button>
            </div>
          )}

          <div style={styles.locationAutoMessage}>
            {locationSharing
              ? "✅ GPS automatically active. Your latest location is being shared with Admin."
              : "📡 GPS location automatically start ho rahi hai..."}
          </div>

          <p style={styles.locationNote}>
            Browser/device pehli baar GPS permission maangega. Allow karne ke baad location automatically Admin ko update hoti rahegi jab Student Dashboard active rahega.
          </p>

        </section>



        {/* ADMISSION STATUS */}

        <section style={styles.infoCard}>

          <div style={styles.infoIcon}>
            ✓
          </div>


          <div>

            <h3 style={styles.infoTitle}>
              Admission Status
            </h3>

            <p style={styles.infoText}>
              Your admission has been approved
              by the administrator.
            </p>


            <div style={styles.infoDetails}>

              <span>
                <strong>
                  Application ID:
                </strong>{" "}
                {student?.applicationId || "N/A"}
              </span>


              <span>
                <strong>
                  Student ID:
                </strong>{" "}
                {student?.studentId || "N/A"}
              </span>


              <span>
                <strong>
                  Status:
                </strong>{" "}
                Approved
              </span>

            </div>

          </div>

        </section>

      {/* =========================
          EDIT PROFILE MODAL
      ========================= */}
      {showProfileEdit && (
        <div style={styles.modalOverlay}>
          <div style={styles.profileEditModal}>
            <button type="button" style={styles.closeModal} onClick={() => setShowProfileEdit(false)}>×</button>
            <h2 style={styles.paymentTitle}>✏️ Edit Profile</h2>
            <p style={styles.paymentSubtitle}>Apni basic student information update karein.</p>

            <form onSubmit={saveProfile}>
              <label style={styles.paymentLabel}>Student Name</label>
              <input type="text" value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                style={styles.paymentInput} placeholder="Enter student name" />

              <label style={styles.paymentLabel}>Father's Name</label>
              <input type="text" value={profileForm.fatherName}
                onChange={(e) => setProfileForm({ ...profileForm, fatherName: e.target.value })}
                style={styles.paymentInput} placeholder="Enter father's name" />

              <label style={styles.paymentLabel}>Mobile Number</label>
              <input type="tel" inputMode="numeric" maxLength={10} value={profileForm.mobile}
                onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value.replace(/\\D/g, "").slice(0, 10) })}
                style={styles.paymentInput} placeholder="10 digit mobile number" />

              <div style={styles.profileLockedBox}>
                🔒 <strong>Gmail, Student ID, Class, Stream aur Branch</strong> admin-controlled fields hain. Inhe student change nahi kar sakta.
              </div>

              {profileMessage && <div style={styles.profileMessage}>{profileMessage}</div>}
              <button type="submit" style={styles.paySubmitButton} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================
          STUDY MATERIALS MODAL
      ========================= */}

      {showStudyMaterials && (
        <div style={styles.modalOverlay}>
          <div style={styles.resultsModal}>
            <button style={styles.closeModal} onClick={() => setShowStudyMaterials(false)}>×</button>
            <h2 style={styles.paymentTitle}>📖 Study Materials</h2>
            <p style={styles.paymentSubtitle}>Notes and study materials for Class {student?.className || "N/A"}{student?.stream ? ` — ${student.stream}` : ""}</p>

            <div style={styles.resultStudentBox}>
              <strong>{student?.name}</strong>
              <span>Student ID: {student?.studentId || "N/A"}</span>
              <span>Class: {student?.className || "N/A"}</span>
              {student?.stream && <span>Stream: {student.stream}</span>}
              <span>Branch: {student?.branch || "N/A"}</span>
            </div>

            {studyMaterialsLoading ? (
              <div style={styles.emptyResultBox}><div style={styles.spinner}></div><p>Study materials load ho rahe hain...</p></div>
            ) : studyMaterialsError ? (
              <div style={styles.resultErrorBox}>⚠️ {studyMaterialsError}</div>
            ) : studyMaterials.length === 0 ? (
              <div style={styles.emptyResultBox}>
                <div style={{ fontSize: "42px" }}>📖</div>
                <h3 style={{ margin: "10px 0 5px" }}>No Study Material Available</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>Abhi aapki class ke liye koi study material available nahi hai.</p>
              </div>
            ) : (
              <div style={styles.resultsList}>
                {studyMaterials.map((item) => (
                  <div key={item.firestoreId} style={styles.studyMaterialCard}>
                    <div style={styles.studyMaterialIcon}>📖</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={styles.studyMaterialTitle}>{item.title || "Study Material"}</h3>
                      <p style={styles.studyMaterialLine}><strong>Subject:</strong> {item.subject || "N/A"}</p>
                      <p style={styles.studyMaterialLine}><strong>Class:</strong> {item.className || "N/A"}{item.stream ? ` — ${item.stream}` : ""}</p>
                      {item.description && <p style={styles.studyMaterialDescription}>{item.description}</p>}
                      <span style={styles.studyMaterialStatus}>Published</span>
                      {item.materialUrl && (
                        <div style={styles.studyMaterialActions}>
                          <a href={item.materialUrl} target="_blank" rel="noreferrer" style={styles.studyMaterialButton}>Open PDF / Notes ↗</a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================
          NOTICES MODAL
      ========================= */}

      {showNotices && (
        <div style={styles.modalOverlay}>
          <div style={styles.resultsModal}>
            <button style={styles.closeModal} onClick={() => setShowNotices(false)}>×</button>
            <h2 style={styles.paymentTitle}>📢 Notices</h2>
            <p style={styles.paymentSubtitle}>Latest notices for all students</p>

            {noticesLoading ? (
              <div style={styles.emptyResultBox}><div style={styles.spinner}></div><p>Notices load ho rahe hain...</p></div>
            ) : noticesError ? (
              <div style={styles.resultErrorBox}>⚠️ {noticesError}</div>
            ) : notices.length === 0 ? (
              <div style={styles.emptyResultBox}>
                <div style={{ fontSize: "42px" }}>📢</div>
                <h3 style={{ margin: "10px 0 5px" }}>No Notices</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>Abhi aapke liye koi notice available nahi hai.</p>
              </div>
            ) : (
              <div style={styles.resultsList}>
                {notices.map((item) => (
                  <div key={item.firestoreId} style={styles.noticeCard}>
                    <div style={styles.noticeTop}>
                      <h3 style={styles.noticeTitle}>{item.title || item.noticeTitle || item.heading || "Notice"}</h3>
                      <span style={styles.noticeDate}>{item.date || item.createdDate || ""}</span>
                    </div>
                    <p style={styles.noticeMessage}>{item.message || item.description || item.content || item.notice || item.text || ""}</p>
                    {(item.className || item.class || item.targetClass) && <span style={styles.noticeMeta}>Class: {item.className || item.class || item.targetClass}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================
          CERTIFICATES MODAL
      ========================= */}

      {showCertificates && (
        <div style={styles.modalOverlay}>
          <div style={styles.resultsModal}>
            <button style={styles.closeModal} onClick={() => setShowCertificates(false)}>×</button>
            <h2 style={styles.paymentTitle}>📜 My Certificates</h2>
            <p style={styles.paymentSubtitle}>Your certificates and credentials</p>

            <div style={styles.resultStudentBox}>
              <strong>{student?.name}</strong>
              <span>Student ID: {student?.studentId || "N/A"}</span>
              <span>Branch: {student?.branch || "N/A"}</span>
            </div>

            {certificatesLoading ? (
              <div style={styles.emptyResultBox}><div style={styles.spinner}></div><p>Certificates load ho rahe hain...</p></div>
            ) : certificatesError ? (
              <div style={styles.resultErrorBox}>⚠️ {certificatesError}</div>
            ) : certificates.length === 0 ? (
              <div style={styles.emptyResultBox}>
                <div style={{ fontSize: "42px" }}>📜</div>
                <h3 style={{ margin: "10px 0 5px" }}>No Certificate Available</h3>
                <p style={{ margin: 0, color: "#6b7280" }}>Abhi aapke naam par koi certificate available nahi hai.</p>
              </div>
            ) : (
              <div style={styles.resultsList}>
                {certificates.map((item) => (
                  <div key={item.firestoreId} style={styles.certificateCard}>
                    <div style={styles.certificateIcon}>📜</div>
                    <div style={{ flex: 1 }}>
                      <h3 style={styles.certificateTitle}>{item.certificateTitle || item.title || item.name || "Certificate"}</h3>
                      <p style={styles.certificateLine}>Certificate No: {item.certificateNumber || item.certificateNo || item.number || "N/A"}</p>
                      <p style={styles.certificateLine}>Issue Date: {item.issueDate || item.date || "N/A"}</p>
                      {item.description && <p style={styles.certificateDescription}>{item.description}</p>}
                      {item.status && <span style={styles.certificateStatus}>{item.status}</span>}
                      {item.certificateUrl && (
                        <div style={styles.certificateActions}>
                          <a href={item.certificateUrl} target="_blank" rel="noreferrer" style={styles.certificateLink}>View Certificate ↗</a>
                          <button type="button" onClick={() => downloadCertificate(item)} style={styles.certificateDownload}>Download PDF ↓</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================
          RESULTS MODAL
      ========================= */}

      {showResults && (
        <div style={styles.modalOverlay}>
          <div style={styles.resultsModal}>
            <button
              style={styles.closeModal}
              onClick={() => setShowResults(false)}
            >
              ×
            </button>

            <h2 style={styles.paymentTitle}>📊 My Results</h2>
            <p style={styles.paymentSubtitle}>
              Your published examination results
            </p>

            <div style={styles.resultStudentBox}>
              <strong>{student?.name}</strong>
              <span>Student ID: {student?.studentId || "N/A"}</span>
              <span>
                Class: {student?.className || "N/A"}
                {student?.stream ? ` — ${student.stream}` : ""}
              </span>
              <span>Branch: {student?.branch || "N/A"}</span>
            </div>

            {!resultsLoading && !resultsError && results.length > 0 && (() => {
              const analytics = getResultAnalytics()
              return (
                <div style={styles.resultAnalyticsBox}>
                  <div style={styles.analyticsHeader}>
                    <div>
                      <h3 style={styles.analyticsTitle}>📈 Performance Summary</h3>
                      <p style={styles.analyticsSubtitle}>Your overall published result performance</p>
                    </div>
                  </div>
                  <div style={styles.analyticsGrid}>
                    <div style={styles.analyticsCard}>
                      <span style={styles.analyticsIcon}>📊</span>
                      <span style={styles.analyticsLabel}>Average</span>
                      <strong style={styles.analyticsValue}>{analytics.average}%</strong>
                    </div>
                    <div style={styles.analyticsCard}>
                      <span style={styles.analyticsIcon}>🏆</span>
                      <span style={styles.analyticsLabel}>Highest</span>
                      <strong style={styles.analyticsValue}>{analytics.highest}%</strong>
                    </div>
                    <div style={styles.analyticsCard}>
                      <span style={styles.analyticsIcon}>📝</span>
                      <span style={styles.analyticsLabel}>Exams</span>
                      <strong style={styles.analyticsValue}>{analytics.total}</strong>
                    </div>
                    <div style={styles.analyticsCard}>
                      <span style={styles.analyticsIcon}>✅</span>
                      <span style={styles.analyticsLabel}>Passed</span>
                      <strong style={styles.analyticsValue}>{analytics.passed}/{analytics.total}</strong>
                    </div>
                  </div>
                </div>
              )
            })()}

            {resultsLoading ? (
              <div style={styles.emptyResultBox}>
                <div style={styles.spinner}></div>
                <p>Results load ho rahe hain...</p>
              </div>
            ) : resultsError ? (
              <div style={styles.resultErrorBox}>
                ⚠️ {resultsError}
              </div>
            ) : results.length === 0 ? (
              <div style={styles.emptyResultBox}>
                <div style={{ fontSize: "42px" }}>📝</div>
                <h3 style={{ margin: "10px 0 5px" }}>
                  No Result Available
                </h3>
                <p style={{ margin: 0, color: "#6b7280" }}>
                  Aapka result abhi publish nahi hua hai.
                </p>
              </div>
            ) : (
              <div style={styles.resultsList}>
                {results.map((item) => (
                  <div
                    key={item.firestoreId}
                    style={styles.resultCard}
                  >
                    <div style={styles.resultTop}>
                      <div>
                        <h3 style={styles.resultExam}>
                          {item.exam || "Examination"}
                        </h3>
                        <p style={styles.resultId}>
                          Result ID: {item.resultId || "N/A"}
                        </p>
                      </div>

                      <div style={styles.percentageBadge}>
                        {item.percentage}%
                      </div>
                    </div>

                    <div style={styles.resultDetails}>
                      <div>
                        <span style={styles.resultLabel}>Class</span>
                        <strong>
                          {item.className || "N/A"}
                          {item.stream ? ` — ${item.stream}` : ""}
                        </strong>
                      </div>

                      <div>
                        <span style={styles.resultLabel}>Status</span>
                        <strong style={{ color: "#15803d" }}>
                          ✓ Published
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================
          FEES PAYMENT MODAL
      ========================= */}

      {showFees && (
        <div style={styles.modalOverlay}>
          <div style={styles.paymentModal}>
            <button
              style={styles.closeModal}
              onClick={() => setShowFees(false)}
            >
              ×
            </button>

            <h2 style={styles.paymentTitle}>💰 Fee Payment</h2>
            <p style={styles.paymentSubtitle}>
              Pay your fees using UPI
            </p>

            <div style={styles.paymentStudentBox}>
              <strong>{student?.name}</strong>
              <span>Student ID: {student?.studentId}</span>
              <span>Branch: {student?.branch}</span>
            </div>

            <label style={styles.paymentLabel}>Payment Amount</label>
            <input
              type="number"
              min="1"
              placeholder="Enter amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              style={styles.paymentInput}
            />

            <label style={styles.paymentLabel}>Select UPI ID</label>
            <select
              value={selectedUpi}
              onChange={(e) => setSelectedUpi(e.target.value)}
              style={styles.paymentInput}
            >
              <option value="9122993866@pthdfc">9122993866@pthdfc</option>
              <option value="9122993866@ybl">9122993866@ybl</option>
              <option value="9122993866@nyes">9122993866@nyes</option>
            </select>

            <div style={styles.qrBox}>
              <p style={styles.qrTitle}>Scan & Pay</p>
              {paymentAmount ? (
                <QRCodeSVG
                  value={`upi://pay?pa=${selectedUpi}&pn=J%20Solution%20Classes&am=${encodeURIComponent(paymentAmount)}&cu=INR`}
                  size={190}
                />
              ) : (
                <div style={styles.qrPlaceholder}>
                  Amount enter karne ke baad QR Code dikhega
                </div>
              )}
              <p style={styles.upiText}>
                UPI ID: <strong>{selectedUpi}</strong>
              </p>
            </div>

            <label style={styles.paymentLabel}>
              UTR / Transaction ID
            </label>
            <input
              type="text"
              placeholder="Payment ke baad UTR enter karein"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              style={styles.paymentInput}
            />

            <button
              style={{
                ...styles.paySubmitButton,
                opacity: paymentLoading ? 0.7 : 1,
              }}
              onClick={submitPayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? "Submitting..." : "I Have Paid"}
            </button>

            {paymentMessage && (
              <div style={styles.paymentMessage}>
                {paymentMessage}
              </div>
            )}

            <p style={styles.paymentNote}>
              ⚠️ Payment karne ke baad UTR / Transaction ID zaroor enter karein.
              Admin payment verify karega.
            </p>
          </div>
        </div>
      )}

      </main>




      {showNotifications && (
        <div style={styles.modalOverlay}>
          <div style={styles.notificationModal}>
            <div style={styles.notificationHeader}>
              <div>
                <h2 style={styles.notificationTitle}>🔔 Notifications</h2>
                <p style={styles.notificationSubtitle}>
                  New updates from J. Solution Classes
                </p>
              </div>

              <button
                type="button"
                style={styles.closeModal}
                onClick={() => setShowNotifications(false)}
              >
                ✕
              </button>
            </div>

            <div style={styles.notificationSoundRow}>
              <span>
                🔊 Alert Sound: {notificationSoundEnabled ? "ON" : "OFF"}
              </span>
              <button
                type="button"
                style={styles.soundToggleButton}
                onClick={() => {
                  setNotificationSoundEnabled((value) => !value)
                  if (!notificationSoundEnabled) {
                    playNotificationSound()
                  }
                }}
              >
                {notificationSoundEnabled ? "Turn Off" : "Turn On"}
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={styles.noNotifications}>
                <div style={styles.noNotificationsIcon}>🔕</div>
                <h3>No new notifications</h3>
                <p>Admin ka koi naya update abhi nahi aaya hai.</p>
              </div>
            ) : (
              <div style={styles.notificationList}>
                {notifications.map((item) => (
                  <div key={item.id} style={styles.notificationItem}>
                    <div style={styles.notificationItemIcon}>
                      {item.icon}
                    </div>
                    <div style={styles.notificationItemContent}>
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <small>
                        {new Date(item.createdAt).toLocaleString()}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                style={styles.clearNotificationsButton}
                onClick={clearNotifications}
              >
                Clear Notifications
              </button>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}

      <footer style={styles.footer}>

        <p>
          © {new Date().getFullYear()}
          {" "}
          J. Solution Classes.
          {" "}
          All Rights Reserved.
        </p>

      </footer>

    </div>
  )
}



/* =====================================================
   SUMMARY CARD
===================================================== */

function SummaryCard({
  icon,
  label,
  value,
}) {

  return (

    <div style={styles.summaryCard}>

      <div style={styles.cardIcon}>
        {icon}
      </div>

      <div>

        <p style={styles.cardLabel}>
          {label}
        </p>

        <h3 style={styles.cardValue}>
          {value || "Not Available"}
        </h3>

      </div>

    </div>
  )
}



/* =====================================================
   PROFILE ITEM
===================================================== */

function ProfileItem({
  label,
  value,
  icon,
}) {

  return (

    <div style={styles.profileItem}>

      <div style={styles.profileIcon}>
        {icon}
      </div>

      <div>

        <p style={styles.profileLabel}>
          {label}
        </p>

        <p style={styles.profileValue}>
          {value || "Not Available"}
        </p>

      </div>

    </div>
  )
}



/* =====================================================
   SERVICE CARD
===================================================== */

function ServiceCard({
  icon,
  title,
  text,
  onClick,
}) {

  return (

    <button
      style={styles.serviceCard}
      onClick={onClick}
    >

      <div style={styles.serviceIcon}>
        {icon}
      </div>

      <div style={styles.serviceContent}>

        <h3>
          {title}
        </h3>

        <p>
          {text}
        </p>

      </div>

      <div style={styles.arrow}>
        →
      </div>

    </button>
  )
}



/* =====================================================
   STYLES
===================================================== */

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    color: "#1f2937",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },


  header: {
    minHeight: "72px",
    background: "#ffffff",
    borderBottom:
      "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 32px",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },


  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },


  logo: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
  },


  logoTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "800",
  },


  logoSubtitle: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "#6b7280",
  },


  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },


  headerNotificationButton: {
    position: "relative",
    width: "42px",
    height: "42px",
    border: "1px solid #dbeafe",
    borderRadius: "12px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },


  headerBell: {
    fontSize: "21px",
  },


  headerNotificationBadge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
    minWidth: "21px",
    height: "21px",
    padding: "0 5px",
    borderRadius: "999px",
    background: "#ef4444",
    color: "#ffffff",
    border: "2px solid #ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "800",
  },


  studentMini: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },


  miniAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },


  logoutButton: {
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "10px 18px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },


  main: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "32px 20px 50px",
  },


  welcomeCard: {
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    borderRadius: "18px",
    padding: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },


  welcomeSmall: {
    margin: "0 0 6px",
    fontSize: "14px",
  },


  welcomeTitle: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
  },


  welcomeText: {
    margin: "8px 0 0",
    fontSize: "14px",
  },


  approvedBadge: {
    background:
      "rgba(255,255,255,0.16)",
    border:
      "1px solid rgba(255,255,255,0.3)",
    padding: "10px 15px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },


  cardGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
    marginTop: "24px",
  },


  summaryCard: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },


  cardIcon: {
    width: "46px",
    height: "46px",
    borderRadius: "12px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
  },


  cardLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: "12px",
  },


  cardValue: {
    margin: "5px 0 0",
    fontSize: "17px",
    fontWeight: "800",
  },


  section: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "16px",
    marginTop: "24px",
    padding: "24px",
  },


  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "22px",
  },


  sectionTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: "800",
  },


  sectionSubtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#6b7280",
  },


  profileHeaderActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  editProfileButton: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    color: "#1d4ed8",
    padding: "8px 12px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "12px",
  },

  profileEditModal: {
    position: "relative",
    width: "100%",
    maxWidth: "520px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },

  profileLockedBox: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "10px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    fontSize: "12px",
    lineHeight: "1.6",
  },

  profileMessage: {
    marginTop: "14px",
    padding: "11px 12px",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "600",
  },

  profileStatus: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },


  profileGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "15px",
  },


  profileItem: {
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },


  profileIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
  },


  profileLabel: {
    margin: 0,
    fontSize: "11px",
    color: "#6b7280",
  },


  profileValue: {
    margin: "4px 0 0",
    fontSize: "14px",
    fontWeight: "700",
    wordBreak: "break-word",
  },


  serviceGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
  },


  serviceCard: {
    width: "100%",
    border:
      "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: "13px",
    padding: "18px",
    display: "flex",
    alignItems: "center",
    gap: "13px",
    textAlign: "left",
    cursor: "pointer",
  },


  serviceIcon: {
    width: "45px",
    height: "45px",
    borderRadius: "11px",
    background: "#eff6ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "21px",
  },


  serviceContent: {
    flex: 1,
  },


  arrow: {
    fontSize: "22px",
    color: "#9ca3af",
  },


  locationCard: {
    marginTop: "24px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "16px",
    padding: "22px",
  },


  locationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },


  locationTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "800",
  },


  locationText: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },


  locationBadge: {
    padding: "7px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
  },


  locationStatus: {
    marginTop: "15px",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "600",
  },


  locationError: {
    marginTop: "15px",
    color: "#dc2626",
    background: "#fef2f2",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
  },


  locationDetails: {
    marginTop: "15px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
    fontSize: "12px",
    color: "#4b5563",
  },


  mapButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "9px 13px",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: "700",
  },


  locationAutoMessage: {
    marginTop: "14px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: "700",
  },

  locationActions: {
    marginTop: "16px",
  },


  locationStartButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "11px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },


  locationStopButton: {
    border: "none",
    background: "#fee2e2",
    color: "#dc2626",
    padding: "11px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },


  locationNote: {
    margin: "13px 0 0",
    fontSize: "11px",
    color: "#6b7280",
    lineHeight: "1.5",
  },


  infoCard: {
    marginTop: "24px",
    background: "#ecfdf5",
    border:
      "1px solid #bbf7d0",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    gap: "15px",
  },


  infoIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#22c55e",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
  },


  infoTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "800",
  },


  infoText: {
    margin: "7px 0 12px",
    color: "#166534",
    fontSize: "13px",
    lineHeight: "1.6",
  },


  infoDetails: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px 22px",
    fontSize: "12px",
    color: "#166534",
  },


  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
    overflowY: "auto",
  },

  resultsModal: {
    position: "relative",
    width: "100%",
    maxWidth: "620px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },

  resultStudentBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "18px",
    fontSize: "13px",
  },

  resultsList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  resultCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "18px",
    background: "#ffffff",
  },

  resultTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
  },

  resultExam: {
    margin: 0,
    fontSize: "17px",
    fontWeight: "800",
  },

  resultId: {
    margin: "5px 0 0",
    fontSize: "11px",
    color: "#6b7280",
  },

  percentageBadge: {
    minWidth: "75px",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "#dcfce7",
    color: "#15803d",
    textAlign: "center",
    fontSize: "20px",
    fontWeight: "900",
  },

  resultDetails: {
    marginTop: "15px",
    paddingTop: "14px",
    borderTop: "1px solid #e5e7eb",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  resultLabel: {
    display: "block",
    marginBottom: "4px",
    fontSize: "11px",
    color: "#6b7280",
  },

  emptyResultBox: {
    padding: "35px 15px",
    borderRadius: "14px",
    background: "#f9fafb",
    textAlign: "center",
    color: "#4b5563",
  },

  resultErrorBox: {
    padding: "15px",
    borderRadius: "12px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  resultAnalyticsBox: {
    marginBottom: "18px",
    padding: "16px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #eff6ff, #f5f3ff)",
    border: "1px solid #dbeafe",
  },
  analyticsHeader: {
    marginBottom: "13px",
  },
  analyticsTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
  },
  analyticsSubtitle: {
    margin: "4px 0 0",
    fontSize: "11px",
    color: "#6b7280",
  },
  analyticsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "10px",
  },
  analyticsCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "11px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  analyticsIcon: {
    fontSize: "17px",
  },
  analyticsLabel: {
    fontSize: "10px",
    color: "#6b7280",
    fontWeight: "600",
  },
  analyticsValue: {
    fontSize: "17px",
    color: "#1d4ed8",
  },
  certificateActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "12px",
  },

  certificateDownload: {
    display: "inline-block",
    textDecoration: "none",
    background: "#15803d",
    color: "#ffffff",
    padding: "8px 12px",
    borderRadius: "7px",
    fontSize: "13px",
    fontWeight: "700",
  },

  studyMaterialCard: {
    border: "1px solid #e5e7eb", borderRadius: "14px", padding: "18px", background: "#ffffff", display: "flex", gap: "14px",
  },
  studyMaterialIcon: {
    width: "45px", height: "45px", borderRadius: "11px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "21px", flexShrink: 0,
  },
  studyMaterialTitle: { margin: 0, fontSize: "17px", fontWeight: "800", color: "#1f2937" },
  studyMaterialLine: { margin: "6px 0 0", fontSize: "13px", color: "#4b5563" },
  studyMaterialDescription: { margin: "10px 0 0", fontSize: "13px", color: "#6b7280", lineHeight: "1.5" },
  studyMaterialStatus: { display: "inline-block", marginTop: "10px", padding: "4px 9px", borderRadius: "999px", background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: "700" },
  studyMaterialActions: { display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" },
  studyMaterialButton: { display: "inline-block", textDecoration: "none", background: "#2563eb", color: "#ffffff", padding: "9px 13px", borderRadius: "8px", fontSize: "13px", fontWeight: "700" },

  paymentModal: {
    position: "relative",
    width: "100%",
    maxWidth: "500px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },

  closeModal: {
    position: "absolute",
    top: "12px",
    right: "15px",
    width: "35px",
    height: "35px",
    border: "none",
    borderRadius: "50%",
    background: "#f3f4f6",
    fontSize: "25px",
    cursor: "pointer",
  },

  paymentTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
  },

  paymentSubtitle: {
    margin: "5px 0 20px",
    color: "#6b7280",
    fontSize: "13px",
  },

  paymentStudentBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "12px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    marginBottom: "18px",
    fontSize: "13px",
  },

  paymentLabel: {
    display: "block",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "7px",
    marginTop: "14px",
  },

  paymentInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "9px",
    fontSize: "14px",
    outline: "none",
  },

  qrBox: {
    marginTop: "20px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "15px",
    padding: "18px",
    textAlign: "center",
  },

  qrTitle: {
    margin: "0 0 15px",
    fontWeight: "800",
  },

  qrPlaceholder: {
    height: "190px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    fontSize: "13px",
  },

  upiText: {
    margin: "15px 0 0",
    fontSize: "12px",
    color: "#4b5563",
  },

  paySubmitButton: {
    width: "100%",
    marginTop: "20px",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
    cursor: "pointer",
  },

  paymentMessage: {
    marginTop: "15px",
    padding: "12px",
    borderRadius: "9px",
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    color: "#166534",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  paymentNote: {
    margin: "15px 0 0",
    fontSize: "11px",
    color: "#6b7280",
    lineHeight: "1.5",
  },

  footer: {
    borderTop:
      "1px solid #e5e7eb",
    background: "#ffffff",
    textAlign: "center",
    padding: "22px",
    color: "#6b7280",
    fontSize: "12px",
  },


  loadingPage: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },


  loadingBox: {
    background: "#ffffff",
    padding: "35px",
    borderRadius: "16px",
    textAlign: "center",
  },


  spinner: {
    width: "35px",
    height: "35px",
    border:
      "4px solid #e5e7eb",
    borderTop:
      "4px solid #2563eb",
    borderRadius: "50%",
    margin: "0 auto 15px",
  },


  errorPage: {
    minHeight: "100vh",
    background: "#f5f7fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },


  errorBox: {
    background: "#ffffff",
    width: "100%",
    maxWidth: "450px",
    padding: "35px",
    borderRadius: "16px",
    textAlign: "center",
  },


  errorIcon: {
    fontSize: "45px",
  },


  loginButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "11px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    marginTop: "12px",
  },

  notificationButton: {
    position: "relative",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#dc2626",
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "20px",
  },

  notificationBadge: {
    position: "absolute",
    top: "-7px",
    right: "-7px",
    minWidth: "20px",
    height: "20px",
    padding: "0 5px",
    borderRadius: "999px",
    background: "#dc2626",
    color: "#ffffff",
    fontSize: "11px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid #ffffff",
  },

  notificationModal: {
    width: "100%",
    maxWidth: "620px",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow: "0 25px 70px rgba(15,23,42,0.25)",
  },

  notificationHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "15px",
    marginBottom: "18px",
  },

  notificationTitle: {
    margin: 0,
    color: "#111827",
  },

  notificationSubtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  notificationSoundRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: "13px",
    marginBottom: "16px",
  },

  soundToggleButton: {
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    padding: "7px 11px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
  },

  noNotifications: {
    textAlign: "center",
    padding: "45px 20px",
    color: "#6b7280",
  },

  noNotificationsIcon: {
    fontSize: "48px",
    marginBottom: "10px",
  },

  notificationList: {
    display: "grid",
    gap: "10px",
  },

  notificationItem: {
    display: "flex",
    gap: "12px",
    padding: "14px",
    borderRadius: "13px",
    border: "1px solid #fee2e2",
    background: "#fff7f7",
  },

  notificationItemIcon: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    borderRadius: "10px",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
  },

  notificationItemContent: {
    minWidth: 0,
  },

  notificationItemContentP: {
    margin: "4px 0",
    color: "#4b5563",
    fontSize: "13px",
  },

  clearNotificationsButton: {
    marginTop: "16px",
    width: "100%",
    border: "1px solid #fecaca",
    background: "#ffffff",
    color: "#dc2626",
    padding: "10px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
  },

}


export default StudentHome