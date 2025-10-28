"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import VideoFeed from "@/components/video-feed"
import DetectionStats from "@/components/detection-stats"
import ControlPanel from "@/components/control-panel"

export default function Home() {
  const [isRunning, setIsRunning] = useState(false)
  const [detections, setDetections] = useState<any[]>([])
  const [confidenceThreshold, setConfidenceThreshold] = useState(75)
  const [backendUrl, setBackendUrl] = useState("http://localhost:5000")
  const [stats, setStats] = useState({
    helmetCount: 0,
    noHelmetCount: 0,
    totalDetections: 0,
    avgConfidence: 0,
  })

  const handleDetectionsUpdate = (newDetections: any[]) => {
    setDetections(newDetections)

    const helmetCount = newDetections.filter((d) => d.label === "helmet").length
    const noHelmetCount = newDetections.filter((d) => d.label === "no_helmet").length
    const avgConfidence =
      newDetections.length > 0
        ? ((newDetections.reduce((sum, d) => sum + d.confidence, 0) / newDetections.length) * 100).toFixed(1)
        : 0

    setStats({
      helmetCount,
      noHelmetCount,
      totalDetections: newDetections.length,
      avgConfidence: Number.parseFloat(avgConfidence as string),
    })
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Helmet Detection</h1>
              <p className="text-muted-foreground mt-1">Real-time safety monitoring system</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
              <span className="text-sm font-medium">{isRunning ? "Live" : "Offline"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <VideoFeed
                isRunning={isRunning}
                detections={detections}
                onDetectionsUpdate={handleDetectionsUpdate}
                confidenceThreshold={confidenceThreshold}
                backendUrl={backendUrl}
              />
            </Card>
          </div>

          <div className="space-y-6">
            <DetectionStats stats={stats} />

            <ControlPanel
              isRunning={isRunning}
              onToggle={() => setIsRunning(!isRunning)}
              confidenceThreshold={confidenceThreshold}
              onThresholdChange={setConfidenceThreshold}
              backendUrl={backendUrl}
              onBackendUrlChange={setBackendUrl}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
