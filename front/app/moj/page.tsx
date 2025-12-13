"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Scale,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Users,
    ArrowRight,
    Eye,
    ThumbsUp,
    ThumbsDown
} from "lucide-react"
import Link from "next/link"

interface PendingDocument {
    id: string
    type: string
    translatorID: string
    translationID: string
    targetLanguage: string
    submittedAt: string
}

// Mock data
const mockPendingDocuments: PendingDocument[] = [
    { id: "DOC-006", type: "Diploma", translatorID: "TRANS-001", translationID: "TL-001", targetLanguage: "French", submittedAt: "2024-12-12T14:00:00Z" },
    { id: "DOC-007", type: "Contract", translatorID: "TRANS-002", translationID: "TL-002", targetLanguage: "Arabic", submittedAt: "2024-12-12T11:30:00Z" },
    { id: "DOC-008", type: "Birth Certificate", translatorID: "TRANS-001", translationID: "TL-003", targetLanguage: "English", submittedAt: "2024-12-11T16:00:00Z" },
]

const mockStats = {
    pendingReview: 3,
    approvedToday: 5,
    rejectedToday: 1,
    activeTranslators: 12
}

export default function MoJDashboard() {
    const [selectedDoc, setSelectedDoc] = useState<PendingDocument | null>(null)

    useEffect(() => {
        const role = localStorage.getItem("userRole")
        if (role !== "moj") {
            window.location.href = "/auth"
        }
    }, [])

    const handleApprove = (doc: PendingDocument) => {
        console.log("Approving:", doc.id)
        // In production: call smart contract mojApproveTranslation
    }

    const handleReject = (doc: PendingDocument) => {
        console.log("Rejecting:", doc.id)
        // In production: call smart contract rejectTranslation
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Ministry of Justice</h1>
                    <p className="text-slate-400">Review translations and manage legalization</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                    <Clock className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.pendingReview}</p>
                                    <p className="text-xs text-slate-400">Pending Review</p>
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
                                    <p className="text-2xl font-bold text-white">{mockStats.approvedToday}</p>
                                    <p className="text-xs text-slate-400">Approved Today</p>
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
                                    <p className="text-2xl font-bold text-white">{mockStats.rejectedToday}</p>
                                    <p className="text-xs text-slate-400">Rejected Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Users className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.activeTranslators}</p>
                                    <p className="text-xs text-slate-400">Active Translators</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for different views */}
                <Tabs defaultValue="pending" className="space-y-4">
                    <TabsList className="bg-slate-800 border-slate-700">
                        <TabsTrigger value="pending" className="data-[state=active]:bg-amber-600">
                            <Clock className="h-4 w-4 mr-2" />
                            Pending Review
                        </TabsTrigger>
                        <TabsTrigger value="legalization" className="data-[state=active]:bg-amber-600">
                            <Scale className="h-4 w-4 mr-2" />
                            Legalization Queue
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Translations Pending MoJ Review</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Review and approve/reject QA-completed translations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockPendingDocuments.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                                    <FileText className="h-5 w-5 text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{doc.id}</p>
                                                    <p className="text-sm text-slate-400">
                                                        {doc.type} → {doc.targetLanguage} | Translator: {doc.translatorID}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-slate-500 hidden md:block">
                                                    {new Date(doc.submittedAt).toLocaleDateString()}
                                                </p>
                                                <Button variant="outline" size="sm" className="border-slate-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleApprove(doc)}
                                                >
                                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleReject(doc)}
                                                >
                                                    <ThumbsDown className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="legalization">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Legalization Step 1 Queue</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Documents ready for MoJ legalization
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Scale className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">No documents pending legalization</p>
                                    <p className="text-sm text-slate-500">Approved documents will appear here</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Quick Links */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/moj/translators">
                        <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-5 w-5 text-blue-400" />
                                        <span className="text-white">Manage Translator Licenses</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/moj/audit">
                        <Card className="bg-slate-800/50 border-slate-700 cursor-pointer hover:border-slate-600 transition-colors">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-purple-400" />
                                        <span className="text-white">View Audit Trail</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </RoleSidebar>
    )
}
