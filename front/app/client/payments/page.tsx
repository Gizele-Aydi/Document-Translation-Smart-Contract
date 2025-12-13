"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RoleSidebar } from "@/components/role-sidebar"
import { useWorkflow } from "@/lib/workflow-context"
import { useToast } from "@/hooks/use-toast"
import {
    CreditCard,
    FileText,
    ArrowLeft,
    CheckCircle,
    Clock,
    Receipt
} from "lucide-react"
import Link from "next/link"

export default function ClientPaymentsPage() {
    const { toast } = useToast()
    const { documents, makePayment } = useWorkflow()
    const [mounted, setMounted] = useState(false)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const handlePayment = async (docId: string) => {
        setProcessing(docId)

        try {
            await new Promise(resolve => setTimeout(resolve, 1500))

            makePayment(docId)

            toast({
                title: "Payment Successful!",
                description: "Your payment has been verified. The document is now ready for translator assignment.",
            })
        } catch (error) {
            toast({
                title: "Payment Failed",
                description: "Please try again or contact support.",
                variant: "destructive",
            })
        } finally {
            setProcessing(null)
        }
    }

    const pendingPayments = documents.filter(d => d.paymentStatus === "PENDING")
    const completedPayments = documents.filter(d => d.paymentStatus === "PAID")
    const totalPending = pendingPayments.reduce((sum, d) => sum + d.paymentAmount, 0)

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/client" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Payments</h1>
                    <p className="text-slate-400">Manage your translation and legalization fees</p>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                    <Clock className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{pendingPayments.length}</p>
                                    <p className="text-xs text-slate-400">Pending Payments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                                    <CreditCard className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{totalPending} TND</p>
                                    <p className="text-xs text-slate-400">Amount Due</p>
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
                                    <p className="text-2xl font-bold text-white">{completedPayments.length}</p>
                                    <p className="text-xs text-slate-400">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Pending Payments */}
                {pendingPayments.length > 0 && (
                    <Card className="bg-slate-800/50 border-slate-700 mb-6">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Clock className="h-5 w-5 text-amber-400" />
                                Pending Payments
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Pay these fees to proceed with your document processing
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {pendingPayments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-amber-500/20"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800">
                                                <FileText className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{doc.id}</p>
                                                <p className="text-sm text-slate-400">
                                                    {doc.type} • Translation Fee
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-white">{doc.paymentAmount} TND</p>
                                            </div>
                                            <Button
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handlePayment(doc.id)}
                                                disabled={processing === doc.id}
                                            >
                                                <CreditCard className="h-4 w-4 mr-2" />
                                                {processing === doc.id ? "Processing..." : "Pay Now"}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Payment History */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-blue-400" />
                            Payment History
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {completedPayments.length === 0 ? (
                            <div className="text-center py-8">
                                <Receipt className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                                <p className="text-slate-400">No completed payments yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {completedPayments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                                                <CheckCircle className="h-5 w-5 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{doc.id}</p>
                                                <p className="text-sm text-slate-400">{doc.type}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-white">{doc.paymentAmount} TND</p>
                                                <p className="text-xs text-slate-500">
                                                    {doc.paidAt && new Date(doc.paidAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge className="bg-green-500/20 text-green-400">Paid</Badge>
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
