"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TranslationSubmitForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    documentID: "",
    translationID: "",
    targetLanguage: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[v0] Submitting translation:", formData)

      toast({
        title: "Translation Submitted",
        description: `Translation ${formData.translationID} has been submitted for QA review.`,
      })

      setFormData({ documentID: "", translationID: "", targetLanguage: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit translation. Please try again.",
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
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Submit Translation</CardTitle>
            <CardDescription>Submit completed translation for QA review</CardDescription>
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
            <Label htmlFor="targetLanguage">Target Language</Label>
            <Select
              value={formData.targetLanguage}
              onValueChange={(value) => setFormData({ ...formData, targetLanguage: value })}
            >
              <SelectTrigger id="targetLanguage">
                <SelectValue placeholder="Select target language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Translation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
