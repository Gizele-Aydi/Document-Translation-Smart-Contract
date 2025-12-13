"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow, LegalizationRoute } from "@/lib/workflow-context"
import { useToast } from "@/hooks/use-toast"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
    Award,
    FileText,
    ArrowLeft,
    CheckCircle,
    Globe,
    Building2,
    Scale,
    ArrowRight
} from "lucide-react"
import Link from "next/link"

export default function ClientApostillePage() {
    const { toast } = useToast()
    const { documents, requestApostille } = useWorkflow()
    const [mounted, setMounted] = useState(false)
    const [selectedDocId, setSelectedDocId] = useState<string>("")
    const [selectedRoute, setSelectedRoute] = useState<LegalizationRoute>("GOVERNMENT")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Documents that are translated and can request apostille
    const eligibleDocs = documents.filter(d =>
        d.translations.length > 0 &&
        d.legalizationRoute === "NONE" &&
        !d.apostilleRequested
    )

    // Documents with apostille in progress
    const inProgressDocs = documents.filter(d =>
        d.apostilleRequested &&
        d.status !== "FINALIZED"
    )

    // Completed documents
    const completedDocs = documents.filter(d =>
        d.status === "FINALIZED"
    )

    const handleSubmit = async () => {
        if (!selectedDocId) {
            toast({
                title: "No Document Selected",
                description: "Please select a document to request apostille.",
                variant: "destructive",
            })
            return
        }

        setSubmitting(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            requestApostille(selectedDocId, selectedRoute)

            const routeText = selectedRoute === "GOVERNMENT"
                ? "Ministry of Justice → Ministry of Foreign Affairs"
                : "Notary"

            toast({
                title: "Apostille Request Submitted!",
                description: `Your document will be processed via the ${routeText} route.`,
            })

            setSelectedDocId("")
        } finally {
            setSubmitting(false)
        }
    }

    const getSelectedDoc = () => documents.find(d => d.id === selectedDocId)

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/client" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Request Apostille</h1>
                    <p className="text-slate-400">Get your translated document internationally recognized</p>
                </div>

                {/* Request Form */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Select Document */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-400" />
                                Step 1: Select Document
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Choose a translated document for apostille
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {eligibleDocs.length === 0 ? (
                                <div className="text-center py-6">
                                    <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400 text-sm">No documents ready for apostille</p>
                                    <p className="text-slate-500 text-xs mt-1">Documents need to be translated first</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {eligibleDocs.map((doc) => (
                                        <div
                                            key={doc.id}
                                            onClick={() => setSelectedDocId(doc.id)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedDocId === doc.id
                                                    ? "bg-blue-500/10 border-blue-500"
                                                    : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium text-white">{doc.id}</p>
                                                    <p className="text-sm text-slate-400">{doc.type}</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {doc.sourceLanguage} → {doc.targetLanguage}
                                                    </p>
                                                </div>
                                                {selectedDocId === doc.id && (
                                                    <CheckCircle className="h-5 w-5 text-blue-400" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Select Route */}
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Award className="h-5 w-5 text-purple-400" />
                                Step 2: Choose Legalization Route
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Select how your document should be processed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup
                                value={selectedRoute}
                                onValueChange={(value) => setSelectedRoute(value as LegalizationRoute)}
                                className="space-y-4"
                            >
                                {/* Government Route */}
                                <Label
                                    htmlFor="government"
                                    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${selectedRoute === "GOVERNMENT"
                                            ? "bg-amber-500/10 border-amber-500"
                                            : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                                        }`}
                                >
                                    <RadioGroupItem value="GOVERNMENT" id="government" className="mt-1" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-amber-400" />
                                            <span className="font-medium text-white">Government Route</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Ministry of Justice → Ministry of Foreign Affairs
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                            <Scale className="h-3 w-3" />
                                            <span>MoJ Approval</span>
                                            <ArrowRight className="h-3 w-3" />
                                            <Globe className="h-3 w-3" />
                                            <span>MoFA Legalization</span>
                                            <ArrowRight className="h-3 w-3" />
                                            <Award className="h-3 w-3" />
                                            <span>Apostille</span>
                                        </div>
                                    </div>
                                </Label>

                                {/* Notary Route */}
                                <Label
                                    htmlFor="notary"
                                    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${selectedRoute === "NOTARY"
                                            ? "bg-purple-500/10 border-purple-500"
                                            : "bg-slate-900/50 border-slate-700 hover:border-slate-600"
                                        }`}
                                >
                                    <RadioGroupItem value="NOTARY" id="notary" className="mt-1" />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Scale className="h-5 w-5 text-purple-400" />
                                            <span className="font-medium text-white">Notary Route</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Direct notarization by Court Notary
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                                            <Scale className="h-3 w-3" />
                                            <span>Notary Attestation</span>
                                            <ArrowRight className="h-3 w-3" />
                                            <Award className="h-3 w-3" />
                                            <span>Apostille</span>
                                        </div>
                                    </div>
                                </Label>
                            </RadioGroup>

                            {/* Submit Button */}
                            <Button
                                className="w-full mt-6 bg-purple-600 hover:bg-purple-700"
                                onClick={handleSubmit}
                                disabled={!selectedDocId || submitting}
                            >
                                <Award className="h-4 w-4 mr-2" />
                                {submitting ? "Submitting Request..." : "Request Apostille"}
                            </Button>

                            {getSelectedDoc() && (
                                <p className="text-xs text-center text-slate-500 mt-3">
                                    Selected: {getSelectedDoc()?.id} will go to {selectedRoute === "GOVERNMENT" ? "MoJ" : "Notary"}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* In Progress */}
                {inProgressDocs.length > 0 && (
                    <Card className="bg-slate-800/50 border-slate-700 mb-6">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Award className="h-5 w-5 text-amber-400" />
                                In Progress ({inProgressDocs.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {inProgressDocs.map((doc) => (
                                    <Link key={doc.id} href={`/client/track?id=${doc.id}`}>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-amber-500/30 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                                    <Award className="h-5 w-5 text-amber-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{doc.id}</p>
                                                    <p className="text-sm text-slate-400">
                                                        {doc.legalizationRoute === "GOVERNMENT" ? "Government" : "Notary"} Route
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-amber-500/20 text-amber-400">
                                                {doc.status.replace(/_/g, " ")}
                                            </Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Completed */}
                {completedDocs.length > 0 && (
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                                Completed ({completedDocs.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {completedDocs.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-green-500/20">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                                <CheckCircle className="h-5 w-5 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{doc.id}</p>
                                                <p className="text-sm text-slate-400">{doc.apostilleID || "Completed"}</p>
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
