import { Card } from "@/components/ui/card"
import { Shield, AlertTriangle, Eye, TrendingUp } from "lucide-react"

interface Stats {
  helmetCount: number
  noHelmetCount: number
  totalDetections: number
  avgConfidence: number
}

interface DetectionStatsProps {
  stats: Stats
}

export default function DetectionStats({ stats }: DetectionStatsProps) {
  const statItems = [
    {
      label: "Helmets Detected",
      value: stats.helmetCount,
      icon: Shield,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "No Helmet",
      value: stats.noHelmetCount,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Total Detections",
      value: stats.totalDetections,
      icon: Eye,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Avg Confidence",
      value: `${stats.avgConfidence.toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ]

  return (
    <div className="space-y-3">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.label} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
              </div>
              <div className={`${item.bgColor} p-2 rounded-lg`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
