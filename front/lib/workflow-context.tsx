"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

// Document status flow:
// SUBMITTED -> PENDING_PAYMENT -> PAID -> IN_TRANSLATION -> TRANSLATED -> PENDING_QA -> QA_COMPLETED 
// -> PENDING_MOJ -> MOJ_APPROVED -> PENDING_LEGALIZATION -> LEGALIZED -> APOSTILLED -> FINALIZED
// OR: -> PENDING_NOTARY -> NOTARIZED -> FINALIZED (notary route)

export type LegalizationRoute = "GOVERNMENT" | "NOTARY" | "NONE"

export interface UploadedFile {
    name: string
    size: number
    type: string
    uploadedAt: string
    uploadedBy: string
}

export interface Translation {
    translationID: string
    translatorID: string
    translatorName: string
    targetLanguage: string
    submittedAt: string
    qaStatus: "PENDING_QA" | "QA_APPROVED" | "QA_REJECTED"
    qaFeedback?: string
    file?: UploadedFile
}

export interface LegalizationStep {
    step: string
    completedBy?: string
    completedAt?: string
    status: "PENDING" | "COMPLETED" | "REJECTED"
}

export interface Document {
    id: string
    type: string
    issuer: string
    ownerID: string
    ownerName: string
    sourceLanguage: string
    targetLanguage: string
    status: string
    submittedAt: string

    // Original file
    originalFile?: UploadedFile

    // Legalization route choice
    legalizationRoute: LegalizationRoute

    // Payment
    paymentStatus: "PENDING" | "PAID" | "NOT_REQUIRED"
    paymentAmount: number
    paidAt?: string

    // Translation
    translatorID?: string
    translatorName?: string
    assignedAt?: string
    translations: Translation[]
    translatedFile?: UploadedFile

    // MoJ
    mojApproval?: {
        officerID: string
        status: "APPROVED" | "REJECTED"
        reason?: string
        timestamp: string
    }

    // Legalization
    legalizationSteps: LegalizationStep[]

    // Apostille
    apostilleID?: string
    apostilleIssuedAt?: string
    apostilleRequested?: boolean

    // Notarization
    attestationID?: string
    attestedAt?: string

    // Timeline
    history: {
        action: string
        actor: string
        actorRole: string
        timestamp: string
        details: string
    }[]
}

export interface Translator {
    id: string
    name: string
    email: string
    licenseNumber: string
    status: "ACTIVE" | "SUSPENDED" | "EXPIRED"
    languages: string[]
}

interface WorkflowState {
    documents: Document[]
    translators: Translator[]
    currentUserId: string
    currentUserRole: string

    // Document actions
    submitDocument: (doc: Omit<Document, "id" | "status" | "submittedAt" | "history" | "translations" | "legalizationSteps" | "paymentStatus" | "paymentAmount" | "legalizationRoute"> & { originalFile?: UploadedFile }) => string
    makePayment: (docId: string) => void
    assignTranslator: (docId: string, translatorId: string) => void
    submitTranslation: (docId: string, translation: Omit<Translation, "qaStatus">) => void
    qaApprove: (docId: string, translationId: string) => void
    qaReject: (docId: string, translationId: string, reason: string) => void
    mojApprove: (docId: string, officerId: string) => void
    mojReject: (docId: string, officerId: string, reason: string) => void
    legalizationStep: (docId: string, step: string, officerId: string) => void
    issueApostille: (docId: string, officerId: string) => void
    notarize: (docId: string, notaryId: string) => void
    requestApostille: (docId: string, route: LegalizationRoute) => void

    // Translator actions
    suspendTranslator: (translatorId: string) => void
    reinstateTranslator: (translatorId: string) => void

    // Queries
    getDocument: (docId: string) => Document | undefined
    getDocumentsByStatus: (status: string) => Document[]
    getDocumentsByOwner: (ownerId: string) => Document[]
    getPendingForTranslator: (translatorId: string) => Document[]
    getDocumentsForNotary: () => Document[]
    getDocumentsForMoJ: () => Document[]
    getDocumentsForMoFA: () => Document[]
}

const WorkflowContext = createContext<WorkflowState | null>(null)

