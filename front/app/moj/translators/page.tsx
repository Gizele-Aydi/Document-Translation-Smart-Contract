"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RoleSidebar } from "@/components/role-sidebar"
import { useToast } from "@/hooks/use-toast"
import {
    Users,
    ArrowLeft,
    Search,
    Award,
    CheckCircle,
    XCircle,
    Clock,
    User,
    RefreshCw
} from "lucide-react"
import Link from "next/link"

interface Translator {
    id: string
    name: string
    email: string
    licenseNumber: string
    status: "ACTIVE" | "SUSPENDED" | "EXPIRED"
    languages: string[]
    completedTranslations: number
    expiryDate: string
}

// Mock data
const mockTranslators: Translator[] = [
    {
        id: "TRANS-001",
        name: "Ahmed Ben Ali",
        email: "ahmed.benali@example.com",
        licenseNumber: "LIC-2024-001",
        status: "ACTIVE",
        languages: ["Arabic", "French", "English"],
        completedTranslations: 156,
        expiryDate: "2025-12-31"
    },
    {
        id: "TRANS-002",
        name: "Fatma Trabelsi",
        email: "fatma.trabelsi@example.com",
        licenseNumber: "LIC-2024-002",
        status: "ACTIVE",
        languages: ["French", "Arabic"],
        completedTranslations: 89,
        expiryDate: "2025-06-30"
    },
    {
        id: "TRANS-003",
        name: "Mohamed Souissi",
        email: "m.souissi@example.com",
        licenseNumber: "LIC-2023-015",
        status: "SUSPENDED",
        languages: ["Arabic", "German"],
        completedTranslations: 42,
        expiryDate: "2024-12-31"
    },
    {
        id: "TRANS-004",
        name: "Amira Khaled",
        email: "a.khaled@example.com",
        licenseNumber: "LIC-2023-022",
        status: "EXPIRED",
        languages: ["English", "Spanish"],
        completedTranslations: 28,
        expiryDate: "2024-06-30"
    },
]

export default function MoJTranslatorsPage() {
    const { toast } = useToast()
    const [translators, setTranslators] = useState(mockTranslators)
    const [searchTerm, setSearchTerm] = useState("")
    const [processing, setProcessing] = useState<string | null>(null)

    const handleSuspend = async (translator: Translator) => {
        setProcessing(translator.id)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            setTranslators(prev => prev.map(t =>
                t.id === translator.id ? { ...t, status: "SUSPENDED" as const } : t
            ))
            toast({
                title: "License Suspended",
                description: `${translator.name}'s license has been suspended.`,
            })
        } finally {
            setProcessing(null)
        }
    }

    const handleReinstate = async (translator: Translator) => {
        setProcessing(translator.id)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            setTranslators(prev => prev.map(t =>
                t.id === translator.id ? { ...t, status: "ACTIVE" as const } : t
            ))
            toast({
                title: "License Reinstated",
                description: `${translator.name}'s license has been reinstated.`,
            })
        } finally {
            setProcessing(null)
        }
    }

    const handleRenew = async (translator: Translator) => {
        setProcessing(translator.id)
        try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const newExpiry = new Date()
            newExpiry.setFullYear(newExpiry.getFullYear() + 1)
            setTranslators(prev => prev.map(t =>
                t.id === translator.id ? {
                    ...t,
                    status: "ACTIVE" as const,
                    expiryDate: newExpiry.toISOString().split('T')[0]
                } : t
            ))
            toast({
                title: "License Renewed",
                description: `${translator.name}'s license has been renewed for 1 year.`,
            })
        } finally {
            setProcessing(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ACTIVE":
                return <Badge className="bg-green-500/20 text-green-400">Active</Badge>
            case "SUSPENDED":
                return <Badge className="bg-red-500/20 text-red-400">Suspended</Badge>
            case "EXPIRED":
                return <Badge className="bg-amber-500/20 text-amber-400">Expired</Badge>
            default:
                return null
        }
    }

    const filtered = translators.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <RoleSidebar>
            <div className="p-6 md:p-8">
                <Link href="/moj" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Manage Translators</h1>
                    <p className="text-slate-400">View and manage sworn translator licenses</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                    <Users className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{translators.length}</p>
                                    <p className="text-xs text-slate-400">Total</p>
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
                                    <p className="text-2xl font-bold text-white">
                                        {translators.filter(t => t.status === "ACTIVE").length}
                                    </p>
                                    <p className="text-xs text-slate-400">Active</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
                                    <XCircle className="h-5 w-5 text-red-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {translators.filter(t => t.status === "SUSPENDED").length}
                                    </p>
                                    <p className="text-xs text-slate-400">Suspended</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                                    <Clock className="h-5 w-5 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">
                                        {translators.filter(t => t.status === "EXPIRED").length}
                                    </p>
                                    <p className="text-xs text-slate-400">Expired</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search by name, ID, or license number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white"
                    />
                </div>

                {/* Translators List */}
                <Card className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white">Licensed Translators</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filtered.map((translator) => (
                                <div
                                    key={translator.id}
                                    className={`p-4 rounded-lg bg-slate-900/50 border ${translator.status === "SUSPENDED" ? "border-red-500/30" :
                                            translator.status === "EXPIRED" ? "border-amber-500/30" :
                                                "border-slate-700"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${translator.status === "ACTIVE" ? "bg-green-500/20" :
                                                    translator.status === "SUSPENDED" ? "bg-red-500/20" :
                                                        "bg-amber-500/20"
                                                }`}>
                                                <User className={`h-6 w-6 ${translator.status === "ACTIVE" ? "text-green-400" :
                                                        translator.status === "SUSPENDED" ? "text-red-400" :
                                                            "text-amber-400"
                                                    }`} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-white">{translator.name}</p>
                                                    {getStatusBadge(translator.status)}
                                                </div>
                                                <p className="text-sm text-slate-400">{translator.email}</p>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Award className="h-3 w-3" />
                                                        {translator.licenseNumber}
                                                    </span>
                                                    <span>|</span>
                                                    <span>{translator.languages.join(", ")}</span>
                                                    <span>|</span>
                                                    <span>{translator.completedTranslations} translations</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className="text-right mr-4 hidden md:block">
                                                <p className="text-xs text-slate-500">Expires</p>
                                                <p className={`text-sm ${new Date(translator.expiryDate) < new Date() ? "text-red-400" : "text-slate-300"
                                                    }`}>
                                                    {new Date(translator.expiryDate).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {translator.status === "ACTIVE" && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleSuspend(translator)}
                                                    disabled={processing === translator.id}
                                                >
                                                    {processing === translator.id ? "..." : "Suspend"}
                                                </Button>
                                            )}

                                            {translator.status === "SUSPENDED" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleReinstate(translator)}
                                                    disabled={processing === translator.id}
                                                >
                                                    {processing === translator.id ? "..." : "Reinstate"}
                                                </Button>
                                            )}

                                            {translator.status === "EXPIRED" && (
                                                <Button
                                                    size="sm"
                                                    className="bg-amber-600 hover:bg-amber-700"
                                                    onClick={() => handleRenew(translator)}
                                                    disabled={processing === translator.id}
                                                >
                                                    <RefreshCw className="h-4 w-4 mr-1" />
                                                    {processing === translator.id ? "..." : "Renew"}
                                                </Button>
                                            )}
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
