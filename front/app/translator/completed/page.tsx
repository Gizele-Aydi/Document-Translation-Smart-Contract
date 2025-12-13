"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import {
    FileText,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Eye,
    Languages,
    Download
} from "lucide-react"
import Link from "next/link"

interface CompletedTranslation {
    id: string
    documentID: string
    documentType: string
    targetLanguage: string
    completedAt: string
    status: "QA_APPROVED" | "QA_REJECTED" | "PENDING_QA"
    qaFeedback?: string
}

// Mock data
const mockCompleted: CompletedTranslation[] = [
    {
        id: "TL-001",
        documentID: "DOC-ABC",
        documentType: "Diploma",
        targetLanguage: "French",
        completedAt: "2024-12-11T14:30:00Z",
        status: "QA_APPROVED"
    },
    {
        id: "TL-002",
        documentID: "DOC-DEF",
        documentType: "Birth Certificate",
        targetLanguage: "English",
        completedAt: "2024-12-10T10:00:00Z",
        status: "QA_REJECTED",
        qaFeedback: "Minor terminology issues in legal terms section. Please review and resubmit."
    },
    {
        id: "TL-003",
        documentID: "DOC-GHI",
        documentType: "Contract",
        targetLanguage: "Arabic",
        completedAt: "2024-12-09T16:00:00Z",
        status: "QA_APPROVED"
    },
    {
        id: "TL-004",
        documentID: "DOC-JKL",
        documentType: "Medical Record",
        targetLanguage: "French",
        completedAt: "2024-12-12T11:00:00Z",
        status: "PENDING_QA"
    },
]

export default function TranslatorCompletedPage() {
    const [translations] = useState(mockCompleted)
    const [filter, setFilter] = useState<"all" | "approved" | "rejected" | "pending">("all")

    const filtered = translations.filter(t => {
        if (filter === "all") return true
        if (filter === "approved") return t.status === "QA_APPROVED"
        if (filter === "rejected") return t.status === "QA_REJECTED"
        if (filter === "pending") return t.status === "PENDING_QA"
        return true
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "QA_APPROVED":
                return <Badge className="bg-green-500/20 text-green-400">Approved</Badge>
            case "QA_REJECTED":
                return <Badge className="bg-red-500/20 text-red-400">Rejected</Badge>
            case "PENDING_QA":
                return <Badge className="bg-amber-500/20 text-amber-400">Pending QA</Badge>
            default:
                return null
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "QA_APPROVED":
                return <CheckCircle className="h-5 w-5 text-green-400" />
            case "QA_REJECTED":
                return <XCircle className="h-5 w-5 text-red-400" />
            default:
                return <FileText className="h-5 w-5 text-amber-400" />
        }
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/translator" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Completed Translations</h1>
                    <p className="text-slate-400">View your submitted translations and their QA status</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card
                        className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-colors ${filter === "all" ? "ring-2 ring-purple-500" : ""}`}
                        onClick={() => setFilter("all")}
                    >
                        <CardContent className="p-4">
                            <p className="text-2xl font-bold text-white">{translations.length}</p>
                            <p className="text-xs text-slate-400">Total</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-colors ${filter === "approved" ? "ring-2 ring-green-500" : ""}`}
                        onClick={() => setFilter("approved")}
                    >
                        <CardContent className="p-4">
                            <p className="text-2xl font-bold text-green-400">
                                {translations.filter(t => t.status === "QA_APPROVED").length}
                            </p>
                            <p className="text-xs text-slate-400">Approved</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-colors ${filter === "rejected" ? "ring-2 ring-red-500" : ""}`}
                        onClick={() => setFilter("rejected")}
                    >
                        <CardContent className="p-4">
                            <p className="text-2xl font-bold text-red-400">
                                {translations.filter(t => t.status === "QA_REJECTED").length}
                            </p>
                            <p className="text-xs text-slate-400">Rejected</p>
                        </CardContent>
                    </Card>

                    <Card
                        className={`bg-slate-800/50 border-slate-700 cursor-pointer transition-colors ${filter === "pending" ? "ring-2 ring-amber-500" : ""}`}
                        onClick={() => setFilter("pending")}
                    >
                        <CardContent className="p-4">
                            <p className="text-2xl font-bold text-amber-400">
                                {translations.filter(t => t.status === "PENDING_QA").length}
                            </p>
                            <p className="text-xs text-slate-400">Pending</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Translations List */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Translation History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filtered.map((translation) => (
                                <div
                                    key={translation.id}
                                    className={`p-4 rounded-lg bg-slate-900/50 border ${translation.status === "QA_REJECTED"
                                            ? "border-red-500/30"
                                            : "border-slate-700"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${translation.status === "QA_APPROVED" ? "bg-green-500/20" :
                                                    translation.status === "QA_REJECTED" ? "bg-red-500/20" :
                                                        "bg-amber-500/20"
                                                }`}>
                                                {getStatusIcon(translation.status)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-white">{translation.id}</p>
                                                    {getStatusBadge(translation.status)}
                                                </div>
                                                <p className="text-sm text-slate-400">
                                                    {translation.documentType} • {translation.documentID}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-500 hidden md:block">
                                                {new Date(translation.completedAt).toLocaleDateString()}
                                            </p>
                                            <Button variant="outline" size="sm" className="border-slate-600">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {translation.status === "QA_APPROVED" && (
                                                <Button variant="outline" size="sm" className="border-green-600 text-green-400">
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {translation.status === "QA_REJECTED" && (
                                                <Link href={`/translator/submit?doc=${translation.documentID}`}>
                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                                        Resubmit
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* QA Feedback for rejected */}
                                    {translation.status === "QA_REJECTED" && translation.qaFeedback && (
                                        <div className="mt-3 p-3 rounded bg-red-500/10 border border-red-500/20">
                                            <p className="text-sm text-red-400">
                                                <strong>QA Feedback:</strong> {translation.qaFeedback}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </RoleSidebar>
    )
}
