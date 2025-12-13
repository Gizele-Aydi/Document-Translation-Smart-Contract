"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    User,
    Languages,
    Scale,
    Globe,
    Stamp,
    Shield,
    FileText
} from "lucide-react"

const roles = [
    {
        id: "client",
        name: "Client",
        description: "Citizens & Businesses submitting documents for translation and legalization",
        icon: User,
        color: "bg-blue-500",
        hoverColor: "hover:bg-blue-600",
        path: "/client"
    },
    {
        id: "translator",
        name: "Sworn Translator",
        description: "Licensed translators handling document translations",
        icon: Languages,
        color: "bg-purple-500",
        hoverColor: "hover:bg-purple-600",
        path: "/translator"
    },
    {
        id: "moj",
        name: "Ministry of Justice",
        description: "MoJ officers reviewing and approving translations",
        icon: Scale,
        color: "bg-amber-500",
        hoverColor: "hover:bg-amber-600",
        path: "/moj"
    },
    {
        id: "mofa",
        name: "Ministry of Foreign Affairs",
        description: "MoFA officers handling legalization and Apostille",
        icon: Globe,
        color: "bg-green-500",
        hoverColor: "hover:bg-green-600",
        path: "/mofa"
    },
    {
        id: "notary",
        name: "Notary",
        description: "Court notaries certifying documents",
        icon: Stamp,
        color: "bg-rose-500",
        hoverColor: "hover:bg-rose-600",
        path: "/notary"
    }
]

export default function AuthPage() {
    const [selectedRole, setSelectedRole] = useState<string | null>(null)

    const handleRoleSelect = (roleId: string) => {
        setSelectedRole(roleId)
        // Store in localStorage for demo purposes
        localStorage.setItem("userRole", roleId)
        localStorage.setItem("userId", `${roleId.toUpperCase()}-${Date.now().toString(36)}`)

        // Navigate to the role's dashboard
        const role = roles.find(r => r.id === roleId)
        if (role) {
            window.location.href = role.path
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-5xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25">
                            <FileText className="h-7 w-7 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Document Translation & Legalization
                    </h1>
                    <p className="text-slate-400 max-w-lg mx-auto">
                        Blockchain-powered system for secure document translation, apostille, and legalization
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <Shield className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-green-400">Powered by Hyperledger Fabric</span>
                    </div>
                </div>

                {/* Role Selection */}
                <div className="mb-6">
                    <h2 className="text-center text-lg font-medium text-slate-300 mb-6">
                        Select your role to continue
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roles.map((role) => {
                            const Icon = role.icon
                            return (
                                <Card
                                    key={role.id}
                                    className={`cursor-pointer transition-all duration-300 border-2 bg-slate-800/50 backdrop-blur hover:scale-[1.02] ${selectedRole === role.id
                                            ? "border-blue-500 shadow-lg shadow-blue-500/20"
                                            : "border-slate-700 hover:border-slate-500"
                                        }`}
                                    onClick={() => handleRoleSelect(role.id)}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${role.color}`}>
                                                <Icon className="h-5 w-5 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg text-white">{role.name}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-slate-400">
                                            {role.description}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </div>

                {/* Demo notice */}
                <div className="text-center">
                    <p className="text-sm text-slate-500">
                        Demo Mode: This simulates role-based access control.
                        <br />
                        In production, authentication would use digital certificates.
                    </p>
                </div>

                {/* Public Verification Link */}
                <div className="mt-8 text-center">
                    <div className="inline-block p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                        <p className="text-sm text-slate-400 mb-2">Need to verify a document?</p>
                        <Button
                            variant="outline"
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                            onClick={() => window.location.href = '/verify'}
                        >
                            <Shield className="h-4 w-4 mr-2" />
                            Public Document Verification
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
