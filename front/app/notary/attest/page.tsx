"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RoleSidebar } from "@/components/role-sidebar"
import { useToast } from "@/hooks/use-toast"
import {
    FileCheck,
    ArrowLeft,
    CheckCircle,
    Stamp,
    Shield
} from "lucide-react"
import Link from "next/link"

export default function NotaryAttestPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [certified, setCertified] = useState(false)
    const [formData, setFormData] = useState({
        documentID: "",
        attestationType: "",
        notes: "",
        expiryMonths: "12"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!certified) {
            toast({
                title: "Certification Required",
                description: "You must certify this attestation.",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            await new Promise(resolve => setTimeout(resolve, 2000))

            const attestationId = `ATT-${Date.now().toString(36).toUpperCase()}`

            toast({
                title: "Attestation Created",
                description: `Attestation ${attestationId} has been recorded on the blockchain.`,
            })

            setSubmitted(true)
        } catch (error) {
            toast({
                title: "Creation Failed",
                description: "Please try again.",
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
                        <h1 className="text-2xl font-bold text-white mb-2">Attestation Created!</h1>
                        <p className="text-slate-400 mb-6">
                            The attestation has been recorded on the blockchain.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/notary/queue">
                                <Button variant="outline">Back to Queue</Button>
                            </Link>
                            <Button
                                className="bg-rose-600 hover:bg-rose-700"
                                onClick={() => {
                                    setSubmitted(false)
                                    setFormData({ documentID: "", attestationType: "", notes: "", expiryMonths: "12" })
                                    setCertified(false)
                                }}
                            >
                                Create Another
                            </Button>
                        </div>
                    </div>
                </div>
            </RoleSidebar>
        )
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/notary" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="max-w-2xl mx-auto">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
                                    <FileCheck className="h-5 w-5 text-rose-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-white">Create Attestation</CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Create a new notarized attestation
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Document ID */}
                                <div className="space-y-2">
                                    <Label htmlFor="docId" className="text-slate-300">Document ID</Label>
                                    <Input
                                        id="docId"
                                        placeholder="Enter document ID or select from queue"
                                        value={formData.documentID}
                                        onChange={(e) => setFormData({ ...formData, documentID: e.target.value })}
                                        className="bg-slate-900 border-slate-700 text-white"
                                        required
                                    />
                                </div>

                                {/* Attestation Type */}
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Attestation Type</Label>
                                    <Select
                                        value={formData.attestationType}
                                        onValueChange={(value) => setFormData({ ...formData, attestationType: value })}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                            <SelectValue placeholder="Select attestation type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="notarization">Notarization</SelectItem>
                                            <SelectItem value="certification">Certification of Copy</SelectItem>
                                            <SelectItem value="signature_verification">Signature Verification</SelectItem>
                                            <SelectItem value="oath">Oath / Affirmation</SelectItem>
                                            <SelectItem value="acknowledgment">Acknowledgment</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Validity Period */}
                                <div className="space-y-2">
                                    <Label className="text-slate-300">Validity Period</Label>
                                    <Select
                                        value={formData.expiryMonths}
                                        onValueChange={(value) => setFormData({ ...formData, expiryMonths: value })}
                                    >
                                        <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                                            <SelectValue placeholder="Select validity period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="6">6 Months</SelectItem>
                                            <SelectItem value="12">1 Year</SelectItem>
                                            <SelectItem value="24">2 Years</SelectItem>
                                            <SelectItem value="60">5 Years</SelectItem>
                                            <SelectItem value="0">No Expiry</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-slate-300">Additional Notes (Optional)</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Any additional notes or conditions..."
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        className="bg-slate-900 border-slate-700 text-white min-h-[100px]"
                                    />
                                </div>

                                {/* Certification */}
                                <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="certify"
                                            checked={certified}
                                            onCheckedChange={(checked) => setCertified(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div>
                                            <Label htmlFor="certify" className="text-rose-300 cursor-pointer">
                                                <Shield className="h-4 w-4 inline mr-2" />
                                                Notary Certification
                                            </Label>
                                            <p className="text-sm text-slate-400 mt-1">
                                                I certify that I have verified the identity of the parties involved
                                                and attest to the authenticity of this document.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-rose-600 hover:bg-rose-700"
                                    disabled={loading || !certified || !formData.documentID || !formData.attestationType}
                                >
                                    <Stamp className="h-4 w-4 mr-2" />
                                    {loading ? "Creating Attestation..." : "Create Attestation"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </RoleSidebar>
    )
}
