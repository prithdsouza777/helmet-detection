"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play, Square } from "lucide-react"
import { useState } from "react"

interface ControlPanelProps {
  isRunning: boolean
  onToggle: () => void
  confidenceThreshold: number
  onThresholdChange: (value: number) => void
  backendUrl: string
  onBackendUrlChange: (url: string) => void
}

export default function ControlPanel({
  isRunning,
  onToggle,
  confidenceThreshold,
  onThresholdChange,
  backendUrl,
  onBackendUrlChange,
}: ControlPanelProps) {
  const [isEditingUrl, setIsEditingUrl] = useState(false)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Controls</h3>

      <div className="space-y-3">
        <Button onClick={onToggle} className="w-full" variant={isRunning ? "destructive" : "default"}>
          {isRunning ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop Detection
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start Detection
            </>
          )}
        </Button>

        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-3">Settings</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Confidence Threshold</label>
              <input
                type="range"
                min="0"
                max="100"
                value={confidenceThreshold}
                onChange={(e) => onThresholdChange(Number(e.target.value))}
                className="w-full mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{confidenceThreshold}%</p>
            </div>

            <div className="pt-3 border-t border-border">
              <label className="text-sm text-muted-foreground">Backend URL</label>
              {isEditingUrl ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={backendUrl}
                    onChange={(e) => onBackendUrlChange(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded"
                    placeholder="http://localhost:5000"
                  />
                  <Button size="sm" onClick={() => setIsEditingUrl(false)} className="text-xs">
                    Done
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingUrl(true)}
                  className="mt-2 p-2 bg-muted rounded text-xs cursor-pointer hover:bg-muted/80"
                >
                  {backendUrl}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <p className="text-xs text-muted-foreground">
          <strong>Backend Status:</strong> Make sure your Python Flask backend is running on {backendUrl}
        </p>
      </div>
    </Card>
  )
}