// Initial mock data - one document to track through the system
const initialDocuments: Document[] = [
    {
        id: "DOC-DEMO-001",
        type: "Diploma",
        issuer: "University of Tunis",
        ownerID: "CLIENT-001",
        ownerName: "Ahmed Belhaj",
        sourceLanguage: "Arabic",
        targetLanguage: "French",
        status: "SUBMITTED",
        submittedAt: new Date().toISOString(),
        legalizationRoute: "NONE",
        paymentStatus: "PENDING",
        paymentAmount: 50,
        translations: [],
        legalizationSteps: [],
        history: [
            {
                action: "DOCUMENT_SUBMITTED",
                actor: "CLIENT-001",
                actorRole: "Client",
                timestamp: new Date().toISOString(),
                details: "Document submitted for translation"
            }
        ]
    }
]

const initialTranslators: Translator[] = [
    {
        id: "TRANSLATOR-001",
        name: "Fatma Ben Ali",
        email: "fatma.benali@example.com",
        licenseNumber: "LIC-2024-001",
        status: "ACTIVE",
        languages: ["Arabic", "French", "English"]
    },
    {
        id: "TRANSLATOR-002",
        name: "Mohamed Souissi",
        email: "m.souissi@example.com",
        licenseNumber: "LIC-2024-002",
        status: "ACTIVE",
        languages: ["Arabic", "German"]
    }
]

