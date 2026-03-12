'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface WorkEntry {
  id: string
  project_name: string
  started_at: string
  ended_at: string | null
  notes: string | null
}

interface Project {
  id: string
  project_name: string
  repo_url: string | null
  status: string
  tags: string[]
  notes: string | null
  last_worked_at: string
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [activeWork, setActiveWork] = useState<WorkEntry | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Check auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        loadData()
      } else {
        router.push('/login')
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        loadData()
      } else {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const loadData = async () => {
    try {
      // Load work entries
      const workRes = await fetch('/api/work')
      if (workRes.ok) {
        const workData = await workRes.json()
        setWorkEntries(workData.work || [])
        
        // Find active work (no end time)
        const active = workData.work?.find((w: WorkEntry) => !w.ended_at)
        setActiveWork(active || null)
      }

      // Load projects
      const projRes = await fetch('/api/projects')
      if (projRes.ok) {
        const projData = await projRes.json()
        setProjects(projData.projects || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const startWork = async () => {
    if (!newProjectName.trim() || !user) return

    try {
      const res = await fetch('/api/work', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          project_name: newProjectName.trim(),
        }),
      })

      if (res.ok) {
        setNewProjectName('')
        loadData()
      }
    } catch (error) {
      console.error('Failed to start work:', error)
    }
  }

  const stopWork = async () => {
    if (!activeWork) return

    try {
      const res = await fetch('/api/work', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeWork.id,
          notes: '',
        }),
      })

      if (res.ok) {
        loadData()
      }
    } catch (error) {
      console.error('Failed to stop work:', error)
    }
  }

  if (loading) {
    return <div className="container"><p>Loading...</p></div>
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="container">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        padding: '20px 0',
        borderBottom: '2px solid #ddd'
      }}>
        <h1 style={{ margin: 0 }}>SPCL Project Dashboard</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>{user.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Active Work Section */}
      <section style={{ marginBottom: '40px', padding: '20px', background: 'white', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>Active Work</h2>
        
        {activeWork ? (
          <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '4px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{activeWork.project_name}</strong>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  Started: {new Date(activeWork.started_at).toLocaleTimeString()}
                </div>
              </div>
              <button onClick={stopWork} style={{ background: '#f44336' }}>
                Stop Work
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '15px' }}>No active work session</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && startWork()}
                style={{ flex: 1 }}
              />
              <button onClick={startWork}>Start Working</button>
            </div>
          </div>
        )}
      </section>

      {/* Recent Work Section */}
      <section style={{ marginBottom: '40px', padding: '20px', background: 'white', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>Recent Work Sessions</h2>
        
        {workEntries.length === 0 ? (
          <p>No work sessions yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {workEntries.slice(0, 10).map((work) => (
              <div 
                key={work.id} 
                style={{ 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  background: work.ended_at ? '#f5f5f5' : '#fff3cd'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{work.project_name}</strong>
                  <span style={{ fontSize: '14px', color: '#666' }}>
                    {work.ended_at ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  {new Date(work.started_at).toLocaleString()}
                  {work.ended_at && ` - ${new Date(work.ended_at).toLocaleString()}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Projects Section */}
      <section style={{ padding: '20px', background: 'white', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>Projects ({projects.length})</h2>
        
        {projects.length === 0 ? (
          <p>No projects yet. Start working on a project to create one!</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {projects.map((project) => (
              <div 
                key={project.id} 
                style={{ 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                  <div>
                    <strong>{project.project_name}</strong>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      Last worked: {new Date(project.last_worked_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px', 
                    background: project.status === 'active' ? '#4caf50' : '#999',
                    color: 'white',
                    borderRadius: '3px'
                  }}>
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
