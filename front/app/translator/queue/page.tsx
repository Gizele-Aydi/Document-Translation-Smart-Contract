"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow } from "@/lib/workflow-context"
import {
    FileText,
    ArrowLeft,
    Clock,
    Eye,
    Languages,
    Calendar,
    AlertTriangle
} from "lucide-react"
import Link from "next/link"

export default function TranslatorQueuePage() {
    const { documents, translators } = useWorkflow()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Get documents that are paid and waiting for translation
    const paidDocs = documents.filter(d => d.status === "PAID" && !d.translatorID)
    const myAssignedDocs = documents.filter(d => d.status === "IN_TRANSLATION")

    // All available for queue
    const queue = [...paidDocs, ...myAssignedDocs]

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/translator" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Translation Queue</h1>
                    <p className="text-slate-400">Documents ready for translation</p>
                </div>

                {/* Queue Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{paidDocs.length}</p>
                                    <p className="text-xs text-slate-400">Ready to Assign</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                                    <Languages className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{myAssignedDocs.length}</p>
                                    <p className="text-xs text-slate-400">In Progress</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                    <Clock className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {translators.filter(t => t.status === "ACTIVE").length}
                                    </p>
                                    <p className="text-xs text-slate-400">Active Translators</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Queue List */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Available Documents</CardTitle>
                        <CardDescription className="text-slate-400">
                            Click to accept or submit translation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {queue.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No documents in queue</p>
                                <p className="text-sm text-slate-500">Documents will appear here when clients pay</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {queue.map((doc) => {
                                    const isAssigned = doc.status === "IN_TRANSLATION"

                                    return (
                                        <div
                                            key={doc.id}
                                            className={`flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border transition-colors ${isAssigned ? "border-purple-500/30" : "border-slate-700 hover:border-slate-600"
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isAssigned ? "bg-purple-500/20" : "bg-blue-500/20"
                                                    }`}>
                                                    <FileText className={`h-6 w-6 ${isAssigned ? "text-purple-400" : "text-blue-400"}`} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-white">{doc.id}</p>
                                                        {isAssigned && (
                                                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">Assigned</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-400">{doc.type} • {doc.issuer}</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        <Languages className="h-3 w-3 inline mr-1" />
                                                        {doc.sourceLanguage} → {doc.targetLanguage}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-xs text-slate-500">Submitted</p>
                                                    <p className="text-sm text-slate-400">
                                                        {new Date(doc.submittedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="border-slate-600">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Link href={`/translator/submit?doc=${doc.id}`}>
                                                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                                            {isAssigned ? "Submit Translation" : "Accept & Translate"}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RoleSidebar>
    )
}
