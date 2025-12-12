"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, History } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Document {
  documentID: string
  ownerID: string
  issuer: string
  docType: string
  status: string
  submissionTimestamp: string
  translatorID?: string
  translations: Array<{
    translationID: string
    targetLanguage: string
    verificationStatus: string
    timestamp: string
  }>
}

export function DocumentSearch() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [documentID, setDocumentID] = useState("")
  const [document, setDocument] = useState<Document | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[v0] Searching for document:", documentID)

      // Mock data for demonstration
      const mockDocument: Document = {
        documentID: documentID,
        ownerID: "CITIZEN-123",
        issuer: "Ministry of Education",
        docType: "Diploma",
        status: "QA_COMPLETED",
        submissionTimestamp: new Date().toISOString(),
        translatorID: "TRANSLATOR-456",
        translations: [
          {
            translationID: "TRANS-001",
            targetLanguage: "French",
            verificationStatus: "QA_APPROVED",
            timestamp: new Date().toISOString(),
          },
        ],
      }

      setDocument(mockDocument)

      toast({
        title: "Document Found",
        description: `Retrieved document ${documentID} successfully.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Document not found. Please check the ID and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SUBMITTED: "bg-blue-500",
      IN_TRANSLATION: "bg-yellow-500",
      TRANSLATED: "bg-orange-500",
      QA_COMPLETED: "bg-green-500",
      REQUIRES_RESUBMISSION: "bg-red-500",
    }
    return colors[status] || "bg-gray-500"
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Search Document</CardTitle>
              <CardDescription>Retrieve document details and translation history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="search">Document ID</Label>
              <Input
                id="search"
                placeholder="DOC-001"
                value={documentID}
                onChange={(e) => setDocumentID(e.target.value)}
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {document && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Document Details</CardTitle>
              <Badge className={getStatusColor(document.status)}>{document.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Document ID</p>
                <p className="text-sm font-mono">{document.documentID}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Owner ID</p>
                <p className="text-sm font-mono">{document.ownerID}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Issuing Authority</p>
                <p className="text-sm">{document.issuer}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Document Type</p>
                <p className="text-sm">{document.docType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Submission Date</p>
                <p className="text-sm">{new Date(document.submissionTimestamp).toLocaleString()}</p>
              </div>
              {document.translatorID && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Translator ID</p>
                  <p className="text-sm font-mono">{document.translatorID}</p>
                </div>
              )}
            </div>

            {document.translations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Translation History</h3>
                </div>
                <div className="space-y-3">
                  {document.translations.map((translation, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{translation.translationID}</p>
                        <p className="text-xs text-muted-foreground">
                          {translation.targetLanguage} • {new Date(translation.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={translation.verificationStatus === "QA_APPROVED" ? "default" : "secondary"}>
                        {translation.verificationStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
