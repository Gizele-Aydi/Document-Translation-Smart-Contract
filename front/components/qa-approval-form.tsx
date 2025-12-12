"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function QAApprovalForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    documentID: "",
    translationID: "",
    qaOfficerID: "",
    rejectionReason: "",
  })

  const handleApprove = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[v0] Approving translation:", {
        documentID: formData.documentID,
        translationID: formData.translationID,
        qaOfficerID: formData.qaOfficerID,
      })

      toast({
        title: "Translation Approved",
        description: `Translation ${formData.translationID} has been approved.`,
      })

      setFormData({ documentID: "", translationID: "", qaOfficerID: "", rejectionReason: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve translation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!formData.rejectionReason) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting the translation.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[v0] Rejecting translation:", formData)

      toast({
        title: "Translation Rejected",
        description: `Translation ${formData.translationID} has been rejected.`,
      })

      setFormData({ documentID: "", translationID: "", qaOfficerID: "", rejectionReason: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject translation. Please try again.",
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
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>QA Review</CardTitle>
            <CardDescription>Approve or reject submitted translations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
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
            <Label htmlFor="translationID">Translation ID</Label>
            <Input
              id="translationID"
              placeholder="TRANS-001"
              value={formData.translationID}
              onChange={(e) => setFormData({ ...formData, translationID: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qaOfficerID">QA Officer ID</Label>
            <Input
              id="qaOfficerID"
              placeholder="QA-789"
              value={formData.qaOfficerID}
              onChange={(e) => setFormData({ ...formData, qaOfficerID: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
            <Textarea
              id="rejectionReason"
              placeholder="Provide details if rejecting the translation..."
              value={formData.rejectionReason}
              onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={handleApprove}
              disabled={loading || !formData.documentID || !formData.translationID || !formData.qaOfficerID}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading || !formData.documentID || !formData.translationID}
              variant="destructive"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
