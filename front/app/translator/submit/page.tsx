"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow, UploadedFile } from "@/lib/workflow-context"
import { useToast } from "@/hooks/use-toast"
import {
    Upload,
    FileText,
    ArrowLeft,
    CheckCircle,
    Languages,
    Shield,
    File,
    X
} from "lucide-react"
import Link from "next/link"

function TranslatorSubmitContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const docIdParam = searchParams.get("doc") || ""

    const { toast } = useToast()
    const { documents, assignTranslator, submitTranslation } = useWorkflow()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [certified, setCertified] = useState(false)
    const [selectedDocId, setSelectedDocId] = useState(docIdParam)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [notes, setNotes] = useState("")

    // Get documents that need translation
    const availableDocs = documents.filter(d =>
        d.status === "PAID" || d.status === "IN_TRANSLATION"
    )

    const selectedDoc = documents.find(d => d.id === selectedDocId)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "File Too Large",
                    description: "Maximum file size is 10MB",
                    variant: "destructive",
                })
                return
            }
            setSelectedFile(file)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: "File Too Large",
                    description: "Maximum file size is 10MB",
                    variant: "destructive",
                })
                return
            }
            setSelectedFile(file)
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!certified) {
            toast({
                title: "Certification Required",
                description: "You must certify that this is an accurate translation.",
                variant: "destructive",
            })
            return
        }

        if (!selectedDocId || !selectedDoc) {
            toast({
                title: "No Document Selected",
                description: "Please select a document to translate.",
                variant: "destructive",
            })
            return
        }

        if (!selectedFile) {
            toast({
                title: "No File Selected",
                description: "Please upload your translated document.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            const translatorId = "TRANSLATOR-001"
            const translatorName = "Fatma Ben Ali"

            // Assign translator if not already assigned
            if (!selectedDoc.translatorID) {
                assignTranslator(selectedDoc.id, translatorId)
            }

            // Create file info
            const fileInfo: UploadedFile = {
                name: selectedFile.name,
                size: selectedFile.size,
                type: selectedFile.type,
                uploadedAt: new Date().toISOString(),
                uploadedBy: translatorId,
            }

            // Submit translation with file
            const translationId = `TL-${Date.now().toString(36).toUpperCase()}`
            submitTranslation(selectedDoc.id, {
                translationID: translationId,
                translatorID: translatorId,
                translatorName: translatorName,
                targetLanguage: selectedDoc.targetLanguage,
                submittedAt: new Date().toISOString(),
                file: fileInfo,
            })

            toast({
                title: "Translation Submitted!",
                description: `Translation ${translationId} linked to ${selectedDoc.id} is now pending QA review.`,
            })

            setSubmitted(true)
        } catch (error) {
            toast({
                title: "Submission Failed",
                description: "Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <div className="max-w-xl mx-auto text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mx-auto mb-6">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Translation Submitted!</h1>
                <p className="text-slate-400 mb-6">
                    Your translation is now linked to {selectedDocId} and pending QA review.
                </p>
                <div className="flex justify-center gap-4">
                    <Link href="/translator/queue">
                        <Button variant="outline">Back to Queue</Button>
                    </Link>
                    <Link href="/translator/completed">
                        <Button className="bg-purple-600 hover:bg-purple-700">View My Translations</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                            <Upload className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <CardTitle className="text-white">Submit Translation</CardTitle>
                            <CardDescription className="text-slate-400">
                                Upload your completed translation linked to the original document
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Select Document */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Select Original Document *</Label>
                            <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                    <SelectValue placeholder="Select a document to translate" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableDocs.map((doc) => (
                                        <SelectItem key={doc.id} value={doc.id}>
                                            {doc.id} - {doc.type} ({doc.sourceLanguage} → {doc.targetLanguage})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Document Info */}
                        {selectedDoc && (
                            <div className="p-4 rounded-lg bg-slate-900/50 border border-blue-500/20">
                                <div className="flex items-center gap-3 mb-3">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                    <span className="font-medium text-white">Original Document</span>
                                    <Badge className="bg-blue-500/20 text-blue-400">{selectedDoc.status}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-slate-500">Type:</span>
                                        <span className="text-slate-300 ml-2">{selectedDoc.type}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Issuer:</span>
                                        <span className="text-slate-300 ml-2">{selectedDoc.issuer}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Language:</span>
                                        <span className="text-slate-300 ml-2">{selectedDoc.sourceLanguage} → {selectedDoc.targetLanguage}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Owner:</span>
                                        <span className="text-slate-300 ml-2">{selectedDoc.ownerName}</span>
                                    </div>
                                    {selectedDoc.originalFile && (
                                        <div className="col-span-2">
                                            <span className="text-slate-500">Original File:</span>
                                            <span className="text-slate-300 ml-2">{selectedDoc.originalFile.name}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Translation Upload */}
                        <div className="space-y-2">
                            <Label className="text-slate-300">Translated Document *</Label>

                            {!selectedFile ? (
                                <div
                                    className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500/50 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                    onDrop={handleDrop}
                                    onDragOver={(e) => e.preventDefault()}
                                >
                                    <Languages className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                                    <p className="text-slate-400 text-sm">
                                        Drag and drop your translated file here, or click to browse
                                    </p>
                                    <p className="text-slate-500 text-xs mt-1">
                                        Supported: PDF, DOC, DOCX (max 10MB)
                                    </p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleFileSelect}
                                    />
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-slate-900/50 border border-green-500/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                                <File className="h-5 w-5 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{selectedFile.name}</p>
                                                <p className="text-xs text-slate-400">
                                                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "document"}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={removeFile}
                                            className="text-slate-400 hover:text-red-400"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Translation Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="notes" className="text-slate-300">Translation Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Any notes about the translation, terminology used, etc."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
                            />
                        </div>

                        {/* Certification */}
                        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id="certify"
                                    checked={certified}
                                    onCheckedChange={(checked) => setCertified(checked as boolean)}
                                    className="mt-1"
                                />
                                <div>
                                    <Label htmlFor="certify" className="text-purple-300 cursor-pointer">
                                        <Shield className="h-4 w-4 inline mr-2" />
                                        Sworn Translator Certification
                                    </Label>
                                    <p className="text-sm text-slate-400 mt-1">
                                        I certify that this translation is accurate and complete,
                                        and I take full professional responsibility for its contents.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {selectedDoc && selectedFile && (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
                                <strong>Linking:</strong> {selectedFile.name} will be linked to original document {selectedDoc.id}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            disabled={loading || !certified || !selectedDoc || !selectedFile}
                        >
                            {loading ? "Submitting to Blockchain..." : "Submit Translation"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function TranslatorSubmitPage() {
    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/translator/queue" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Queue
                </Link>

                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <TranslatorSubmitContent />
                </Suspense>
            </div>
        </RoleSidebar>
    )
}
