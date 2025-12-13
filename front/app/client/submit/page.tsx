"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow } from "@/lib/workflow-context"
import { useToast } from "@/hooks/use-toast"
import {
    Upload,
    FileText,
    CheckCircle,
    ArrowLeft,
    X,
    File
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ClientSubmitPage() {
    const router = useRouter()
    const { toast } = useToast()
    const { submitDocument } = useWorkflow()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [submittedDocId, setSubmittedDocId] = useState("")
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [formData, setFormData] = useState({
        documentType: "",
        issuer: "",
        sourceLanguage: "Arabic",
        targetLanguage: "",
        notes: "",
    })

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Validate file size (max 10MB)
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

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const removeFile = () => {
        setSelectedFile(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile) {
            toast({
                title: "No File Selected",
                description: "Please upload a document to submit.",
                variant: "destructive",
            })
            return
        }

        if (!formData.documentType || !formData.issuer || !formData.targetLanguage) {
            toast({
                title: "Missing Information",
                description: "Please fill in all required fields.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            // Simulate blockchain transaction delay
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Submit to workflow context
            const docId = submitDocument({
                type: formData.documentType,
                issuer: formData.issuer,
                ownerID: "CLIENT-001",
                ownerName: localStorage.getItem("userName") || "You",
                sourceLanguage: formData.sourceLanguage,
                targetLanguage: formData.targetLanguage,
            })

            setSubmittedDocId(docId)

            toast({
                title: "Document Submitted Successfully!",
                description: `Your document has been registered with ID: ${docId}`,
            })

            setSubmitted(true)
        } catch (error) {
            toast({
                title: "Submission Failed",
                description: "Please try again later.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <RoleSidebar>
                <div className="p-6 md:p-8">
                    <div className="max-w-xl mx-auto text-center py-12">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 mx-auto mb-6">
                            <CheckCircle className="h-8 w-8 text-green-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Document Submitted!</h1>
                        <p className="text-slate-400 mb-2">
                            Your document has been registered on the blockchain.
                        </p>
                        <p className="text-lg font-mono text-blue-400 mb-6 bg-slate-800 px-4 py-2 rounded inline-block">
                            {submittedDocId}
                        </p>
                        <p className="text-sm text-slate-500 mb-6">
                            Save this ID to track your document's progress
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href={`/client/track?id=${submittedDocId}`}>
                                <Button className="bg-blue-600 hover:bg-blue-700">Track This Document</Button>
                            </Link>
                            <Link href="/client/payments">
                                <Button variant="outline">Pay Translation Fee</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </RoleSidebar>
        )
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/client" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="max-w-2xl mx-auto">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Upload className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">Submit Document for Translation</CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Upload your document and specify translation requirements
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Document Upload */}
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Document File *</Label>

                                    {!selectedFile ? (
                                        <div
                                            className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer"
                                            onClick={() => fileInputRef.current?.click()}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                        >
                                            <FileText className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                                            <p className="text-slate-400 text-sm">
                                                Drag and drop your file here, or click to browse
                                            </p>
                                            <p className="text-slate-500 text-xs mt-1">
                                                Supported: PDF, DOC, DOCX, JPG, PNG (max 10MB)
                                            </p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
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

                                {/* Document Type */}
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Document Type *</Label>
                                    <Select
                                        value={formData.documentType}
                                        onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                            <SelectValue placeholder="Select document type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Diploma">Diploma / Degree</SelectItem>
                                            <SelectItem value="Academic Transcript">Academic Transcript</SelectItem>
                                            <SelectItem value="Birth Certificate">Birth Certificate</SelectItem>
                                            <SelectItem value="Marriage Certificate">Marriage Certificate</SelectItem>
                                            <SelectItem value="Legal Contract">Legal Contract</SelectItem>
                                            <SelectItem value="Passport">Passport / ID</SelectItem>
                                            <SelectItem value="Medical Record">Medical Records</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Issuing Authority */}
                                <div className="space-y-2">
                                    <Label htmlFor="issuer" className="text-slate-300">Issuing Authority *</Label>
                                    <Input
                                        id="issuer"
                                        placeholder="e.g., Ministry of Education, University of Tunis"
                                        value={formData.issuer}
                                        onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                                        className="bg-slate-900 border-slate-700 text-white"
                                    />
                                </div>

                                {/* Languages */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Source Language</Label>
                                        <Select
                                            value={formData.sourceLanguage}
                                            onValueChange={(value) => setFormData({ ...formData, sourceLanguage: value })}
                                        >
                                            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Arabic">Arabic</SelectItem>
                                                <SelectItem value="French">French</SelectItem>
                                                <SelectItem value="English">English</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-slate-300">Target Language *</Label>
                                        <Select
                                            value={formData.targetLanguage}
                                            onValueChange={(value) => setFormData({ ...formData, targetLanguage: value })}
                                        >
                                            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="French">French</SelectItem>
                                                <SelectItem value="English">English</SelectItem>
                                                <SelectItem value="Arabic">Arabic</SelectItem>
                                                <SelectItem value="German">German</SelectItem>
                                                <SelectItem value="Spanish">Spanish</SelectItem>
                                                <SelectItem value="Italian">Italian</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Additional Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-slate-300">Additional Notes (Optional)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Any special instructions or notes for the translator..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="bg-slate-900 border-slate-700 text-white min-h-[80px]"
                                    />
                                </div>

                                {/* Fee Notice */}
                                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-amber-400 text-sm">
                                        <strong>Translation Fee:</strong> 50 TND
                                        <br />
                                        Payment will be required before translation begins.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                    disabled={loading || !selectedFile}
                                >
                                    {loading ? "Registering on Blockchain..." : "Submit Document"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RoleSidebar>
    )
}
