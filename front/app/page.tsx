"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentRegisterForm } from "@/components/document-register-form"
import { TranslatorAssignForm } from "@/components/translator-assign-form"
import { TranslationSubmitForm } from "@/components/translation-submit-form"
import { QAApprovalForm } from "@/components/qa-approval-form"
import { DocumentSearch } from "@/components/document-search"
import { FileText, Users, Upload, CheckCircle, Search } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-balance">Document Translation Management</h1>
              <p className="text-sm text-muted-foreground">Blockchain-powered document translation system</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="register" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="register" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Register</span>
            </TabsTrigger>
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Assign</span>
            </TabsTrigger>
            <TabsTrigger value="submit" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Submit</span>
            </TabsTrigger>
            <TabsTrigger value="qa" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">QA</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <DocumentRegisterForm />
          </TabsContent>

          <TabsContent value="assign">
            <TranslatorAssignForm />
          </TabsContent>

          <TabsContent value="submit">
            <TranslationSubmitForm />
          </TabsContent>

          <TabsContent value="qa">
            <QAApprovalForm />
          </TabsContent>

          <TabsContent value="search">
            <DocumentSearch />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
