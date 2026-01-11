import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { JiraClient } from '@/lib/jiraClient'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const cloudId = searchParams.get('cloudId')

    if (!query || !cloudId) {
      return NextResponse.json(
        { error: 'Query and cloudId are required' },
        { status: 400 }
      )
    }

    const jiraClient = new JiraClient(session.accessToken, cloudId)
    
    const jql = query.includes('=') 
      ? query 
      : `text ~ "${query}*" OR key = "${query.toUpperCase()}" ORDER BY updated DESC`

    const results = await jiraClient.searchIssues(jql, 20)

    return NextResponse.json({ issues: results.issues, total: results.total })
  } catch (error) {
    console.error('Error searching Jira issues:', error)
    return NextResponse.json(
      { error: 'Failed to search Jira issues' },
      { status: 500 }
    )
  }
}
