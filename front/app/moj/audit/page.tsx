"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RoleSidebar } from "@/components/role-sidebar"
import {
    FileText,
    ArrowLeft,
    Search,
    History,
    User,
    Clock,
    CheckCircle,
    XCircle,
    Scale,
    Languages,
    Globe,
    Award,
    Filter
} from "lucide-react"
import Link from "next/link"

interface AuditEntry {
    id: string
    timestamp: string
    action: string
    actor: string
    actorRole: string
    documentID: string
    details: string
}

// Mock audit trail data
const mockAuditTrail: AuditEntry[] = [
    {
        id: "LOG-001",
        timestamp: "2024-12-12T14:30:00Z",
        action: "MOJ_APPROVE",
        actor: "MOJ-OFFICER-001",
        actorRole: "MoJ Officer",
        documentID: "DOC-ABC",
        details: "Translation approved by MoJ"
    },
    {
        id: "LOG-002",
        timestamp: "2024-12-12T12:00:00Z",
        action: "QA_APPROVE",
        actor: "QA-001",
        actorRole: "QA Officer",
        documentID: "DOC-ABC",
        details: "QA approved translation TL-001"
    },
    {
        id: "LOG-003",
        timestamp: "2024-12-12T10:00:00Z",
        action: "TRANSLATION_SUBMIT",
        actor: "TRANS-001",
        actorRole: "Translator",
        documentID: "DOC-ABC",
        details: "Translation submitted for QA review"
    },
    {
        id: "LOG-004",
        timestamp: "2024-12-11T16:00:00Z",
        action: "MOJ_REJECT",
        actor: "MOJ-OFFICER-002",
        actorRole: "MoJ Officer",
        documentID: "DOC-DEF",
        details: "Translation rejected: terminology issues"
    },
    {
        id: "LOG-005",
        timestamp: "2024-12-11T14:00:00Z",
        action: "TRANSLATOR_ASSIGN",
        actor: "SYSTEM",
        actorRole: "System",
        documentID: "DOC-GHI",
        details: "Assigned to translator TRANS-002"
    },
    {
        id: "LOG-006",
        timestamp: "2024-12-11T11:00:00Z",
        action: "DOCUMENT_REGISTER",
        actor: "CITIZEN-123",
        actorRole: "Client",
        documentID: "DOC-GHI",
        details: "New document registered for translation"
    },
    {
        id: "LOG-007",
        timestamp: "2024-12-10T15:00:00Z",
        action: "LEGALIZATION_COMPLETE",
        actor: "MOFA-001",
        actorRole: "MoFA Officer",
        documentID: "DOC-JKL",
        details: "Step 2 legalization completed"
    },
    {
        id: "LOG-008",
        timestamp: "2024-12-10T09:00:00Z",
        action: "APOSTILLE_ISSUE",
        actor: "COMP-AUTH-001",
        actorRole: "Competent Authority",
        documentID: "DOC-MNO",
        details: "Apostille certificate issued"
    },
]

export default function MoJAuditPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [filterAction, setFilterAction] = useState<string | null>(null)

    const getActionIcon = (action: string) => {
        switch (action) {
            case "MOJ_APPROVE":
                return <CheckCircle className="h-4 w-4 text-green-400" />
            case "MOJ_REJECT":
                return <XCircle className="h-4 w-4 text-red-400" />
            case "QA_APPROVE":
                return <CheckCircle className="h-4 w-4 text-purple-400" />
            case "TRANSLATION_SUBMIT":
                return <Languages className="h-4 w-4 text-blue-400" />
            case "TRANSLATOR_ASSIGN":
                return <User className="h-4 w-4 text-amber-400" />
            case "DOCUMENT_REGISTER":
                return <FileText className="h-4 w-4 text-slate-400" />
            case "LEGALIZATION_COMPLETE":
                return <Globe className="h-4 w-4 text-green-400" />
            case "APOSTILLE_ISSUE":
                return <Award className="h-4 w-4 text-purple-400" />
            default:
                return <History className="h-4 w-4 text-slate-400" />
        }
    }

    const getActionBadge = (action: string) => {
        const map: Record<string, { color: string; label: string }> = {
            "MOJ_APPROVE": { color: "bg-green-500/20 text-green-400", label: "MoJ Approve" },
            "MOJ_REJECT": { color: "bg-red-500/20 text-red-400", label: "MoJ Reject" },
            "QA_APPROVE": { color: "bg-purple-500/20 text-purple-400", label: "QA Approve" },
            "TRANSLATION_SUBMIT": { color: "bg-blue-500/20 text-blue-400", label: "Translation" },
            "TRANSLATOR_ASSIGN": { color: "bg-amber-500/20 text-amber-400", label: "Assignment" },
            "DOCUMENT_REGISTER": { color: "bg-slate-500/20 text-slate-400", label: "Register" },
            "LEGALIZATION_COMPLETE": { color: "bg-green-500/20 text-green-400", label: "Legalization" },
            "APOSTILLE_ISSUE": { color: "bg-purple-500/20 text-purple-400", label: "Apostille" },
        }
        const config = map[action] || { color: "bg-slate-500/20 text-slate-400", label: action }
        return <Badge className={config.color}>{config.label}</Badge>
    }

    const filteredLogs = mockAuditTrail.filter(entry => {
        const matchesSearch =
            entry.documentID.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.details.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilter = !filterAction || entry.action === filterAction

        return matchesSearch && matchesFilter
    })

    const actionTypes = [...new Set(mockAuditTrail.map(e => e.action))]

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/moj" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Audit Trail</h1>
                    <p className="text-slate-400">Complete history of all document actions</p>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search by document ID, actor, or details..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-slate-800 border-slate-700 text-white"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={filterAction === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilterAction(null)}
                            className={filterAction === null ? "bg-amber-600" : "border-slate-600"}
                        >
                            All
                        </Button>
                        {actionTypes.slice(0, 4).map(action => (
                            <Button
                                key={action}
                                variant={filterAction === action ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilterAction(filterAction === action ? null : action)}
                                className={filterAction === action ? "bg-amber-600" : "border-slate-600 text-slate-300"}
                            >
                                {action.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Audit Log */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <History className="h-5 w-5 text-amber-400" />
                            Activity Log
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            {filteredLogs.length} entries found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {filteredLogs.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                                >
                                    {/* Timeline connector */}
                                    <div className="flex flex-col items-center">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                                            {getActionIcon(entry.action)}
                                        </div>
                                        {index < filteredLogs.length - 1 && (
                                            <div className="w-0.5 h-8 bg-slate-700 mt-1" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {getActionBadge(entry.action)}
                                            <span className="text-white font-medium">{entry.documentID}</span>
                                        </div>
                                        <p className="text-sm text-slate-300 mt-1">{entry.details}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {entry.actor} ({entry.actorRole})
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(entry.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </RoleSidebar>
    )
}
