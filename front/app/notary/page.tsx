"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import {
    Stamp,
    FileText,
    Clock,
    CheckCircle,
    Eye,
    FileCheck
} from "lucide-react"

interface NotarizationRequest {
    id: string
    type: string
    requestorID: string
    requestedAt: string
}

// Mock data
const mockNotarizationQueue: NotarizationRequest[] = [
    { id: "DOC-012", type: "Power of Attorney", requestorID: "CITIZEN-789", requestedAt: "2024-12-12T11:00:00Z" },
    { id: "DOC-013", type: "Affidavit", requestorID: "CITIZEN-012", requestedAt: "2024-12-11T16:30:00Z" },
]

const mockStats = {
    pendingQueue: 2,
    completedToday: 3,
    completedMonth: 28
}

export default function NotaryDashboard() {
    useEffect(() => {
        const role = localStorage.getItem("userRole")
        if (role !== "notary") {
            window.location.href = "/auth"
        }
    }, [])

    const handleNotarize = (docId: string) => {
        console.log("Notarizing:", docId)
        // In production: call smart contract createAttestation
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Notary Dashboard</h1>
                    <p className="text-slate-400">Manage notarization requests and create attestations</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
                                    <Clock className="h-5 w-5 text-rose-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.pendingQueue}</p>
                                    <p className="text-xs text-slate-400">Pending Queue</p>
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
                                    <p className="text-2xl font-bold text-white">{mockStats.completedToday}</p>
                                    <p className="text-xs text-slate-400">Completed Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Stamp className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.completedMonth}</p>
                                    <p className="text-xs text-slate-400">This Month</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Notarization Queue */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Notarization Queue</CardTitle>
                        <CardDescription className="text-slate-400">
                            Documents awaiting notarization
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {mockNotarizationQueue.length === 0 ? (
                            <div className="text-center py-8">
                                <Stamp className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No pending requests</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mockNotarizationQueue.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20">
                                                <FileText className="h-5 w-5 text-rose-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{doc.id}</p>
                                                <p className="text-sm text-slate-400">{doc.type}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-slate-500 hidden md:block">
                                                {new Date(doc.requestedAt).toLocaleDateString()}
                                            </p>
                                            <Button variant="outline" size="sm" className="border-slate-600">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-rose-600 hover:bg-rose-700"
                                                onClick={() => handleNotarize(doc.id)}
                                            >
                                                <FileCheck className="h-4 w-4 mr-1" />
                                                Notarize
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RoleSidebar>
    )
}
