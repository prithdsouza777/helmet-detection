"use client"

import { useRef, useEffect, useState } from "react"
import { AlertCircle, Loader2 } from "lucide-react"

interface Detection {
  x1: number
  y1: number
  x2: number
  y2: number
  label: string
  confidence: number
}

interface VideoFeedProps {
  isRunning: boolean
  confidenceThreshold: number
  backendUrl: string
}

export default function VideoFeed({ isRunning, confidenceThreshold, backendUrl }: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const [backendStatus, setBackendStatus] = useState<"checking" | "ok" | "error">("checking")
  const [helmetDetected, setHelmetDetected] = useState(true)
  const [detections, setDetections] = useState<Detection[]>([])
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
    } catch (err) {
      console.error("[v0] Beep error:", err)
    }
  }

  useEffect(() => {
    const checkBackendHealth = async () => {
      try {
        setBackendStatus("checking")
        const response = await fetch(`${backendUrl}/health`, {
          method: "GET",
        })
        if (response.ok) {
          setBackendStatus("ok")
          setError(null)
        } else {
          setBackendStatus("error")
          setError("Backend returned an error. Check console for details.")
        }
      } catch (err) {
        setBackendStatus("error")
        setError(`Cannot connect to backend at ${backendUrl}. Make sure Flask is running.`)
        console.error("[v0] Backend health check failed:", err)
      }
    }

    if (isRunning) {
      checkBackendHealth()
      const healthInterval = setInterval(checkBackendHealth, 5000)
      return () => clearInterval(healthInterval)
    }
  }, [isRunning, backendUrl])

  useEffect(() => {
    if (!isRunning) return

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setHasPermission(true)
          setError(null)
        }
      } catch (err) {
        setError("Unable to access camera. Please check permissions.")
        setHasPermission(false)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [isRunning])

  useEffect(() => {
    if (!helmetDetected && isRunning) {
      beepIntervalRef.current = setInterval(() => {
        playBeep()
      }, 500)
    } else {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current)
      }
    }

    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current)
      }
    }
  }, [helmetDetected, isRunning])

  useEffect(() => {
    if (!hasPermission || !videoRef.current || !isRunning || backendStatus !== "ok") return

    const captureAndSendFrame = async () => {
      const video = videoRef.current
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return

      try {
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = video.videoWidth
        tempCanvas.height = video.videoHeight
        const ctx = tempCanvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(video, 0, 0)

        tempCanvas.toBlob(
          async (blob) => {
            if (!blob) return

            const formData = new FormData()
            formData.append("frame", blob)
            formData.append("confidence_threshold", confidenceThreshold.toString())

            try {
              const response = await fetch(`${backendUrl}/detect`, {
                method: "POST",
                body: formData,
              })

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Backend error: ${response.status}`)
              }

              const data = await response.json()
              const newDetections = data.detections || []
              setDetections(newDetections)

              const hasHelmet = newDetections.some((d: Detection) => d.label === "helmet")
              setHelmetDetected(hasHelmet)
            } catch (err) {
              console.error("[v0] Backend error:", err)
              setError(`Backend error: ${err instanceof Error ? err.message : "Unknown error"}`)
            }
          },
          "image/jpeg",
          0.8,
        )
      } catch (err) {
        console.error("[v0] Frame capture error:", err)
      }
    }

    frameIntervalRef.current = setInterval(captureAndSendFrame, 100)

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    }
  }, [hasPermission, isRunning, confidenceThreshold, backendUrl, backendStatus])

  useEffect(() => {
    if (!hasPermission || !canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawFrame = () => {
      const video = videoRef.current
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(drawFrame)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      detections.forEach((detection) => {
        const { x1, y1, x2, y2, label, confidence } = detection
        const isHelmet = label === "helmet"
        const color = isHelmet ? "#22c55e" : "#ef4444"

        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

        const labelText = `${label} ${(confidence * 100).toFixed(1)}%`
        ctx.font = "bold 14px Arial"
        const textMetrics = ctx.measureText(labelText)
        const textHeight = 20

        ctx.fillStyle = color
        ctx.fillRect(x1, y1 - textHeight, textMetrics.width + 8, textHeight)

        ctx.fillStyle = "#000"
        ctx.fillText(labelText, x1 + 4, y1 - 5)
      })

      requestAnimationFrame(drawFrame)
    }

    drawFrame()
  }, [detections, hasPermission])

  return (
    <div className="relative bg-black aspect-video flex items-center justify-center">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center max-w-sm px-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">Error</p>
            <p className="text-white/80 text-sm">{error}</p>
            <p className="text-white/60 text-xs mt-4">Check the browser console for more details</p>
          </div>
        </div>
      )}

      {backendStatus === "checking" && isRunning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
            <p className="text-white text-sm">Connecting to backend...</p>
          </div>
        </div>
      )}

      {!helmetDetected && isRunning && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="bg-red-600 text-white px-8 py-6 rounded-lg text-center animate-pulse">
            <p className="text-4xl font-bold">⚠️ PLEASE WEAR A HELMET</p>
            <p className="text-lg mt-2">Safety Alert - Helmet Not Detected</p>
          </div>
        </div>
      )}

      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {!isRunning && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <p className="text-white text-lg">Click "Start Detection" to begin</p>
        </div>
      )}
    </div>
  )
}
