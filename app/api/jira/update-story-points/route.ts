import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { JiraClient } from '@/lib/jiraClient'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { issueKey, storyPoints, cloudId, addComment } = body

    if (!issueKey || storyPoints === undefined || !cloudId) {
      return NextResponse.json(
        { error: 'issueKey, storyPoints, and cloudId are required' },
        { status: 400 }
      )
    }

    const jiraClient = new JiraClient(session.accessToken, cloudId)
    
    await jiraClient.updateStoryPoints(issueKey, storyPoints)

    if (addComment) {
      const commentText = `Story points updated to ${storyPoints} via Planning Poker session.`
      await jiraClient.addComment(issueKey, commentText)
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully updated ${issueKey} with ${storyPoints} story points` 
    })
  } catch (error) {
    console.error('Error updating Jira story points:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update story points' },
      { status: 500 }
    )
  }
}
