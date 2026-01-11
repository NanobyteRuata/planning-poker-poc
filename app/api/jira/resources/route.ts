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

    const jiraClient = new JiraClient(session.accessToken)
    const resources = await jiraClient.getAccessibleResources()

    return NextResponse.json({ resources })
  } catch (error) {
    console.error('Error fetching Jira resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Jira resources' },
      { status: 500 }
    )
  }
}
