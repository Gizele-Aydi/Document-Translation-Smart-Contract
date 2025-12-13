"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow } from "@/lib/workflow-context"
import {
    Search,
    FileText,
    ArrowLeft,
    Clock,
    Download,
    CheckCircle,
    XCircle,
    Languages,
    Scale,
    Globe,
    Award,
    User
} from "lucide-react"
import Link from "next/link"

function TrackContent() {
    const searchParams = useSearchParams()
    const initialId = searchParams.get("id") || ""

    const { documents, getDocument } = useWorkflow()
    const [documentID, setDocumentID] = useState(initialId)
    const [selectedDoc, setSelectedDoc] = useState<ReturnType<typeof getDocument>>(undefined)

    useEffect(() => {
        if (initialId) {
            setSelectedDoc(getDocument(initialId))
        }
    }, [initialId, getDocument])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSelectedDoc(getDocument(documentID))
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            SUBMITTED: "bg-blue-500/20 text-blue-400",
            PAID: "bg-green-500/20 text-green-400",
            IN_TRANSLATION: "bg-yellow-500/20 text-yellow-400",
            PENDING_QA: "bg-orange-500/20 text-orange-400",
            PENDING_MOJ: "bg-purple-500/20 text-purple-400",
            PENDING_MOFA: "bg-indigo-500/20 text-indigo-400",
            LEGALIZED: "bg-teal-500/20 text-teal-400",
            FINALIZED: "bg-green-500/20 text-green-400",
            MOJ_REJECTED: "bg-red-500/20 text-red-400",
        }
        return colors[status] || "bg-slate-500/20 text-slate-400"
    }

    const getActionIcon = (action: string) => {
        if (action.includes("SUBMIT")) return <FileText className="h-4 w-4 text-blue-400" />
        if (action.includes("PAYMENT")) return <CheckCircle className="h-4 w-4 text-green-400" />
        if (action.includes("TRANSLATOR") || action.includes("TRANSLATION")) return <Languages className="h-4 w-4 text-purple-400" />
        if (action.includes("QA")) return <CheckCircle className="h-4 w-4 text-orange-400" />
        if (action.includes("MOJ")) return <Scale className="h-4 w-4 text-amber-400" />
        if (action.includes("MOFA") || action.includes("LEGALI")) return <Globe className="h-4 w-4 text-green-400" />
        if (action.includes("APOSTILLE")) return <Award className="h-4 w-4 text-purple-400" />
        if (action.includes("REJECT")) return <XCircle className="h-4 w-4 text-red-400" />
        return <Clock className="h-4 w-4 text-slate-400" />
    }

    return (
        <>
            {/* Search */}
            <Card className="bg-slate-800/50 border-slate-700 mb-6">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="docId" className="sr-only">Document ID</Label>
                            <Input
                                id="docId"
                                placeholder="Enter Document ID (e.g., DOC-DEMO-001)"
                                value={documentID}
                                onChange={(e) => setDocumentID(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white"
                                required
                            />
                        </div>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                            <Search className="h-4 w-4 mr-2" />
                            Track
                        </Button>
                    </form>

                    {/* Quick select from existing docs */}
                    {documents.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs text-slate-500 mb-2">Quick select:</p>
                            <div className="flex flex-wrap gap-2">
                                {documents.map(doc => (
                                    <Button
                                        key={doc.id}
                                        variant="outline"
                                        size="sm"
                                        className="border-slate-600 text-slate-300"
                                        onClick={() => {
                                            setDocumentID(doc.id)
                                            setSelectedDoc(doc)
                                        }}
                                    >
                                        {doc.id}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Document Details */}
            {selectedDoc ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Document Info */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-white flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    Document Details
                                </CardTitle>
                                <Badge className={getStatusColor(selectedDoc.status)}>
                                    {selectedDoc.status.replace(/_/g, " ")}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Document ID</p>
                                    <p className="text-white font-mono">{selectedDoc.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Type</p>
                                    <p className="text-white">{selectedDoc.type}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Issuer</p>
                                    <p className="text-white">{selectedDoc.issuer}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Languages</p>
                                    <p className="text-white">{selectedDoc.sourceLanguage} → {selectedDoc.targetLanguage}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Submitted</p>
                                    <p className="text-white">{new Date(selectedDoc.submittedAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Payment</p>
                                    <Badge className={selectedDoc.paymentStatus === "PAID" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                                        {selectedDoc.paymentStatus}
                                    </Badge>
                                </div>
                            </div>

                            {/* Translator Info */}
                            {selectedDoc.translatorName && (
                                <div className="pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-500 mb-2">Assigned Translator</p>
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-purple-400" />
                                        <span className="text-white">{selectedDoc.translatorName}</span>
                                    </div>
                                </div>
                            )}

                            {/* Legalization Progress */}
                            <div className="pt-4 border-t border-slate-700">
                                <p className="text-xs text-slate-500 mb-2">Legalization Steps</p>
                                <div className="flex gap-2">
                                    {selectedDoc.legalizationSteps.map((step, idx) => (
                                        <div key={step.step} className="flex items-center gap-1">
                                            <Badge className={
                                                step.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                                                    step.status === "PENDING" ? "bg-slate-500/20 text-slate-400" :
                                                        "bg-red-500/20 text-red-400"
                                            }>
                                                {step.step}
                                            </Badge>
                                            {idx < selectedDoc.legalizationSteps.length - 1 && (
                                                <span className="text-slate-600">→</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {selectedDoc.status === "FINALIZED" && (
                                <Button className="w-full bg-green-600 hover:bg-green-700 mt-4">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Certified Translation
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Activity Timeline */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Clock className="h-5 w-5 text-purple-400" />
                                Activity Timeline
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Complete history of document actions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[...selectedDoc.history].reverse().map((entry, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-700"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800">
                                            {getActionIcon(entry.action)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white font-medium">
                                                {entry.action.replace(/_/g, " ")}
                                            </p>
                                            <p className="text-xs text-slate-400">{entry.details}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                <span>{entry.actorRole}</span>
                                                <span>•</span>
                                                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : documentID && (
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400">Document not found</p>
                        <p className="text-sm text-slate-500">Check the ID and try again</p>
                    </CardContent>
                </Card>
            )}
        </>
    )
}

export default function ClientTrackPage() {
    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/client" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Track Document Status</h1>
                    <p className="text-slate-400">View complete workflow history for any document</p>
                </div>

                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <TrackContent />
                </Suspense>
            </div>
        </RoleSidebar>
    )
}
