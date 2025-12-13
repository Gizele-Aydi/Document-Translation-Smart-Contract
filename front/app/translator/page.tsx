"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import {
    Languages,
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    Award,
    XCircle
} from "lucide-react"
import Link from "next/link"

interface AssignedDocument {
    id: string
    type: string
    ownerID: string
    targetLanguage: string
    assignedAt: string
    deadline?: string
}

// Mock data
const mockAssignedDocuments: AssignedDocument[] = [
    { id: "DOC-004", type: "Diploma", ownerID: "CITIZEN-123", targetLanguage: "French", assignedAt: "2024-12-12T09:00:00Z", deadline: "2024-12-15T18:00:00Z" },
    { id: "DOC-005", type: "Birth Certificate", ownerID: "CITIZEN-456", targetLanguage: "English", assignedAt: "2024-12-11T14:30:00Z", deadline: "2024-12-14T18:00:00Z" },
]

const mockStats = {
    assigned: 2,
    completed: 15,
    rejected: 1,
    thisMonth: 8
}

export default function TranslatorDashboard() {
    const [userId, setUserId] = useState<string>("")

    useEffect(() => {
        const stored = localStorage.getItem("userId")
        if (stored) setUserId(stored)

        const role = localStorage.getItem("userRole")
        if (role !== "translator") {
            window.location.href = "/auth"
        }
    }, [])

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Translator Dashboard</h1>
                    <p className="text-slate-400">Manage your translation assignments</p>
                </div>

                {/* License Status */}
                <Card className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border-purple-500/30 mb-8">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500">
                                    <Award className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold">Sworn Translator License</p>
                                    <p className="text-purple-300 text-sm">Valid until December 2025</p>
                                </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                                    <Clock className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.assigned}</p>
                                    <p className="text-xs text-slate-400">Assigned</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.completed}</p>
                                    <p className="text-xs text-slate-400">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                                    <XCircle className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.rejected}</p>
                                    <p className="text-xs text-slate-400">Rejected (QA)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Languages className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.thisMonth}</p>
                                    <p className="text-xs text-slate-400">This Month</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Assigned Documents */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-white">Assigned Documents</CardTitle>
                                <CardDescription className="text-slate-400">Documents awaiting your translation</CardDescription>
                            </div>
                            <Link href="/translator/queue">
                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                    View Queue
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {mockAssignedDocuments.length === 0 ? (
                            <div className="text-center py-8">
                                <Languages className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No documents assigned</p>
                                <p className="text-sm text-slate-500">New assignments will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mockAssignedDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                                                <FileText className="h-5 w-5 text-purple-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{doc.id}</p>
                                                <p className="text-sm text-slate-400">{doc.type} → {doc.targetLanguage}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {doc.deadline && (
                                                <div className="text-right hidden md:block">
                                                    <p className="text-xs text-slate-500">Deadline</p>
                                                    <p className="text-sm text-amber-400">
                                                        {new Date(doc.deadline).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            )}
                                            <Link href={`/translator/submit?doc=${doc.id}`}>
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                                    Translate
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RoleSidebar>
    )
}
