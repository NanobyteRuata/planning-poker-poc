'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ExternalLink, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { parseAdfToPlainText } from '@/lib/adfParser'

interface JiraResource {
  id: string
  url: string
  name: string
}

interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description?: string
    issuetype: {
      name: string
      iconUrl: string
    }
    status: {
      name: string
    }
  }
}

interface JiraTicketSelectorProps {
  onSelect: (issueKey: string, summary: string, cloudId: string, description?: string) => void
  selectedTicket?: string
}

export function JiraTicketSelector({ onSelect, selectedTicket }: JiraTicketSelectorProps) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [resources, setResources] = useState<JiraResource[]>([])
  const [selectedResource, setSelectedResource] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<JiraIssue[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (open && session && resources.length === 0) {
      loadResources()
    }
  }, [open, session])

  const loadResources = async () => {
    setIsLoadingResources(true)
    try {
      const response = await fetch('/api/jira/resources')
      if (response.ok) {
        const data = await response.json()
        setResources(data.resources)
        if (data.resources.length > 0) {
          setSelectedResource(data.resources[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading Jira resources:', error)
    } finally {
      setIsLoadingResources(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !selectedResource) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/jira/search?query=${encodeURIComponent(searchQuery)}&cloudId=${selectedResource}`
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.issues)
      }
    } catch (error) {
      console.error('Error searching Jira issues:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSelectIssue = (issue: JiraIssue) => {
    const description = issue.fields.description 
      ? parseAdfToPlainText(issue.fields.description)
      : undefined
    onSelect(issue.key, issue.fields.summary, selectedResource, description)
    setOpen(false)
    setSearchQuery('')
    setSearchResults([])
  }

  if (!session) {
    return (
      <div className="text-sm text-muted-foreground">
        Sign in with Atlassian to link Jira tickets
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Search className="mr-2 h-4 w-4" />
          {selectedTicket ? `Linked: ${selectedTicket}` : 'Link Jira Ticket'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Link Jira Ticket</DialogTitle>
          <DialogDescription>
            Search for a Jira issue to link to this story
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Jira Site</Label>
            {isLoadingResources ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading sites...
              </div>
            ) : (
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a Jira site" />
                </SelectTrigger>
                <SelectContent>
                  {resources.map((resource) => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Search Issues</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter issue key or search term..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching || !selectedResource}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Results</Label>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectIssue(issue)}
                  >
                    <img
                      src={issue.fields.issuetype.iconUrl}
                      alt={issue.fields.issuetype.name}
                      className="h-5 w-5 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{issue.key}</span>
                        <Badge variant="secondary" className="text-xs">
                          {issue.fields.status.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {issue.fields.summary}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && searchQuery && !isSearching && (
            <div className="text-center py-8 text-muted-foreground">
              No issues found. Try a different search term.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
