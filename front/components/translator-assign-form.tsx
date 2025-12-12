"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TranslatorAssignForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    documentID: "",
    translatorID: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("[v0] Assigning translator:", formData)

      toast({
        title: "Translator Assigned",
        description: `Translator ${formData.translatorID} has been assigned to document ${formData.documentID}.`,
      })

      setFormData({ documentID: "", translatorID: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to assign translator. Please try again.",
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
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Assign Translator</CardTitle>
            <CardDescription>Assign a translator to a submitted document</CardDescription>
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
            <Label htmlFor="translatorID">Translator ID</Label>
            <Input
              id="translatorID"
              placeholder="TRANSLATOR-456"
              value={formData.translatorID}
              onChange={(e) => setFormData({ ...formData, translatorID: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Assigning..." : "Assign Translator"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
