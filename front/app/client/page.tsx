"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { DocumentTimelineCompact } from "@/components/document-timeline"
import { useWorkflow, resetWorkflowData } from "@/lib/workflow-context"
import {
    FileText,
    Upload,
    Clock,
    CheckCircle,
    AlertCircle,
    CreditCard,
    Award,
    ArrowRight,
    RefreshCw
} from "lucide-react"
import Link from "next/link"

export default function ClientDashboard() {
    const { documents } = useWorkflow()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const role = localStorage.getItem("userRole")
        if (role !== "client") {
            window.location.href = "/auth"
        }
    }, [])

    if (!mounted) return null

    const myDocs = documents // In real app, filter by owner
    const totalDocuments = myDocs.length
    const inProgress = myDocs.filter(d => !["FINALIZED", "MOJ_REJECTED"].includes(d.status)).length
    const completed = myDocs.filter(d => d.status === "FINALIZED").length
    const pendingPayment = myDocs.filter(d => d.paymentStatus === "PENDING").length

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            SUBMITTED: "bg-blue-500/20 text-blue-400",
            PAID: "bg-green-500/20 text-green-400",
            IN_TRANSLATION: "bg-yellow-500/20 text-yellow-400",
            PENDING_QA: "bg-orange-500/20 text-orange-400",
            PENDING_MOJ: "bg-purple-500/20 text-purple-400",
            PENDING_MOFA: "bg-indigo-500/20 text-indigo-400",
            LEGALIZED: "bg-teal-500/20 text-teal-400",
            FINALIZED: "bg-green-500/20 text-green-400",
            MOJ_REJECTED: "bg-red-500/20 text-red-400",
        }
        return colors[status] || "bg-slate-500/20 text-slate-400"
    }

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Welcome back!</h1>
                        <p className="text-slate-400">Track your documents and manage translations</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-slate-400"
                        onClick={() => resetWorkflowData()}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Demo
                    </Button>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Link href="/client/submit">
                        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm mb-1">New Document</p>
                                        <p className="text-white font-semibold">Submit for Translation</p>
                                    </div>
                                    <Upload className="h-8 w-8 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/client/apostille">
                        <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm mb-1">Apostille</p>
                                        <p className="text-white font-semibold">Request Certificate</p>
                                    </div>
                                    <Award className="h-8 w-8 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/client/track">
                        <Card className="bg-gradient-to-br from-amber-600 to-amber-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-amber-100 text-sm mb-1">Track</p>
                                        <p className="text-white font-semibold">Document Status</p>
                                    </div>
                                    <Clock className="h-8 w-8 text-amber-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/client/payments">
                        <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 cursor-pointer hover:scale-[1.02] transition-transform">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm mb-1">Payments</p>
                                        <p className="text-white font-semibold">View & Pay Fees</p>
                                    </div>
                                    <CreditCard className="h-8 w-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <FileText className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{totalDocuments}</p>
                                    <p className="text-xs text-slate-400">Total Documents</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/20">
                                    <Clock className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{inProgress}</p>
                                    <p className="text-xs text-slate-400">In Progress</p>
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
                                    <p className="text-2xl font-bold text-white">{completed}</p>
                                    <p className="text-xs text-slate-400">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/20">
                                    <AlertCircle className="h-5 w-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{pendingPayment}</p>
                                    <p className="text-xs text-slate-400">Pending Payment</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Documents */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-white">Your Documents</CardTitle>
                                <CardDescription className="text-slate-400">Track document workflow in real-time</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {myDocs.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No documents yet</p>
                                <Link href="/client/submit">
                                    <Button className="mt-4 bg-blue-600">Submit Your First Document</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {myDocs.map((doc) => (
                                    <Link key={doc.id} href={`/client/track?id=${doc.id}`}>
                                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                                                    <FileText className="h-5 w-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">{doc.id}</p>
                                                    <p className="text-sm text-slate-400">{doc.type} • {doc.targetLanguage}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="hidden md:block w-32">
                                                    <DocumentTimelineCompact currentStatus={doc.status} />
                                                </div>
                                                <Badge className={getStatusColor(doc.status)}>
                                                    {doc.status.replace(/_/g, " ")}
                                                </Badge>
                                                {doc.paymentStatus === "PENDING" && (
                                                    <Badge className="bg-red-500/20 text-red-400">Pay Now</Badge>
                                                )}
                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </RoleSidebar>
    )
}
