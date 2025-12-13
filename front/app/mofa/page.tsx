"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Globe,
    FileText,
    Clock,
    CheckCircle,
    Award,
    ArrowRight,
    Eye,
    Stamp,
    Building
} from "lucide-react"
import Link from "next/link"

interface LegalizationDocument {
    id: string
    type: string
    currentStep: string
    mojApprovedAt: string
}

// Mock data
const mockLegalizationQueue: LegalizationDocument[] = [
    { id: "DOC-009", type: "Diploma", currentStep: "MOFA", mojApprovedAt: "2024-12-12T10:00:00Z" },
    { id: "DOC-010", type: "Marriage Certificate", currentStep: "MOFA", mojApprovedAt: "2024-12-11T15:00:00Z" },
]

const mockApostilleQueue = [
    { id: "DOC-011", type: "Birth Certificate", requestedAt: "2024-12-12T09:00:00Z" },
]

const mockStats = {
    pendingLegalization: 2,
    pendingApostille: 1,
    issuedToday: 4,
    embassyQueue: 3
}

export default function MoFADashboard() {
    useEffect(() => {
        const role = localStorage.getItem("userRole")
        if (role !== "mofa") {
            window.location.href = "/auth"
        }
    }, [])

    const handleLegalize = (docId: string) => {
        console.log("Legalizing:", docId)
        // In production: call smart contract validateStep
    }

    const handleIssueApostille = (docId: string) => {
        console.log("Issuing Apostille:", docId)
        // In production: call smart contract issueApostille
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Ministry of Foreign Affairs</h1>
                    <p className="text-slate-400">Manage legalization and Apostille certificates</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                    <Globe className="h-5 w-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.pendingLegalization}</p>
                                    <p className="text-xs text-slate-400">Pending Legalization</p>
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
                                    <p className="text-2xl font-bold text-white">{mockStats.pendingApostille}</p>
                                    <p className="text-xs text-slate-400">Pending Apostille</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <CheckCircle className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.issuedToday}</p>
                                    <p className="text-xs text-slate-400">Issued Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                    <Building className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{mockStats.embassyQueue}</p>
                                    <p className="text-xs text-slate-400">Embassy Queue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="legalization" className="space-y-4">
                    <TabsList className="bg-slate-800 border-slate-700">
                        <TabsTrigger value="legalization" className="data-[state=active]:bg-green-600">
                            <Globe className="h-4 w-4 mr-2" />
                            Legalization Queue
                        </TabsTrigger>
                        <TabsTrigger value="apostille" className="data-[state=active]:bg-green-600">
                            <Award className="h-4 w-4 mr-2" />
                            Apostille Requests
                        </TabsTrigger>
                        <TabsTrigger value="embassy" className="data-[state=active]:bg-green-600">
                            <Building className="h-4 w-4 mr-2" />
                            Embassy Queue
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="legalization">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Legalization Step 2 Queue</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Documents approved by MoJ awaiting MoFA legalization
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockLegalizationQueue.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                                    <FileText className="h-5 w-5 text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{doc.id}</p>
                                                    <p className="text-sm text-slate-400">{doc.type}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-amber-500/20 text-amber-400">MoJ Approved</Badge>
                                                <Button variant="outline" size="sm" className="border-slate-600">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleLegalize(doc.id)}
                                                >
                                                    <Stamp className="h-4 w-4 mr-1" />
                                                    Legalize
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="apostille">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Apostille Requests</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Issue Apostille certificates for international use
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {mockApostilleQueue.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                                                    <Award className="h-5 w-5 text-purple-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{doc.id}</p>
                                                    <p className="text-sm text-slate-400">{doc.type}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-purple-600 hover:bg-purple-700"
                                                    onClick={() => handleIssueApostille(doc.id)}
                                                >
                                                    <Award className="h-4 w-4 mr-1" />
                                                    Issue Apostille
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="embassy">
                        <Card className="bg-slate-800/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Embassy Legalization Queue</CardTitle>
                                <CardDescription className="text-slate-400">
                                    Documents requiring embassy/consulate legalization
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Building className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">Embassy coordination view</p>
                                    <p className="text-sm text-slate-500">Track documents sent to embassies</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </RoleSidebar>
    )
}
