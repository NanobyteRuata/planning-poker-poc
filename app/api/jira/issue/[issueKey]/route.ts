import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { JiraClient } from '@/lib/jiraClient'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueKey: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { issueKey } = await params
    const searchParams = request.nextUrl.searchParams
    const cloudId = searchParams.get('cloudId')

    if (!cloudId) {
      return NextResponse.json(
        { error: 'cloudId is required' },
        { status: 400 }
      )
    }

    const jiraClient = new JiraClient(session.accessToken, cloudId)
    const issue = await jiraClient.getIssue(issueKey)

    return NextResponse.json({ issue })
  } catch (error) {
    console.error('Error fetching Jira issue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Jira issue' },
      { status: 500 }
    )
  }
}
