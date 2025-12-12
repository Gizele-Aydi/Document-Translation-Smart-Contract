"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function DocumentRegisterForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    documentID: "",
    ownerID: "",
    issuer: "",
    docType: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate API call to smart contract
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[v0] Registering document:", formData)

      toast({
        title: "Document Registered",
        description: `Document ${formData.documentID} has been successfully registered.`,
      })

      setFormData({ documentID: "", ownerID: "", issuer: "", docType: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to register document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Register New Document</CardTitle>
            <CardDescription>Submit a new document for translation</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="documentID">Document ID</Label>
            <Input
              id="documentID"
              placeholder="DOC-001"
              value={formData.documentID}
              onChange={(e) => setFormData({ ...formData, documentID: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ownerID">Owner ID</Label>
            <Input
              id="ownerID"
              placeholder="CITIZEN-123"
              value={formData.ownerID}
              onChange={(e) => setFormData({ ...formData, ownerID: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="issuer">Issuing Authority</Label>
            <Input
              id="issuer"
              placeholder="Ministry of Education"
              value={formData.issuer}
              onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="docType">Document Type</Label>
            <Select value={formData.docType} onValueChange={(value) => setFormData({ ...formData, docType: value })}>
              <SelectTrigger id="docType">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diploma">Diploma</SelectItem>
                <SelectItem value="transcript">Transcript</SelectItem>
                <SelectItem value="certificate">Certificate</SelectItem>
                <SelectItem value="license">License</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registering..." : "Register Document"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
