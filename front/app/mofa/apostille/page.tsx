"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow } from "@/lib/workflow-context"
import { useToast } from "@/hooks/use-toast"
import {
    Award,
    ArrowLeft,
    FileText,
    Eye,
    CheckCircle,
    Clock,
    Globe
} from "lucide-react"
import Link from "next/link"

export default function MoFAApostillePage() {
    const { toast } = useToast()
    const { documents, issueApostille } = useWorkflow()
    const [mounted, setMounted] = useState(false)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Documents that can get apostille (fully legalized, no apostille yet)
    const eligibleDocs = documents.filter(d =>
        d.status === "LEGALIZED" ||
        (d.legalizationSteps.every(s => s.status === "COMPLETED") && !d.apostilleID)
    )

    const issuedDocs = documents.filter(d => d.apostilleID)

    const handleIssueApostille = async (docId: string) => {
        setProcessing(docId)
        try {
            await new Promise(resolve => setTimeout(resolve, 2000))

            issueApostille(docId, "MOFA-OFFICER-001")

            toast({
                title: "Apostille Issued!",
                description: `Apostille certificate has been issued for ${docId}. Document is now finalized.`,
            })
        } finally {
            setProcessing(null)
        }
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/mofa" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Apostille Issuance</h1>
                    <p className="text-slate-400">Issue Apostille certificates for legalized documents</p>
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
                                    <p className="text-2xl font-bold text-white">{eligibleDocs.length}</p>
                                    <p className="text-xs text-slate-400">Ready for Apostille</p>
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
                                    <p className="text-2xl font-bold text-white">{issuedDocs.length}</p>
                                    <p className="text-xs text-slate-400">Issued</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                                    <Award className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{eligibleDocs.length + issuedDocs.length}</p>
                                    <p className="text-xs text-slate-400">Total Requests</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Eligible Documents */}
                <Card className="bg-slate-800/50 border-slate-700 mb-6">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Clock className="h-5 w-5 text-amber-400" />
                            Ready for Apostille
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {eligibleDocs.length === 0 ? (
                            <div className="text-center py-8">
                                <Award className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No documents ready for apostille</p>
                                <p className="text-sm text-slate-500">Documents need to complete legalization first</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {eligibleDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/20">
                                                    <Award className="h-6 w-6 text-purple-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-white">{doc.id}</p>
                                                        <Badge className="bg-green-500/20 text-green-400">Fully Legalized</Badge>
                                                    </div>
                                                    <p className="text-sm text-slate-400">{doc.type}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="border-slate-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                    onClick={() => handleIssueApostille(doc.id)}
                                                    disabled={processing === doc.id}
                                                >
                                                    <Award className="h-4 w-4 mr-1" />
                                                    {processing === doc.id ? "Issuing..." : "Issue Apostille"}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Issued */}
                {issuedDocs.length > 0 && (
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                Recently Issued
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {issuedDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 rounded-lg bg-slate-900/50 border border-green-500/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{doc.apostilleID}</p>
                                                    <p className="text-sm text-slate-400">{doc.type} • {doc.id}</p>
                                                </div>
                                            </div>
                                            <Badge className="bg-green-500/20 text-green-400">Finalized</Badge>
                                        </div>
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
