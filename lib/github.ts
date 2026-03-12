import { Octokit } from '@octokit/rest'

let octokitInstance: Octokit | null = null

export function getGitHubClient() {
  if (!octokitInstance) {
    const token = process.env.GITHUB_TOKEN
    if (!token) {
      throw new Error('GITHUB_TOKEN not configured')
    }
    octokitInstance = new Octokit({ auth: token })
  }
  return octokitInstance
}

export async function listRepos(org: string) {
  const octokit = getGitHubClient()
  const { data } = await octokit.repos.listForOrg({
    org,
    type: 'all',
    sort: 'updated',
    per_page: 100,
  })
  return data
}

export async function getRepo(owner: string, repo: string) {
  const octokit = getGitHubClient()
  const { data } = await octokit.repos.get({ owner, repo })
  return data
}
