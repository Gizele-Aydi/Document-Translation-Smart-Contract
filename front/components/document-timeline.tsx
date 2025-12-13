"use client"

import { Badge } from "@/components/ui/badge"
import {
    CheckCircle,
    Circle,
    Clock,
    FileText,
    Languages,
    Scale,
    Globe,
    Award,
    XCircle
} from "lucide-react"

interface TimelineStep {
    status: string
    label: string
    timestamp?: string
    actor?: string
    isCompleted: boolean
    isCurrent: boolean
    isRejected?: boolean
}

interface DocumentTimelineProps {
    currentStatus: string
    statusHistory?: {
        status: string
        timestamp: string
        actor?: string
    }[]
}

const statusSteps = [
    { status: "SUBMITTED", label: "Submitted", icon: FileText },
    { status: "IN_TRANSLATION", label: "In Translation", icon: Languages },
    { status: "TRANSLATED", label: "Translated", icon: Languages },
    { status: "QA_COMPLETED", label: "QA Completed", icon: CheckCircle },
    { status: "MOJ_APPROVED", label: "MoJ Approved", icon: Scale },
    { status: "IN_LEGALIZATION", label: "In Legalization", icon: Globe },
    { status: "APOSTILLED", label: "Apostilled", icon: Award },
    { status: "FINALIZED", label: "Finalized", icon: CheckCircle },
]

const rejectedStatuses = ["REQUIRES_RESUBMISSION", "MOJ_REJECTED"]

const statusIndex: Record<string, number> = {
    "SUBMITTED": 0,
    "IN_TRANSLATION": 1,
    "TRANSLATED": 2,
    "QA_COMPLETED": 3,
    "REQUIRES_RESUBMISSION": 2, // Goes back to translation
    "MOJ_APPROVED": 4,
    "MOJ_REJECTED": 3, // Goes back to QA
    "IN_LEGALIZATION": 5,
    "LEGALIZED": 5,
    "APOSTILLED": 6,
    "FINALIZED": 7,
}

export function DocumentTimeline({ currentStatus, statusHistory }: DocumentTimelineProps) {
    const currentIndex = statusIndex[currentStatus] ?? 0
    const isRejected = rejectedStatuses.includes(currentStatus)

    const getStepState = (stepIndex: number, stepStatus: string): TimelineStep => {
        const historyEntry = statusHistory?.find(h => h.status === stepStatus)

        return {
            status: stepStatus,
            label: statusSteps[stepIndex].label,
            timestamp: historyEntry?.timestamp,
            actor: historyEntry?.actor,
            isCompleted: stepIndex < currentIndex,
            isCurrent: stepIndex === currentIndex,
            isRejected: isRejected && stepIndex === currentIndex,
        }
    }

    return (
        <div className="w-full">
            {/* Rejection Banner */}
            {isRejected && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 text-red-400">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                            {currentStatus === "REQUIRES_RESUBMISSION"
                                ? "Translation requires resubmission"
                                : "Rejected by Ministry of Justice"}
                        </span>
                    </div>
                </div>
            )}

            {/* Timeline */}
            <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />
                <div
                    className="absolute left-4 top-0 w-0.5 bg-gradient-to-b from-green-500 to-green-400 transition-all duration-500"
                    style={{
                        height: `${Math.min(100, ((currentIndex + 1) / statusSteps.length) * 100)}%`
                    }}
                />

                {/* Steps */}
                <div className="space-y-4">
                    {statusSteps.map((step, index) => {
                        const state = getStepState(index, step.status)
                        const Icon = step.icon

                        return (
                            <div key={step.status} className="relative flex items-start gap-4 pl-10">
                                {/* Circle indicator */}
                                <div
                                    className={`
                    absolute left-2 w-5 h-5 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${state.isCompleted
                                            ? "bg-green-500"
                                            : state.isCurrent
                                                ? state.isRejected
                                                    ? "bg-red-500 ring-4 ring-red-500/20"
                                                    : "bg-blue-500 ring-4 ring-blue-500/20"
                                                : "bg-slate-700"
                                        }
                  `}
                                >
                                    {state.isCompleted ? (
                                        <CheckCircle className="h-3 w-3 text-white" />
                                    ) : state.isCurrent ? (
                                        state.isRejected ? (
                                            <XCircle className="h-3 w-3 text-white" />
                                        ) : (
                                            <Clock className="h-3 w-3 text-white animate-pulse" />
                                        )
                                    ) : (
                                        <Circle className="h-3 w-3 text-slate-500" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className={`flex-1 pb-4 ${index === statusSteps.length - 1 ? 'pb-0' : ''}`}>
                                    <div className="flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${state.isCompleted
                                                ? "text-green-400"
                                                : state.isCurrent
                                                    ? state.isRejected ? "text-red-400" : "text-blue-400"
                                                    : "text-slate-500"
                                            }`} />
                                        <span className={`font-medium ${state.isCompleted
                                                ? "text-white"
                                                : state.isCurrent
                                                    ? "text-white"
                                                    : "text-slate-500"
                                            }`}>
                                            {state.label}
                                        </span>
                                        {state.isCurrent && !state.isRejected && (
                                            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-xs">
                                                Current
                                            </Badge>
                                        )}
                                        {state.isRejected && (
                                            <Badge variant="destructive" className="text-xs">
                                                Action Required
                                            </Badge>
                                        )}
                                    </div>

                                    {state.timestamp && (
                                        <p className="mt-1 text-xs text-slate-400">
                                            {new Date(state.timestamp).toLocaleString()}
                                            {state.actor && ` • ${state.actor}`}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// Compact horizontal timeline for cards
export function DocumentTimelineCompact({ currentStatus }: { currentStatus: string }) {
    const currentIndex = statusIndex[currentStatus] ?? 0
    const isRejected = rejectedStatuses.includes(currentStatus)

    return (
        <div className="flex items-center gap-1">
            {statusSteps.slice(0, 5).map((step, index) => (
                <div
                    key={step.status}
                    className={`
            h-1.5 flex-1 rounded-full transition-colors
            ${index < currentIndex
                            ? "bg-green-500"
                            : index === currentIndex
                                ? isRejected ? "bg-red-500" : "bg-blue-500"
                                : "bg-slate-700"
                        }
          `}
                />
            ))}
        </div>
    )
}
