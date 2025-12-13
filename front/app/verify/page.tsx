"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Shield,
    Search,
    CheckCircle,
    XCircle,
    FileText,
    Clock,
    Award,
    Globe,
    ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface VerificationResult {
    verified: boolean
    proofType?: string
    proofTimestamp?: string
    message: string
    documentType?: string
    issuer?: string
}

export default function PublicVerifyPage() {
    const [hash, setHash] = useState("")
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<VerificationResult | null>(null)

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setResult(null)

        try {
            // Simulate blockchain verification
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Mock verification result
            if (hash.length >= 10) {
                setResult({
                    verified: true,
                    proofType: "TRANSLATION_COMPLETE",
                    proofTimestamp: new Date().toISOString(),
                    message: "Document has been verified as: Translation Complete",
                    documentType: "Diploma",
                    issuer: "Ministry of Education"
                })
            } else {
                setResult({
                    verified: false,
                    message: "No valid proof found for this hash"
                })
            }
        } catch (error) {
            setResult({
                verified: false,
                message: "Verification failed. Please try again."
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8">
                {/* Back Link */}
                <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                </Link>

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
                            <Shield className="h-7 w-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Public Document Verification
                    </h1>
                    <p className="text-slate-400 max-w-lg mx-auto">
                        Verify the authenticity of translated and legalized documents using Zero-Knowledge Proof technology
                    </p>
                </div>

                {/* Verification Form */}
                <div className="max-w-2xl mx-auto">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Search className="h-5 w-5 text-green-400" />
                                Verify Document
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Enter the public verification hash or Apostille number
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleVerify} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hash" className="text-slate-300">Verification Hash / Apostille Number</Label>
                                    <Input
                                        id="hash"
                                        placeholder="Enter document hash or Apostille number..."
                                        value={hash}
                                        onChange={(e) => setHash(e.target.value)}
                                        className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
                                        required
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                                            Verifying on Blockchain...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="h-4 w-4 mr-2" />
                                            Verify Document
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Result */}
                    {result && (
                        <Card className={`mt-6 ${result.verified
                                ? "bg-green-900/20 border-green-500/30"
                                : "bg-red-900/20 border-red-500/30"
                            }`}>
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${result.verified ? "bg-green-500" : "bg-red-500"
                                        }`}>
                                        {result.verified ? (
                                            <CheckCircle className="h-6 w-6 text-white" />
                                        ) : (
                                            <XCircle className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-semibold ${result.verified ? "text-green-400" : "text-red-400"
                                            }`}>
                                            {result.verified ? "Document Verified" : "Verification Failed"}
                                        </h3>
                                        <p className="text-slate-300 mt-1">{result.message}</p>

                                        {result.verified && (
                                            <div className="mt-4 grid grid-cols-2 gap-4">
                                                <div className="p-3 rounded-lg bg-slate-800/50">
                                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                                        <FileText className="h-4 w-4" />
                                                        Document Type
                                                    </div>
                                                    <p className="text-white font-medium">{result.documentType}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-slate-800/50">
                                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                                        <Globe className="h-4 w-4" />
                                                        Issuer
                                                    </div>
                                                    <p className="text-white font-medium">{result.issuer}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-slate-800/50">
                                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                                        <Award className="h-4 w-4" />
                                                        Status
                                                    </div>
                                                    <Badge className="bg-green-500/20 text-green-400">
                                                        {result.proofType?.replace(/_/g, " ")}
                                                    </Badge>
                                                </div>
                                                <div className="p-3 rounded-lg bg-slate-800/50">
                                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                                        <Clock className="h-4 w-4" />
                                                        Verified At
                                                    </div>
                                                    <p className="text-white font-medium">
                                                        {new Date(result.proofTimestamp!).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Info */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-slate-500">
                            This verification uses Zero-Knowledge Proof technology.
                            <br />
                            No sensitive document data is revealed during verification.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