export function WorkflowProvider({ children }: { children: ReactNode }) {
    const [documents, setDocuments] = useState<Document[]>([])
    const [translators, setTranslators] = useState<Translator[]>(initialTranslators)
    const [currentUserId, setCurrentUserId] = useState("")
    const [currentUserRole, setCurrentUserRole] = useState("")

    // Load from localStorage on mount
    useEffect(() => {
        const savedDocs = localStorage.getItem("workflow_documents")
        const savedTranslators = localStorage.getItem("workflow_translators")
        const userId = localStorage.getItem("userId") || ""
        const userRole = localStorage.getItem("userRole") || ""

        setDocuments(savedDocs ? JSON.parse(savedDocs) : initialDocuments)
        setTranslators(savedTranslators ? JSON.parse(savedTranslators) : initialTranslators)
        setCurrentUserId(userId)
        setCurrentUserRole(userRole)
    }, [])

    // Save to localStorage on change
    useEffect(() => {
        if (documents.length > 0) {
            localStorage.setItem("workflow_documents", JSON.stringify(documents))
        }
    }, [documents])

    useEffect(() => {
        localStorage.setItem("workflow_translators", JSON.stringify(translators))
    }, [translators])

    const addHistory = (doc: Document, action: string, actor: string, actorRole: string, details: string): Document => {
        return {
            ...doc,
            history: [
                ...doc.history,
                { action, actor, actorRole, timestamp: new Date().toISOString(), details }
            ]
        }
    }

    const submitDocument: WorkflowState["submitDocument"] = (docData) => {
        const id = `DOC-${Date.now().toString(36).toUpperCase()}`
        const newDoc: Document = {
            ...docData,
            id,
            status: "SUBMITTED",
            submittedAt: new Date().toISOString(),
            legalizationRoute: "NONE",
            paymentStatus: "PENDING",
            paymentAmount: 50,
            translations: [],
            legalizationSteps: [],
            history: [{
                action: "DOCUMENT_SUBMITTED",
                actor: docData.ownerID,
                actorRole: "Client",
                timestamp: new Date().toISOString(),
                details: `Document submitted for translation to ${docData.targetLanguage}`
            }]
        }
        setDocuments(prev => [...prev, newDoc])
        return id
    }

    const makePayment: WorkflowState["makePayment"] = (docId) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            let updated = { ...doc, paymentStatus: "PAID" as const, paidAt: new Date().toISOString(), status: "PAID" }
            return addHistory(updated, "PAYMENT_VERIFIED", doc.ownerID, "Client", "Payment verified - Ready for translator assignment")
        }))
    }

    const assignTranslator: WorkflowState["assignTranslator"] = (docId, translatorId) => {
        const translator = translators.find(t => t.id === translatorId)
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            let updated = {
                ...doc,
                translatorID: translatorId,
                translatorName: translator?.name,
                assignedAt: new Date().toISOString(),
                status: "IN_TRANSLATION"
            }
            return addHistory(updated, "TRANSLATOR_ASSIGNED", "SYSTEM", "System", `Assigned to translator ${translator?.name}`)
        }))
    }

    const submitTranslation: WorkflowState["submitTranslation"] = (docId, translation) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            const newTranslation: Translation = { ...translation, qaStatus: "PENDING_QA" }
            let updated = {
                ...doc,
                translations: [...doc.translations, newTranslation],
                translatedFile: translation.file,
                status: "PENDING_QA"
            }
            return addHistory(updated, "TRANSLATION_SUBMITTED", translation.translatorID, "Translator", "Translation submitted for QA review")
        }))
    }

    const qaApprove: WorkflowState["qaApprove"] = (docId, translationId) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            // Determine next status based on legalization route
            let nextStatus = "PENDING_MOJ" // Default - needs MoJ for government route or no route selected yet
            if (doc.legalizationRoute === "NOTARY") {
                nextStatus = "PENDING_NOTARY"
            }
            let updated = {
                ...doc,
                translations: doc.translations.map(t =>
                    t.translationID === translationId ? { ...t, qaStatus: "QA_APPROVED" as const } : t
                ),
                status: nextStatus
            }
            return addHistory(updated, "QA_APPROVED", "QA-001", "QA Officer", `Translation passed QA review - ${doc.legalizationRoute === "NOTARY" ? "Pending Notary" : "Pending MoJ approval"}`)
        }))
    }

    const qaReject: WorkflowState["qaReject"] = (docId, translationId, reason) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            let updated = {
                ...doc,
                translations: doc.translations.map(t =>
                    t.translationID === translationId ? { ...t, qaStatus: "QA_REJECTED" as const, qaFeedback: reason } : t
                ),
                status: "IN_TRANSLATION"
            }
            return addHistory(updated, "QA_REJECTED", "QA-001", "QA Officer", `Translation rejected: ${reason}`)
        }))
    }

    const mojApprove: WorkflowState["mojApprove"] = (docId, officerId) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            let updated = {
                ...doc,
                mojApproval: { officerID: officerId, status: "APPROVED" as const, timestamp: new Date().toISOString() },
                legalizationSteps: doc.legalizationSteps.map(s =>
                    s.step === "MoJ" ? { ...s, status: "COMPLETED" as const, completedBy: officerId, completedAt: new Date().toISOString() } : s
                ),
                status: "PENDING_MOFA"
            }
            return addHistory(updated, "MOJ_APPROVED", officerId, "MoJ Officer", "MoJ approved - Ready for MoFA legalization")
        }))
    }

    const mojReject: WorkflowState["mojReject"] = (docId, officerId, reason) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            let updated = {
                ...doc,
                mojApproval: { officerID: officerId, status: "REJECTED" as const, reason, timestamp: new Date().toISOString() },
                status: "MOJ_REJECTED"
            }
            return addHistory(updated, "MOJ_REJECTED", officerId, "MoJ Officer", `MoJ rejected: ${reason}`)
        }))
    }

    const legalizationStep: WorkflowState["legalizationStep"] = (docId, step, officerId) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            const updatedSteps = doc.legalizationSteps.map(s =>
                s.step === step ? { ...s, status: "COMPLETED" as const, completedBy: officerId, completedAt: new Date().toISOString() } : s
            )
            const allComplete = updatedSteps.every(s => s.status === "COMPLETED")
            let updated = {
                ...doc,
                legalizationSteps: updatedSteps,
                status: allComplete ? "LEGALIZED" : `PENDING_${updatedSteps.find(s => s.status === "PENDING")?.step.toUpperCase() || "APOSTILLE"}`
            }
            return addHistory(updated, `${step.toUpperCase()}_LEGALIZED`, officerId, `${step} Officer`, `${step} legalization step completed`)
        }))
    }

    const issueApostille: WorkflowState["issueApostille"] = (docId, officerId) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            let updated = {
                ...doc,
                apostilleID: `APO-${Date.now().toString(36).toUpperCase()}`,
                apostilleIssuedAt: new Date().toISOString(),
                status: "FINALIZED"
            }
            return addHistory(updated, "APOSTILLE_ISSUED", officerId, "MoFA Officer", "Apostille certificate issued - Document finalized")
        }))
    }

    const notarize: WorkflowState["notarize"] = (docId, notaryId) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            let updated = {
                ...doc,
                attestationID: `ATT-${Date.now().toString(36).toUpperCase()}`,
                attestedAt: new Date().toISOString(),
                status: "FINALIZED"
            }
            return addHistory(updated, "NOTARIZED", notaryId, "Notary", "Document notarized and apostilled by court notary - Document finalized")
        }))
    }

    const requestApostille: WorkflowState["requestApostille"] = (docId, route) => {
        setDocuments(prev => prev.map(doc => {
            if (doc.id !== docId) return doc
            let legalizationSteps: LegalizationStep[] = []
            if (route === "GOVERNMENT") {
                legalizationSteps = [
                    { step: "MoJ", status: "PENDING" },
                    { step: "MoFA", status: "PENDING" },
                ]
            } else if (route === "NOTARY") {
                legalizationSteps = [
                    { step: "Notary", status: "PENDING" },
                ]
            }
            let updated = {
                ...doc,
                legalizationRoute: route,
                apostilleRequested: true,
                legalizationSteps,
            }
            const routeText = route === "GOVERNMENT" ? "Ministry of Justice → Ministry of Foreign Affairs" : "Notary"
            return addHistory(updated, "APOSTILLE_REQUESTED", doc.ownerID, "Client", `Apostille requested via ${routeText} route`)
        }))
    }

    const suspendTranslator: WorkflowState["suspendTranslator"] = (translatorId) => {
        setTranslators(prev => prev.map(t =>
            t.id === translatorId ? { ...t, status: "SUSPENDED" as const } : t
        ))
    }

    const reinstateTranslator: WorkflowState["reinstateTranslator"] = (translatorId) => {
        setTranslators(prev => prev.map(t =>
            t.id === translatorId ? { ...t, status: "ACTIVE" as const } : t
        ))
    }

    const getDocument: WorkflowState["getDocument"] = (docId) => {
        return documents.find(d => d.id === docId)
    }

    const getDocumentsByStatus: WorkflowState["getDocumentsByStatus"] = (status) => {
        return documents.filter(d => d.status === status)
    }

    const getDocumentsByOwner: WorkflowState["getDocumentsByOwner"] = (ownerId) => {
        return documents.filter(d => d.ownerID === ownerId)
    }

    const getPendingForTranslator: WorkflowState["getPendingForTranslator"] = (translatorId) => {
        return documents.filter(d => d.translatorID === translatorId && d.status === "IN_TRANSLATION")
    }

    // Documents pending notary action (notary route selected)
    const getDocumentsForNotary: WorkflowState["getDocumentsForNotary"] = () => {
        return documents.filter(d =>
            d.legalizationRoute === "NOTARY" &&
            (d.status === "PENDING_NOTARY" || (d.status === "PENDING_QA" && d.translations.some(t => t.qaStatus === "QA_APPROVED")))
        )
    }

    // Documents pending MoJ (government route)
    const getDocumentsForMoJ: WorkflowState["getDocumentsForMoJ"] = () => {
        return documents.filter(d =>
            (d.legalizationRoute === "GOVERNMENT" || d.legalizationRoute === "NONE") &&
            d.status === "PENDING_MOJ"
        )
    }

    // Documents pending MoFA (government route, MoJ approved)
    const getDocumentsForMoFA: WorkflowState["getDocumentsForMoFA"] = () => {
        return documents.filter(d =>
            d.legalizationRoute === "GOVERNMENT" &&
            (d.status === "PENDING_MOFA" || d.mojApproval?.status === "APPROVED")
        )
    }

    return (
        <WorkflowContext.Provider value={{
            documents,
            translators,
            currentUserId,
            currentUserRole,
            submitDocument,
            makePayment,
            assignTranslator,
            submitTranslation,
            qaApprove,
            qaReject,
            mojApprove,
            mojReject,
            legalizationStep,
            issueApostille,
            notarize,
            requestApostille,
            suspendTranslator,
            reinstateTranslator,
            getDocument,
            getDocumentsByStatus,
            getDocumentsByOwner,
            getPendingForTranslator,
            getDocumentsForNotary,
            getDocumentsForMoJ,
            getDocumentsForMoFA,
        }}>
            {children}
        </WorkflowContext.Provider>
    )
}

export function useWorkflow() {
    const context = useContext(WorkflowContext)
    if (!context) {
        throw new Error("useWorkflow must be used within WorkflowProvider")
    }
    return context
}

// Helper to reset demo data
export function resetWorkflowData() {
    localStorage.setItem("workflow_documents", JSON.stringify(initialDocuments))
    localStorage.removeItem("workflow_translators")
    window.location.reload()
}
