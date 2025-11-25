"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import VideoFeed from "@/components/video-feed"
import ControlPanel from "@/components/control-panel"

export default function Home() {
  const [isRunning, setIsRunning] = useState(false)
  const [confidenceThreshold, setConfidenceThreshold] = useState(75)
  const [backendUrl, setBackendUrl] = useState("http://localhost:5000")

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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <VideoFeed isRunning={isRunning} confidenceThreshold={confidenceThreshold} backendUrl={backendUrl} />
            </Card>
          </div>

          <div>
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
