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
    CheckCircle,
    ArrowLeft,
    FileText,
    Eye,
    ThumbsUp,
    ThumbsDown,
    Languages,
    User,
    Search
} from "lucide-react"
import Link from "next/link"

// QA Page for approving translations before MoJ review
export default function QAReviewPage() {
    const { toast } = useToast()
    const { documents, qaApprove, qaReject } = useWorkflow()
    const [mounted, setMounted] = useState(false)
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [rejectReason, setRejectReason] = useState("")
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Documents with pending QA translations
    const pendingDocs = documents.filter(d => d.status === "PENDING_QA")

    const handleApprove = async (docId: string) => {
        const doc = documents.find(d => d.id === docId)
        if (!doc) return

        const pendingTranslation = doc.translations.find(t => t.qaStatus === "PENDING_QA")
        if (!pendingTranslation) return

        setProcessing(docId)

        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            qaApprove(docId, pendingTranslation.translationID)

            toast({
                title: "QA Approved",
                description: `Translation for ${docId} has been approved. Now pending MoJ review.`,
            })
        } catch (error) {
            toast({
                title: "Approval Failed",
                description: "Please try again.",
                variant: "destructive",
            })
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async () => {
        if (!selectedDocId || !rejectReason.trim()) return

        const doc = documents.find(d => d.id === selectedDocId)
        if (!doc) return

        const pendingTranslation = doc.translations.find(t => t.qaStatus === "PENDING_QA")
        if (!pendingTranslation) return

        setProcessing(selectedDocId)

        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            qaReject(selectedDocId, pendingTranslation.translationID, rejectReason)

            toast({
                title: "QA Rejected",
                description: `Translation sent back to translator for revision.`,
            })

            setRejectDialogOpen(false)
            setRejectReason("")
            setSelectedDocId(null)
        } catch (error) {
            toast({
                title: "Rejection Failed",
                description: "Please try again.",
                variant: "destructive",
            })
        } finally {
            setProcessing(null)
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
                    <h1 className="text-2xl font-bold text-white mb-2">QA Review Queue</h1>
                    <p className="text-slate-400">Translations pending quality assurance review</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                                    <Search className="h-5 w-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{pendingDocs.length}</p>
                                    <p className="text-xs text-slate-400">Pending QA</p>
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
                                    <p className="text-2xl font-bold text-white">
                                        {documents.filter(d => d.translations.some(t => t.qaStatus === "QA_APPROVED")).length}
                                    </p>
                                    <p className="text-xs text-slate-400">Approved</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending List */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Search className="h-5 w-5 text-orange-400" />
                            Translations Awaiting QA
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pendingDocs.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No pending translations</p>
                                <p className="text-sm text-slate-500">Translations will appear here after submission</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingDocs.map((doc) => {
                                    const translation = doc.translations.find(t => t.qaStatus === "PENDING_QA")
                                    return (
                                        <div
                                            key={doc.id}
                                            className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/20">
                                                        <FileText className="h-6 w-6 text-orange-400" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-white">{doc.id}</p>
                                                            <Badge className="bg-purple-500/20 text-purple-400 text-xs">
                                                                Translation Submitted
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-slate-400">{doc.type}</p>
                                                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Languages className="h-3 w-3" />
                                                                {doc.sourceLanguage} → {doc.targetLanguage}
                                                            </span>
                                                            {translation && (
                                                                <span className="flex items-center gap-1">
                                                                    <User className="h-3 w-3" />
                                                                    {translation.translatorName}
                                                                </span>
                                                            )}
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
                                                        onClick={() => handleApprove(doc.id)}
                                                        disabled={processing === doc.id}
                                                    >
                                                        <ThumbsUp className="h-4 w-4 mr-1" />
                                                        {processing === doc.id ? "..." : "Approve"}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setSelectedDocId(doc.id)
                                                            setRejectDialogOpen(true)
                                                        }}
                                                        disabled={processing === doc.id}
                                                    >
                                                        <ThumbsDown className="h-4 w-4 mr-1" />
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Rejection Dialog */}
                <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                    <DialogContent className="bg-slate-800 border-slate-700">
                        <DialogHeader>
                            <DialogTitle className="text-white">Reject Translation</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Provide feedback for the translator.
                            </DialogDescription>
                        </DialogHeader>
                        <Textarea
                            placeholder="Enter QA feedback..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
                        />
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || processing !== null}
                            >
                                {processing ? "Processing..." : "Reject & Send Back"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </RoleSidebar>
    )
}
