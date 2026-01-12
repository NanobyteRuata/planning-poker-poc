interface JiraIssue {
  id: string
  key: string
  fields: {
    summary: string
    description?: any
    issuetype: {
      name: string
      iconUrl: string
    }
    status: {
      name: string
    }
    [key: string]: any
  }
}

interface JiraSearchResponse {
  issues: JiraIssue[]
  total: number
}

interface JiraResource {
  id: string
  url: string
  name: string
  scopes: string[]
  avatarUrl: string
}

export class JiraClient {
  private accessToken: string
  private cloudId?: string

  constructor(accessToken: string, cloudId?: string) {
    this.accessToken = accessToken
    this.cloudId = cloudId
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Jira API error: ${response.status} - ${error}`)
    }

    // Handle 204 No Content responses (e.g., from PUT/DELETE requests)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return null
    }

    return response.json()
  }

  async getAccessibleResources(): Promise<JiraResource[]> {
    return this.fetchWithAuth('https://api.atlassian.com/oauth/token/accessible-resources')
  }

  async searchIssues(jql: string, maxResults: number = 50): Promise<JiraSearchResponse> {
    if (!this.cloudId) {
      throw new Error('Cloud ID is required for searching issues')
    }

    return this.fetchWithAuth(
      `https://api.atlassian.com/ex/jira/${this.cloudId}/rest/api/3/search/jql`,
      {
        method: 'POST',
        body: JSON.stringify({
          jql,
          maxResults,
          fields: ['summary', 'description', 'issuetype', 'status'],
        }),
      }
    )
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    if (!this.cloudId) {
      throw new Error('Cloud ID is required for getting issue')
    }

    return this.fetchWithAuth(
      `https://api.atlassian.com/ex/jira/${this.cloudId}/rest/api/3/issue/${issueKey}`
    )
  }

  async getStoryPointsFieldId(): Promise<string | null> {
    if (!this.cloudId) {
      throw new Error('Cloud ID is required')
    }

    const fields = await this.fetchWithAuth(
      `https://api.atlassian.com/ex/jira/${this.cloudId}/rest/api/3/field`
    )

    const storyPointsField = fields.find(
      (field: any) => 
        field.name === 'Story Points' || 
        field.name === 'Story point estimate' ||
        field.key === 'customfield_10016'
    )

    return storyPointsField?.key || null
  }

  async updateStoryPoints(issueKey: string, storyPoints: number): Promise<void> {
    if (!this.cloudId) {
      throw new Error('Cloud ID is required for updating issue')
    }

    const fieldId = await this.getStoryPointsFieldId()
    
    if (!fieldId) {
      throw new Error('Story Points field not found in Jira instance')
    }

    await this.fetchWithAuth(
      `https://api.atlassian.com/ex/jira/${this.cloudId}/rest/api/3/issue/${issueKey}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          fields: {
            [fieldId]: storyPoints,
          },
        }),
      }
    )
  }

  async addComment(issueKey: string, comment: string): Promise<void> {
    if (!this.cloudId) {
      throw new Error('Cloud ID is required for adding comment')
    }

    await this.fetchWithAuth(
      `https://api.atlassian.com/ex/jira/${this.cloudId}/rest/api/3/issue/${issueKey}/comment`,
      {
        method: 'POST',
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment,
                  },
                ],
              },
            ],
          },
        }),
      }
    )
  }
}
