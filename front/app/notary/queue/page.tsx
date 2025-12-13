"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow } from "@/lib/workflow-context"
import { useToast } from "@/hooks/use-toast"
import {
    Scale,
    ArrowLeft,
    FileText,
    Eye,
    CheckCircle,
    Clock,
    Languages,
    User,
    Award
} from "lucide-react"
import Link from "next/link"

export default function NotaryQueuePage() {
    const { toast } = useToast()
    const { documents, notarize, getDocumentsForNotary } = useWorkflow()
    const [mounted, setMounted] = useState(false)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Documents pending notarization (Notary route selected)
    const pendingDocs = documents.filter(d =>
        d.legalizationRoute === "NOTARY" &&
        d.status === "PENDING_NOTARY"
    )

    // Documents completed by this notary
    const completedDocs = documents.filter(d =>
        d.legalizationRoute === "NOTARY" &&
        d.status === "FINALIZED" &&
        d.attestationID
    )

    const handleNotarize = async (docId: string) => {
        setProcessing(docId)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000))

            notarize(docId, "NOTARY-001")

            toast({
                title: "Document Notarized!",
                description: `Document ${docId} has been notarized and finalized with apostille.`,
            })
        } finally {
            setProcessing(null)
        }
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/notary" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Notarization Queue</h1>
                    <p className="text-slate-400">Documents pending notarization via Notary route</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                    <Clock className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{pendingDocs.length}</p>
                                    <p className="text-xs text-slate-400">Pending Notarization</p>
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
                                    <p className="text-2xl font-bold text-white">{completedDocs.length}</p>
                                    <p className="text-xs text-slate-400">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                                    <Scale className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {documents.filter(d => d.legalizationRoute === "NOTARY").length}
                                    </p>
                                    <p className="text-xs text-slate-400">Via Notary Route</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Queue */}
                <Card className="bg-slate-800/50 border-slate-700 mb-6">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-400" />
                            Pending Notarization
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Documents that need your notarization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingDocs.length === 0 ? (
                            <div className="text-center py-8">
                                <Scale className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No documents pending</p>
                                <p className="text-sm text-slate-500">
                                    Documents will appear here when clients choose the Notary route
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 rounded-lg bg-slate-900/50 border border-amber-500/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20">
                                                    <FileText className="h-6 w-6 text-amber-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-white">{doc.id}</p>
                                                        <Badge className="bg-purple-500/20 text-purple-400">
                                                            Notary Route
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-400">{doc.type} • {doc.issuer}</p>
                                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Languages className="h-3 w-3" />
                                                            {doc.sourceLanguage} → {doc.targetLanguage}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            {doc.ownerName}
                                                        </span>
                                                        {doc.translatorName && (
                                                            <span>Translated by: {doc.translatorName}</span>
                                                        )}
                                                    </div>
                                                    {doc.translatedFile && (
                                                        <p className="text-xs text-green-400 mt-1">
                                                            📎 Translation: {doc.translatedFile.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="border-slate-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                    onClick={() => handleNotarize(doc.id)}
                                                    disabled={processing === doc.id}
                                                >
                                                    <Award className="h-4 w-4 mr-1" />
                                                    {processing === doc.id ? "Processing..." : "Notarize & Issue"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Completed */}
                {completedDocs.length > 0 && (
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                Recently Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {completedDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-green-500/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                                <CheckCircle className="h-5 w-5 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{doc.id}</p>
                                                <p className="text-sm text-slate-400">
                                                    {doc.attestationID} • {doc.type}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge className="bg-green-500/20 text-green-400">Finalized</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </RoleSidebar>
    )
}
