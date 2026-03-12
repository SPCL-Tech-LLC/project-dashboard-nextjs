'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface WorkSession {
  id: string
  project_name: string
  task_description?: string | null
  elapsed_hours?: number
  started_at: string
  user_id: string
  user_name?: string
  user_type?: string
}

interface UserSummary {
  user_id: string
  user_name: string
  user_type: string
  project_count: number
  projects: string[]
}

interface ProjectSummary {
  project_name: string
  active_count: number
  workers: string[]
}

interface ActivityEntry {
  id: string
  user_name: string
  project_name: string
  task_description?: string | null
  duration_minutes: number
  ended_at_iso: string
  user_type: string
}

interface Repo {
  name: string
  full_name?: string
  description: string | null
  html_url: string
  updated_at: string | null
  default_branch?: string
  language?: string | null
  stargazers_count?: number
  metadata?: {
    supabase_project_url?: string | null
    supabase_project_id?: string | null
    vercel_project_url?: string | null
    vercel_deployment_url?: string | null
  } | null
}

function formatElapsedTime(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} minutes`
  if (hours < 24) return `${hours.toFixed(1)} hours`
  return `${Math.floor(hours / 24)} days`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffHrs = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  if (diffHrs < 1) return `${Math.round(diffHrs * 60)} min ago`
  if (diffHrs < 24) return `${Math.round(diffHrs)} hr ago`
  if (diffHrs < 48) return 'yesterday'
  return date.toLocaleDateString()
}

function getUserName(userId: string): string {
  if (userId.includes('@')) {
    const name = userId.split('@')[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  }
  return userId
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('active')

  // Active work state
  const [mySessions, setMySessions] = useState<WorkSession[]>([])
  const [teamActivity, setTeamActivity] = useState<UserSummary[]>([])
  const [projectSummary, setProjectSummary] = useState<ProjectSummary[]>([])

  // Projects state
  const [repos, setRepos] = useState<Repo[]>([])
  const [reposLoading, setReposLoading] = useState(false)

  // Activity state
  const [activityFeed, setActivityFeed] = useState<ActivityEntry[]>([])
  const [activityLoading, setActivityLoading] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalProject, setModalProject] = useState('')
  const [modalDescription, setModalDescription] = useState('')

  // Settings state
  const [settingsUserId, setSettingsUserId] = useState('')
  const [settingsUserName, setSettingsUserName] = useState('')

  const router = useRouter()

  const loadActiveWork = useCallback(async (userId: string) => {
    try {
      const [sessionsRes, userSummaryRes, projectSummaryRes] = await Promise.all([
        fetch(`/api/active-work/active?user_id=${encodeURIComponent(userId)}`),
        fetch('/api/active-work/user-summary'),
        fetch('/api/active-work/project-summary'),
      ])

      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json()
        setMySessions(Array.isArray(sessions) ? sessions : [])
      }
      if (userSummaryRes.ok) {
        const summary = await userSummaryRes.json()
        setTeamActivity(
          (Array.isArray(summary) ? summary : []).filter(
            (u: UserSummary) => u.user_id !== userId
          )
        )
      }
      if (projectSummaryRes.ok) {
        const ps = await projectSummaryRes.json()
        setProjectSummary(Array.isArray(ps) ? ps : [])
      }
    } catch (error) {
      console.error('Error loading active work:', error)
    }
  }, [])

  const loadProjects = useCallback(async () => {
    setReposLoading(true)
    try {
      const res = await fetch('/api/repos')
      if (res.ok) {
        const data = await res.json()
        setRepos(data.repos || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setReposLoading(false)
    }
  }, [])

  const loadActivity = useCallback(async () => {
    setActivityLoading(true)
    try {
      const res = await fetch('/api/active-work/history?days=7')
      if (res.ok) {
        const data = await res.json()
        setActivityFeed(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error loading activity:', error)
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        const userId = session.user.email || session.user.id
        setSettingsUserId(userId)
        setSettingsUserName(getUserName(userId))
        loadActiveWork(userId)
        loadProjects()
      } else {
        router.push('/login')
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, loadActiveWork, loadProjects])

  // Auto-refresh active work every 30 seconds
  useEffect(() => {
    if (!user) return
    const userId = user.email || user.id
    const interval = setInterval(() => loadActiveWork(userId), 30000)
    return () => clearInterval(interval)
  }, [user, loadActiveWork])

  const switchView = (view: string) => {
    setActiveView(view)
    if (view === 'active' && user) loadActiveWork(user.email || user.id)
    if (view === 'projects') loadProjects()
    if (view === 'activity') loadActivity()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const hideStartWorkModal = () => {
    setShowModal(false)
    setModalProject('')
    setModalDescription('')
  }

  const startWork = async () => {
    if (!modalProject.trim() || !user) return
    const userId = user.email || user.id
    const userName = getUserName(userId)

    try {
      await fetch('/api/active-work/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          user_name: userName,
          project_name: modalProject,
          task_description: modalDescription || null,
          user_type: 'human',
        }),
      })
      hideStartWorkModal()
      loadActiveWork(userId)
    } catch (error) {
      console.error('Error starting work:', error)
    }
  }

  const stopWork = async (sessionId: string) => {
    try {
      await fetch(`/api/active-work/stop/${sessionId}`, { method: 'POST' })
      if (user) loadActiveWork(user.email || user.id)
    } catch (error) {
      console.error('Error stopping work:', error)
    }
  }

  const pingWork = async (sessionId: string) => {
    try {
      await fetch(`/api/active-work/ping/${sessionId}`, { method: 'POST' })
    } catch (error) {
      console.error('Error pinging work:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light neural-bg flex items-center justify-center">
        <div className="text-text-sub font-sans">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  const userId = user.email || user.id

  const navItems = [
    { id: 'active', label: 'Active Work' },
    { id: 'projects', label: 'Projects' },
    { id: 'kanban', label: 'Kanban' },
    { id: 'activity', label: 'Activity' },
  ]

  return (
    <div className="min-h-screen bg-background-light neural-bg relative">
      {/* Neural background nodes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] neural-node bg-primary/20 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] neural-node bg-accent-blue/10 -translate-x-1/3 translate-y-1/3" />
      </div>

      {/* Header */}
      <header className="backdrop-blur-md bg-surface-light/80 border-b border-primary/10 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl">hub</span>
              <h1 className="text-2xl font-bold text-text-main font-heading">
                SPCL Dashboard
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <nav className="flex gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => switchView(item.id)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      activeView === item.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-text-sub hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <button
                  onClick={() => switchView('settings')}
                  className={`px-3 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    activeView === 'settings'
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-text-sub hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">settings</span>
                </button>
              </nav>
              <div className="ml-4 flex items-center gap-2 pl-4 border-l border-primary/20">
                <span className="text-sm text-text-sub">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm text-text-sub hover:bg-primary/10 hover:text-primary rounded-full transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Work View */}
        {activeView === 'active' && (
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-text-main mb-2 font-heading">
                Active Work
              </h2>
              <p className="text-text-sub">See who&apos;s working on what right now</p>
            </div>

            {/* My Sessions */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-text-main">My Sessions</h3>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  Start Working
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mySessions.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-text-sub">
                    <span className="material-symbols-outlined text-6xl mb-4 block text-primary/30">
                      work_off
                    </span>
                    <p>You&apos;re not currently working on anything.</p>
                    <button
                      onClick={() => setShowModal(true)}
                      className="mt-4 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Start Working
                    </button>
                  </div>
                ) : (
                  mySessions.map((session) => (
                    <div
                      key={session.id}
                      className="bg-surface-light/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-primary/30 p-6 card-hover"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-lg text-text-main">{session.project_name}</h4>
                          <p className="text-sm text-text-sub">
                            {formatElapsedTime(session.elapsed_hours || 0)}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-primary active-pulse">
                          sensors
                        </span>
                      </div>
                      {session.task_description && (
                        <p className="text-sm text-text-sub mb-4">{session.task_description}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => stopWork(session.id)}
                          className="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm rounded-full font-semibold hover:bg-red-600 transition-all duration-200"
                        >
                          Stop
                        </button>
                        <button
                          onClick={() => pingWork(session.id)}
                          className="px-3 py-1.5 bg-surface-light dark:bg-surface-dark border border-primary/20 text-primary text-sm rounded-full font-semibold hover:border-primary/40 transition-all"
                        >
                          Ping
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Team Activity */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-text-main mb-4">Team Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamActivity.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-text-sub">
                    <p>No one else is actively working right now.</p>
                  </div>
                ) : (
                  teamActivity.map((userItem) => (
                    <div
                      key={userItem.user_id}
                      className="bg-surface-light/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10 p-6"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary">
                            {userItem.user_type === 'agent' ? 'smart_toy' : 'person'}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-text-main">{userItem.user_name}</h4>
                          <p className="text-xs text-text-sub">
                            {userItem.project_count} project
                            {userItem.project_count > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {userItem.projects.map((p) => (
                          <div key={p} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="text-sm text-text-sub">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Project Summary */}
            <div>
              <h3 className="text-xl font-bold text-text-main mb-4">Projects Being Worked On</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectSummary.length === 0 ? (
                  <div className="col-span-3 text-center py-8 text-text-sub">
                    <p>No projects are currently being worked on.</p>
                  </div>
                ) : (
                  projectSummary.map((proj) => (
                    <div
                      key={proj.project_name}
                      className="bg-surface-light/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10 p-6"
                    >
                      <h4 className="font-bold text-lg text-text-main mb-2">
                        {proj.project_name}
                      </h4>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-primary text-sm">
                          group
                        </span>
                        <span className="text-sm text-text-sub">{proj.active_count} working</span>
                      </div>
                      <div className="space-y-1">
                        {proj.workers.map((w) => (
                          <div key={w} className="text-sm text-text-sub">
                            • {w}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Projects View */}
        {activeView === 'projects' && (
          <div>
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-text-main mb-2 font-heading">
                  Projects
                </h2>
                <p className="text-text-sub">All repositories in your organization</p>
              </div>
              <button
                onClick={loadProjects}
                className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Refresh
              </button>
            </div>

            {reposLoading ? (
              <div className="text-center py-12 text-text-sub">Loading projects...</div>
            ) : repos.length === 0 ? (
              <div className="text-center py-12 text-text-sub">No repositories found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repos.map((repo) => {
                  const meta = repo.metadata || {}
                  const hasSupabase = meta.supabase_project_url
                  const hasVercel = meta.vercel_project_url || meta.vercel_deployment_url

                  return (
                    <div
                      key={repo.name}
                      className="bg-surface-light/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10 p-6 card-hover"
                    >
                      <h3 className="font-bold text-lg text-text-main mb-2">{repo.name}</h3>
                      {repo.description && (
                        <p className="text-sm text-text-sub mb-4">{repo.description}</p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-text-sub">
                          <span className="material-symbols-outlined text-sm">commit</span>
                          <span>
                            Last commit:{' '}
                            {repo.updated_at ? formatDate(repo.updated_at) : 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-text-sub">
                          <span className="material-symbols-outlined text-sm">call_split</span>
                          <span>Branch: {repo.default_branch || 'main'}</span>
                        </div>
                        {hasSupabase && (
                          <div className="flex items-center gap-2 text-emerald-600">
                            <span className="material-symbols-outlined text-sm">database</span>
                            <span>Supabase: {meta.supabase_project_id}</span>
                          </div>
                        )}
                        {hasVercel && (
                          <div className="flex items-center gap-2 text-text-sub">
                            <span className="material-symbols-outlined text-sm">cloud</span>
                            <span>Deployed on Vercel</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-primary hover:bg-primary-dark text-white text-sm text-center font-semibold px-4 py-2 rounded-full transition-all duration-200 shadow-md hover:shadow-lg"
                        >
                          GitHub
                        </a>
                        {hasSupabase && meta.supabase_project_url && (
                          <a
                            href={meta.supabase_project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-emerald-600 text-white text-sm text-center rounded-full font-semibold hover:bg-emerald-700 transition-all duration-200"
                          >
                            Supabase
                          </a>
                        )}
                        {meta.vercel_project_url && (
                          <a
                            href={meta.vercel_project_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-slate-700 text-white text-sm text-center rounded-full font-semibold hover:bg-slate-800 transition-all duration-200"
                          >
                            Vercel
                          </a>
                        )}
                        {meta.vercel_deployment_url && (
                          <a
                            href={meta.vercel_deployment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-accent-blue text-white text-sm text-center rounded-full font-semibold hover:bg-blue-600 transition-all duration-200"
                          >
                            Live Site
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Kanban View */}
        {activeView === 'kanban' && (
          <div>
            <h2 className="text-3xl font-bold text-text-main mb-6 font-heading">
              Kanban Board
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {['To Do', 'In Progress', 'Done'].map((column) => (
                <div key={column} className="bg-surface-light/60 backdrop-blur-sm rounded-2xl border border-primary/10 p-4">
                  <h3 className="font-bold text-text-main mb-4">{column}</h3>
                  <div className="text-center py-8 text-text-sub text-sm bg-surface-light/80 rounded-xl border border-primary/10">
                    Coming soon...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity View */}
        {activeView === 'activity' && (
          <div>
            <h2 className="text-3xl font-bold text-text-main mb-6 font-heading">
              Recent Activity
            </h2>
            {activityLoading ? (
              <div className="text-center py-12 text-text-sub">Loading activity...</div>
            ) : activityFeed.length === 0 ? (
              <div className="text-center py-12 text-text-sub">No recent activity</div>
            ) : (
              <div className="space-y-4">
                {activityFeed.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-surface-light/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">
                        {entry.user_type === 'agent' ? 'smart_toy' : 'person'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-text-main">
                          {entry.user_name} worked on{' '}
                          <span className="text-primary">{entry.project_name}</span>
                        </p>
                        {entry.task_description && (
                          <p className="text-xs text-text-sub">{entry.task_description}</p>
                        )}
                        <p className="text-xs text-text-sub mt-1">
                          {entry.duration_minutes} minutes • {formatDate(entry.ended_at_iso)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings View */}
        {activeView === 'settings' && (
          <div>
            <h2 className="text-3xl font-bold text-text-main mb-6 font-heading">
              Settings
            </h2>
            <div className="max-w-2xl">
              <div className="bg-surface-light/80 backdrop-blur-sm rounded-2xl shadow-lg border border-primary/10 p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-2">
                    User ID (Email)
                  </label>
                  <input
                    type="text"
                    value={settingsUserId}
                    readOnly
                    className="w-full px-4 py-2 bg-background-light border border-primary/20 rounded-xl text-text-sub cursor-not-allowed"
                  />
                  <p className="text-xs text-text-sub mt-1">
                    Managed by Supabase authentication
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-main mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={settingsUserName}
                    onChange={(e) => setSettingsUserName(e.target.value)}
                    className="w-full px-4 py-2 bg-background-light border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Your Name"
                  />
                </div>
                <button
                  onClick={handleLogout}
                  className="px-6 py-2 bg-red-500 text-white rounded-full font-semibold hover:bg-red-600 transition-all duration-200 shadow-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Start Work Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-surface-light/90 backdrop-blur-md rounded-2xl shadow-xl border border-primary/10 p-6 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-text-main mb-4 font-heading">
              Start Working
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  Select Project
                </label>
                <select
                  value={modalProject}
                  onChange={(e) => setModalProject(e.target.value)}
                  className="w-full px-4 py-2 bg-background-light border border-primary/20 rounded-xl text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Select a project...</option>
                  {repos.map((repo) => (
                    <option key={repo.name} value={repo.name}>
                      {repo.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-main mb-2">
                  What are you working on?
                </label>
                <textarea
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-background-light border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  placeholder="Describe what you're working on..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={startWork}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-full transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start
                </button>
                <button
                  onClick={hideStartWorkModal}
                  className="bg-surface-light dark:bg-surface-dark border border-primary/20 text-primary px-6 py-3 rounded-full hover:border-primary/40 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
