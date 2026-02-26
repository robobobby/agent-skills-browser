import { useState, useEffect, useMemo } from 'react'
import './App.css'

function SkillCard({ skill, onClick }) {
  return (
    <div className="skill-card" onClick={() => onClick(skill)}>
      <div className="skill-card-header">
        <span className="platform-badge" data-platform={skill.platform}>
          {skill.platformIcon} {skill.platform}
        </span>
        <span className="category-tag">{skill.category}</span>
      </div>
      <h3 className="skill-name">{skill.name}</h3>
      <p className="skill-desc">{skill.description || 'No description available.'}</p>
      <div className="skill-card-footer">
        <span className="source-link">{skill.source}</span>
      </div>
    </div>
  )
}

function SkillModal({ skill, onClose }) {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (skill.body) {
      setContent(skill.body)
      setLoading(false)
      return
    }
    fetch(skill.skillMdUrl)
      .then(r => r.text())
      .then(text => { setContent(text); setLoading(false) })
      .catch(() => { setContent('Failed to load skill content.'); setLoading(false) })
  }, [skill])

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const installCmd = useMemo(() => {
    if (skill.platform === 'Superpowers') {
      return `# Add to your .claude/skills/ directory\ncurl -sL ${skill.skillMdUrl} > .claude/skills/${skill.slug}/SKILL.md`
    }
    if (skill.platform === 'HuggingFace') {
      return `# Add to your .claude/skills/ directory\ncurl -sL ${skill.skillMdUrl} > .claude/skills/${skill.slug}/SKILL.md`
    }
    return `# View source\nopen ${skill.sourceUrl}`
  }, [skill])

  const handleCopy = () => {
    navigator.clipboard.writeText(installCmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-header">
          <span className="platform-badge" data-platform={skill.platform}>
            {skill.platformIcon} {skill.platform}
          </span>
          <span className="category-tag">{skill.category}</span>
        </div>
        <h2>{skill.name}</h2>
        <p className="modal-desc">{skill.description}</p>

        <div className="install-section">
          <h4>Quick Install</h4>
          <div className="install-cmd">
            <pre>{installCmd}</pre>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="skill-content">
          <h4>Skill Content</h4>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <pre className="skill-body">{content}</pre>
          )}
        </div>

        <a href={skill.sourceUrl} target="_blank" rel="noopener noreferrer" className="source-btn">
          View on GitHub →
        </a>
      </div>
    </div>
  )
}

function App() {
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [selectedSkill, setSelectedSkill] = useState(null)

  useEffect(() => {
    fetch('/skills-data.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
  }, [])

  const filteredSkills = useMemo(() => {
    if (!data) return []
    return data.skills.filter(s => {
      if (platformFilter !== 'All' && s.platform !== platformFilter) return false
      if (categoryFilter !== 'All' && s.category !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [data, search, platformFilter, categoryFilter])

  const platforms = useMemo(() => {
    if (!data) return []
    return ['All', ...new Set(data.skills.map(s => s.platform))]
  }, [data])

  const categories = useMemo(() => {
    if (!data) return []
    return ['All', ...new Set(data.skills.map(s => s.category)).values()].sort()
  }, [data])

  if (!data) return <div className="loading-screen">Loading skills...</div>

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <h1>
            <span className="hero-icon">⚡</span>
            Agent Skills Browser
          </h1>
          <p className="hero-sub">
            Browse, search, and install composable skills for AI coding agents.
            <br />
            <span className="hero-count">{data.totalSkills} skills</span> from {data.sources.length} open-source repositories.
          </p>
        </div>
      </header>

      <div className="controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filters">
          <select value={platformFilter} onChange={e => setPlatformFilter(e.target.value)}>
            {platforms.map(p => <option key={p} value={p}>{p === 'All' ? 'All Platforms' : p}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
        </div>
      </div>

      <div className="results-info">
        Showing {filteredSkills.length} of {data.totalSkills} skills
      </div>

      <div className="skills-grid">
        {filteredSkills.map(skill => (
          <SkillCard key={skill.id} skill={skill} onClick={setSelectedSkill} />
        ))}
        {filteredSkills.length === 0 && (
          <div className="no-results">No skills match your filters.</div>
        )}
      </div>

      <div className="submit-section">
        <h3>Know a skill that's missing?</h3>
        <p>Submit it via GitHub — point us to any repo with a SKILL.md or agent context file.</p>
        <a
          href="https://github.com/robobobby/agent-skills-browser/issues/new?template=submit-skill.md&title=%5BSkill%5D+&labels=new-skill"
          target="_blank"
          rel="noopener noreferrer"
          className="submit-btn"
        >
          Submit a Skill →
        </a>
      </div>

      <footer className="footer">
        <p>
          Sources:{' '}
          {data.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && ' · '}
              <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a>
            </span>
          ))}
        </p>
        <p className="footer-note">
          Built by <a href="https://github.com/robobobby" target="_blank" rel="noopener noreferrer">Bobby</a> · Data refreshed {new Date(data.generatedAt).toLocaleDateString()}
        </p>
      </footer>

      {selectedSkill && (
        <SkillModal skill={selectedSkill} onClose={() => setSelectedSkill(null)} />
      )}
    </div>
  )
}

export default App
