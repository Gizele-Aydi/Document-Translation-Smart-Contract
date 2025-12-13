"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow } from "@/lib/workflow-context"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Globe,
    ArrowLeft,
    FileText,
    Eye,
    Stamp,
    XCircle,
    Clock,
    CheckCircle,
    Building2,
    Languages,
    User
} from "lucide-react"
import Link from "next/link"

export default function MoFAPendingPage() {
    const { toast } = useToast()
    const { documents, legalizationStep, getDocumentsForMoFA } = useWorkflow()
    const [mounted, setMounted] = useState(false)
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Documents pending MoFA legalization (Government route, MoJ approved)
    const pendingDocs = documents.filter(d =>
        d.legalizationRoute === "GOVERNMENT" &&
        d.status === "PENDING_MOFA" &&
        d.mojApproval?.status === "APPROVED"
    )

    const legalizedCount = documents.filter(d =>
        d.legalizationSteps.find(s => s.step === "MoFA")?.status === "COMPLETED"
    ).length

    const handleLegalize = async (docId: string) => {
        setProcessing(docId)

        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            legalizationStep(docId, "MoFA", "MOFA-OFFICER-001")

            toast({
                title: "Legalization Complete",
                description: `Document ${docId} has been legalized. Ready for Apostille issuance.`,
            })
        } catch (error) {
            toast({
                title: "Legalization Failed",
                description: "Please try again.",
                variant: "destructive",
            })
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async () => {
        if (!selectedDocId || !rejectReason.trim()) return
        setProcessing(selectedDocId)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))
            toast({
                title: "Legalization Rejected",
                description: `Document ${selectedDocId} has been sent back for review.`,
            })
            setRejectDialogOpen(false)
            setRejectReason("")
            setSelectedDocId(null)
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
                    <h1 className="text-2xl font-bold text-white mb-2">Pending Legalization</h1>
                    <p className="text-slate-400">Documents awaiting MoFA legalization (Step 2 of Government route)</p>
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
                                    <p className="text-xs text-slate-400">Pending Legalization</p>
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
                                    <p className="text-2xl font-bold text-white">{legalizedCount}</p>
                                    <p className="text-xs text-slate-400">Legalized</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Building2 className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {documents.filter(d => d.legalizationRoute === "GOVERNMENT").length}
                                    </p>
                                    <p className="text-xs text-slate-400">Government Route</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Globe className="h-5 w-5 text-green-400" />
                            Legalization Queue
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            MoJ-approved documents ready for MoFA legalization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pendingDocs.length === 0 ? (
                            <div className="text-center py-8">
                                <Globe className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No pending documents</p>
                                <p className="text-sm text-slate-500">
                                    Documents will appear here after MoJ approves them
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingDocs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                                                    <FileText className="h-6 w-6 text-green-400" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-white">{doc.id}</p>
                                                        <Badge className="bg-amber-500/20 text-amber-400">
                                                            MoJ Approved
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
                                                    </div>
                                                    {doc.translatedFile && (
                                                        <p className="text-xs text-green-400 mt-1">
                                                            📎 Translation: {doc.translatedFile.name}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {doc.legalizationSteps.map((step, idx) => (
                                                            <div key={step.step} className="flex items-center gap-1">
                                                                <span className={`text-xs px-2 py-0.5 rounded ${step.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                                                                        step.status === "PENDING" ? "bg-amber-500/20 text-amber-400" :
                                                                            "bg-slate-500/20 text-slate-400"
                                                                    }`}>
                                                                    {step.step}
                                                                </span>
                                                                {idx < doc.legalizationSteps.length - 1 && (
                                                                    <span className="text-slate-600">→</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="border-slate-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleLegalize(doc.id)}
                                                    disabled={processing === doc.id}
                                                >
                                                    <Stamp className="h-4 w-4 mr-1" />
                                                    {processing === doc.id ? "..." : "Legalize"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        setSelectedDocId(doc.id)
                                                        setRejectDialogOpen(true)
                                                    }}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Rejection Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent className="bg-slate-800 border-slate-700">
                        <DialogHeader>
                            <DialogTitle className="text-white">Reject Legalization</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Provide a reason for rejection.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white"
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason.trim()}>
                                Confirm Rejection
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </RoleSidebar>
    )
}
