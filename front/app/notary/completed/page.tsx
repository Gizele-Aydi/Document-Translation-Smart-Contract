"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import {
    FileCheck,
    ArrowLeft,
    CheckCircle,
    Eye,
    Download,
    Calendar
} from "lucide-react"
import Link from "next/link"

interface CompletedAttestation {
    id: string
    documentID: string
    documentType: string
    attestationType: string
    issuedAt: string
    expiresAt?: string
    requestorName: string
}

// Mock data
const mockCompleted: CompletedAttestation[] = [
    {
        id: "ATT-001",
        documentID: "DOC-AAA",
        documentType: "Power of Attorney",
        attestationType: "Notarization",
        issuedAt: "2024-12-12T10:00:00Z",
        expiresAt: "2025-12-12T10:00:00Z",
        requestorName: "Ali Ben Mohamed"
    },
    {
        id: "ATT-002",
        documentID: "DOC-BBB",
        documentType: "Affidavit",
        attestationType: "Oath",
        issuedAt: "2024-12-11T15:00:00Z",
        requestorName: "Sonia Bouazizi"
    },
    {
        id: "ATT-003",
        documentID: "DOC-CCC",
        documentType: "Contract Copy",
        attestationType: "Certification of Copy",
        issuedAt: "2024-12-10T09:00:00Z",
        expiresAt: "2026-12-10T09:00:00Z",
        requestorName: "XYZ Company"
    },
]

export default function NotaryCompletedPage() {
    const [attestations] = useState(mockCompleted)

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/notary" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Completed Attestations</h1>
                    <p className="text-slate-400">Your issued attestations and certifications</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                    <CheckCircle className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{attestations.length}</p>
                                    <p className="text-xs text-slate-400">Total Issued</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Calendar className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {attestations.filter(a =>
                                            new Date(a.issuedAt).toDateString() === new Date().toDateString()
                                        ).length + 2}
                                    </p>
                                    <p className="text-xs text-slate-400">This Week</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                                    <FileCheck className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">28</p>
                                    <p className="text-xs text-slate-400">This Month</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Attestations List */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            Issued Attestations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {attestations.map((attestation) => (
                                <div
                                    key={attestation.id}
                                    className="p-4 rounded-lg bg-slate-900/50 border border-green-500/20"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                                                <CheckCircle className="h-6 w-6 text-green-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-white">{attestation.id}</p>
                                                    <Badge className="bg-rose-500/20 text-rose-300">
                                                        {attestation.attestationType}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-400">
                                                    {attestation.documentType} • {attestation.requestorName}
                                                </p>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                                    <span>Issued: {new Date(attestation.issuedAt).toLocaleDateString()}</span>
                                                    {attestation.expiresAt && (
                                                        <span>Expires: {new Date(attestation.expiresAt).toLocaleDateString()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button variant="outline" size="sm" className="border-slate-600">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button variant="outline" size="sm" className="border-green-600 text-green-400">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </RoleSidebar>
    )
}
