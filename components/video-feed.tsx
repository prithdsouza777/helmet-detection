"use client"

import { useRef, useEffect, useState } from "react"
import { AlertCircle } from "lucide-react"

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
  detections: Detection[]
  onDetectionsUpdate: (detections: Detection[]) => void
  confidenceThreshold: number
  backendUrl: string
}

export default function VideoFeed({
  isRunning,
  detections,
  onDetectionsUpdate,
  confidenceThreshold,
  backendUrl,
}: VideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
    if (!hasPermission || !videoRef.current || !isRunning) return

    const captureAndSendFrame = async () => {
      const video = videoRef.current
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) return

      try {
        // Create temporary canvas to capture frame
        const tempCanvas = document.createElement("canvas")
        tempCanvas.width = video.videoWidth
        tempCanvas.height = video.videoHeight
        const ctx = tempCanvas.getContext("2d")
        if (!ctx) return

        ctx.drawImage(video, 0, 0)

        // Convert to blob and send to backend
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

              if (!response.ok) throw new Error("Backend error")

              const data = await response.json()
              onDetectionsUpdate(data.detections || [])
            } catch (err) {
              console.error("[v0] Backend error:", err)
            }
          },
          "image/jpeg",
          0.8,
        )
      } catch (err) {
        console.error("[v0] Frame capture error:", err)
      }
    }

    // Send frames every 100ms (10 FPS)
    frameIntervalRef.current = setInterval(captureAndSendFrame, 100)

    return () => {
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current)
    }
  }, [hasPermission, isRunning, confidenceThreshold, backendUrl, onDetectionsUpdate])

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

      // Draw detections
      detections.forEach((detection) => {
        const { x1, y1, x2, y2, label, confidence } = detection
        const isHelmet = label === "helmet"
        const color = isHelmet ? "#22c55e" : "#ef4444"

        // Draw bounding box
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

        // Draw label background
        const labelText = `${label} ${(confidence * 100).toFixed(1)}%`
        ctx.font = "bold 14px Arial"
        const textMetrics = ctx.measureText(labelText)
        const textHeight = 20

        ctx.fillStyle = color
        ctx.fillRect(x1, y1 - textHeight, textMetrics.width + 8, textHeight)

        // Draw label text
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
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-white">{error}</p>
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
