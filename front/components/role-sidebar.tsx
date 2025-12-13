"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    User,
    Languages,
    Scale,
    Globe,
    Stamp,
    FileText,
    Upload,
    Search,
    CreditCard,
    Shield,
    History,
    CheckCircle,
    Clock,
    LogOut,
    Menu,
    X,
    Home,
    Users,
    Award,
    FileCheck
} from "lucide-react"

interface SidebarProps {
    children: React.ReactNode
}

const roleConfig: Record<string, {
    name: string
    icon: React.ElementType
    color: string
    menuItems: { label: string; href: string; icon: React.ElementType }[]
}> = {
    client: {
        name: "Client",
        icon: User,
        color: "bg-blue-500",
        menuItems: [
            { label: "Dashboard", href: "/client", icon: Home },
            { label: "Submit Document", href: "/client/submit", icon: Upload },
            { label: "My Documents", href: "/client/documents", icon: FileText },
            { label: "Track Status", href: "/client/track", icon: Search },
            { label: "Payments", href: "/client/payments", icon: CreditCard },
            { label: "Request Apostille", href: "/client/apostille", icon: Award },
            { label: "Verify Document", href: "/verify", icon: Shield },
        ]
    },
    translator: {
        name: "Translator",
        icon: Languages,
        color: "bg-purple-500",
        menuItems: [
            { label: "Dashboard", href: "/translator", icon: Home },
            { label: "Assigned Documents", href: "/translator/queue", icon: FileText },
            { label: "Submit Translation", href: "/translator/submit", icon: Upload },
            { label: "Completed", href: "/translator/completed", icon: CheckCircle },
            { label: "My License", href: "/translator/license", icon: Award },
        ]
    },
    moj: {
        name: "Ministry of Justice",
        icon: Scale,
        color: "bg-amber-500",
        menuItems: [
            { label: "Dashboard", href: "/moj", icon: Home },
            { label: "Pending Review", href: "/moj/pending", icon: Clock },
            { label: "Approve Translations", href: "/moj/approve", icon: CheckCircle },
            { label: "Legalization Step 1", href: "/moj/legalize", icon: FileCheck },
            { label: "Manage Translators", href: "/moj/translators", icon: Users },
            { label: "Audit Trail", href: "/moj/audit", icon: History },
        ]
    },
    mofa: {
        name: "Ministry of Foreign Affairs",
        icon: Globe,
        color: "bg-green-500",
        menuItems: [
            { label: "Dashboard", href: "/mofa", icon: Home },
            { label: "Pending Legalization", href: "/mofa/pending", icon: Clock },
            { label: "Legalization Step 2", href: "/mofa/legalize", icon: FileCheck },
            { label: "Issue Apostille", href: "/mofa/apostille", icon: Award },
            { label: "Embassy Queue", href: "/mofa/embassy", icon: Globe },
            { label: "Audit Trail", href: "/mofa/audit", icon: History },
        ]
    },
    notary: {
        name: "Notary",
        icon: Stamp,
        color: "bg-rose-500",
        menuItems: [
            { label: "Dashboard", href: "/notary", icon: Home },
            { label: "Notarization Queue", href: "/notary/queue", icon: Clock },
            { label: "Create Attestation", href: "/notary/attest", icon: FileCheck },
            { label: "Completed", href: "/notary/completed", icon: CheckCircle },
            { label: "Audit Trail", href: "/notary/audit", icon: History },
        ]
    }
}

export function RoleSidebar({ children }: SidebarProps) {
    const pathname = usePathname()
    const [role, setRole] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)

    useEffect(() => {
        const storedRole = localStorage.getItem("userRole")
        const storedUserId = localStorage.getItem("userId")
        setRole(storedRole)
        setUserId(storedUserId)
    }, [])

    const handleLogout = () => {
        localStorage.removeItem("userRole")
        localStorage.removeItem("userId")
        window.location.href = "/auth"
    }

    if (!role || !roleConfig[role]) {
        return <>{children}</>
    }

    const config = roleConfig[role]
    const RoleIcon = config.icon

    return (
        <div className="flex h-screen bg-slate-950">
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Sidebar */}
            <aside
                className={`
          fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="p-4 border-b border-slate-800">
                        <Link href={`/${role}`} className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-white text-sm">DocTranslate</h1>
                                <p className="text-xs text-slate-400">Blockchain System</p>
                            </div>
                        </Link>
                    </div>

                    {/* Role Badge */}
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.color}`}>
                                <RoleIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{config.name}</p>
                                <p className="text-xs text-slate-400 truncate">{userId}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <ScrollArea className="flex-1 p-4">
                        <nav className="space-y-1">
                            {config.menuItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                      ${isActive
                                                ? "bg-slate-800 text-white"
                                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                                            }
                    `}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </ScrollArea>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-800">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800/50"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-3" />
                            Switch Role
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                <div className="min-h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    {children}
                </div>
            </main>
        </div>
    )
}
