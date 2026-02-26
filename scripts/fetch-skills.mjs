#!/usr/bin/env node
/**
 * Fetch skills from huggingface/skills and obra/superpowers repos.
 * Outputs a JSON file with all skill metadata for the frontend.
 */

const REPOS = [
  {
    owner: 'huggingface',
    repo: 'skills',
    skillsPath: 'skills',
    platform: 'HuggingFace',
    platformIcon: '🤗',
  },
  {
    owner: 'obra',
    repo: 'superpowers',
    skillsPath: 'skills',
    platform: 'Superpowers',
    platformIcon: '⚡',
  },
];

async function fetchGitHub(url) {
  const token = process.env.GITHUB_TOKEN;
  const headers = { 'User-Agent': 'agent-skills-browser' };
  if (token) headers['Authorization'] = `token ${token}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${url}`);
  return res.json();
}

function parseSkillMd(content) {
  // Parse YAML frontmatter from SKILL.md
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  const meta = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^(\w[\w-]*):\s*"?(.*?)"?\s*$/);
    if (m) meta[m[1]] = m[2];
  }
  // Get body after frontmatter
  meta.body = content.slice(match[0].length).trim();
  return meta;
}

function categorize(name, description = '') {
  const text = `${name} ${description}`.toLowerCase();
  if (/debug|test|verify|review|lint/.test(text)) return 'Quality';
  if (/git|branch|commit|worktree|pr/.test(text)) return 'Git & Workflow';
  if (/plan|design|brainstorm|spec/.test(text)) return 'Planning';
  if (/deploy|ci|cd|docker|hosting/.test(text)) return 'DevOps';
  if (/data|model|train|evaluat|dataset/.test(text)) return 'ML & Data';
  if (/cli|tool|hub|upload|download|cache/.test(text)) return 'Tools';
  if (/agent|subagent|dispatch|parallel/.test(text)) return 'Agents';
  if (/code|develop|implement|build|scaffold/.test(text)) return 'Development';
  return 'General';
}

async function fetchSkillsFromRepo(repoConfig) {
  const { owner, repo, skillsPath, platform, platformIcon } = repoConfig;
  console.log(`Fetching from ${owner}/${repo}...`);

  const dirs = await fetchGitHub(
    `https://api.github.com/repos/${owner}/${repo}/contents/${skillsPath}`
  );

  const skills = [];
  for (const dir of dirs) {
    if (dir.type !== 'dir') continue;
    try {
      // Try to fetch SKILL.md
      const skillMdUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillsPath}/${dir.name}/SKILL.md`;
      const res = await fetch(skillMdUrl);
      if (!res.ok) continue;
      const content = await res.text();
      const meta = parseSkillMd(content);

      skills.push({
        id: `${owner}-${repo}-${dir.name}`,
        name: meta.name || dir.name,
        slug: dir.name,
        description: meta.description || '',
        category: categorize(dir.name, meta.description),
        platform,
        platformIcon,
        source: `${owner}/${repo}`,
        sourceUrl: `https://github.com/${owner}/${repo}/tree/main/${skillsPath}/${dir.name}`,
        skillMdUrl: `https://raw.githubusercontent.com/${owner}/${repo}/main/${skillsPath}/${dir.name}/SKILL.md`,
        body: meta.body || '',
      });
    } catch (e) {
      console.warn(`  Skipping ${dir.name}: ${e.message}`);
    }
  }

  console.log(`  Found ${skills.length} skills`);
  return skills;
}

// Also fetch from muratcankoylan/Agent-Skills-for-Context-Engineering
async function fetchAgentSkillsRepo() {
  const owner = 'muratcankoylan';
  const repo = 'Agent-Skills-for-Context-Engineering';
  console.log(`Fetching from ${owner}/${repo}...`);

  try {
    const contents = await fetchGitHub(
      `https://api.github.com/repos/${owner}/${repo}/contents`
    );

    const skills = [];
    for (const item of contents) {
      if (item.type !== 'dir' || item.name.startsWith('.')) continue;
      // Check for README or any .md file
      try {
        const dirContents = await fetchGitHub(item.url);
        const mdFile = dirContents.find(f => f.name === 'README.md' || f.name === 'SKILL.md' || f.name.endsWith('.md'));
        if (!mdFile) continue;

        const res = await fetch(mdFile.download_url);
        const content = await res.text();
        const firstLine = content.split('\n').find(l => l.startsWith('#'));
        const title = firstLine ? firstLine.replace(/^#+\s*/, '') : item.name;
        const descMatch = content.match(/\n\n([^#\n].{10,})/);

        skills.push({
          id: `${owner}-${repo}-${item.name}`,
          name: title,
          slug: item.name,
          description: descMatch ? descMatch[1].trim().slice(0, 200) : '',
          category: categorize(item.name, title),
          platform: 'Context Engineering',
          platformIcon: '🧠',
          source: `${owner}/${repo}`,
          sourceUrl: `https://github.com/${owner}/${repo}/tree/main/${item.name}`,
          skillMdUrl: mdFile.download_url,
          body: content.slice(0, 2000),
        });
      } catch (e) {
        // skip
      }
    }
    console.log(`  Found ${skills.length} skills`);
    return skills;
  } catch (e) {
    console.warn(`  Failed: ${e.message}`);
    return [];
  }
}

async function main() {
  const allSkills = [];

  for (const repo of REPOS) {
    const skills = await fetchSkillsFromRepo(repo);
    allSkills.push(...skills);
  }

  const contextSkills = await fetchAgentSkillsRepo();
  allSkills.push(...contextSkills);

  // Sort by name
  allSkills.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    generatedAt: new Date().toISOString(),
    totalSkills: allSkills.length,
    sources: [
      { name: 'huggingface/skills', url: 'https://github.com/huggingface/skills' },
      { name: 'obra/superpowers', url: 'https://github.com/obra/superpowers' },
      { name: 'muratcankoylan/Agent-Skills-for-Context-Engineering', url: 'https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering' },
    ],
    skills: allSkills,
  };

  const fs = await import('fs');
  fs.writeFileSync('public/skills-data.json', JSON.stringify(output, null, 2));
  console.log(`\nDone! ${allSkills.length} skills written to public/skills-data.json`);
}

main().catch(console.error);
