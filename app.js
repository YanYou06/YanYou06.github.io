const OWNER_PASSCODE = 'YanYou06-owner-only';
const OWNER_STATE_KEY = 'yy06-owner-unlocked';
const CONTENT_KEY = 'yy06-content-v1';

const baseSections = [
  { title: '简介', path: 'about.html' },
  { title: '学习课程', path: 'courses.html' },
  { title: '杂谈', path: 'essays.html' },
  { title: '随记', path: 'jottings.html' },
  { title: '生活碎片', path: 'life.html' },
  { title: '上传助手', path: 'manage.html', ownerOnly: true },
];

const sectionSchema = {
  about: { title: '简介', description: '等待你上传 Markdown 内容。', categories: [] },
  courses: { title: '学习课程', description: '等待你上传 Markdown 内容。', categories: [] },
  essays: { title: '杂谈', description: '等待你上传 Markdown 内容。', categories: [] },
  jottings: { title: '随记', description: '等待你上传 Markdown 内容。', categories: [] },
  life: { title: '生活碎片', description: '等待你上传图片与 Markdown 说明。', items: [] },
};

const sourceMap = {
  'data/about.json': 'about',
  'data/courses.json': 'courses',
  'data/essays.json': 'essays',
  'data/jottings.json': 'jottings',
  'data/life.json': 'life',
};

function getOwnerMode() {
  return localStorage.getItem(OWNER_STATE_KEY) === '1';
}

function getStoredContent() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONTENT_KEY) || '{}');
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function setStoredContent(data) {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(data));
}

const navEl = document.getElementById('site-nav');
if (navEl) {
  const isOwner = getOwnerMode();
  navEl.innerHTML = baseSections
    .filter((item) => !item.ownerOnly || isOwner)
    .map((item) => `<a href="${item.path}">${item.title}</a>`)
    .join('');
}

const manageEntry = document.getElementById('manage-entry');
if (manageEntry && getOwnerMode()) {
  manageEntry.classList.remove('hidden');
}

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`${path} 加载失败：${response.status}`);
  }
  return response.json();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function safeLink(url) {
  const text = String(url || '').trim();
  if (/^(https?:\/\/|\/|\.\/|#|[a-zA-Z0-9_-])/u.test(text)) return text;
  return '#';
}

function markdownToHtml(markdown) {
  let html = escapeHtml(markdown || '');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => `<a href="${escapeHtml(safeLink(href))}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`);
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  const blocks = html
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br />')}</p>`)
    .join('');
  return `<div class="markdown-body">${blocks}</div>`;
}

async function loadSectionData(source) {
  const key = sourceMap[source];
  const stored = getStoredContent();
  if (key && stored[key]) return stored[key];
  return fetchJSON(source);
}

async function renderHome() {
  const root = document.getElementById('home-sections');
  if (!root) return;

  try {
    const data = await fetchJSON('data/home-sections.json');
    const isOwner = getOwnerMode();
    root.innerHTML = data.sections
      .filter((section) => section.path !== 'manage.html' || isOwner)
      .map(
        (section) => `
        <article class="card">
          <h3>${escapeHtml(section.name)}</h3>
          <p class="muted">${escapeHtml(section.summary)}</p>
          <a href="${escapeHtml(section.path)}">进入分区</a>
        </article>`
      )
      .join('');
  } catch (error) {
    root.innerHTML = `<p>首页分区加载失败：${escapeHtml(error.message)}</p>`;
  }
}

async function renderDocPage() {
  const root = document.getElementById('section-root');
  if (!root || root.dataset.mode !== 'docs') return;

  try {
    const data = await loadSectionData(root.dataset.source);
    const categories = (data.categories || [])
      .map(
        (cat) => `
        <section class="category">
          <h3>${escapeHtml(cat.name)}</h3>
          <p class="muted">${escapeHtml(cat.description || '')}</p>
          ${(cat.items || [])
            .map(
              (item) => `
              <article class="item">
                <strong>${escapeHtml(item.title)}</strong>
                ${item.markdown ? markdownToHtml(item.markdown) : `<p>${escapeHtml(item.summary || '')}</p>`}
                ${item.href ? `<a class="item-link" href="${escapeHtml(item.href)}" ${item.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>打开内容</a>` : ''}
              </article>`
            )
            .join('')}
        </section>`
      )
      .join('');

    const isOwner = getOwnerMode();
    root.innerHTML = `
      <h2>${escapeHtml(data.title)}</h2>
      <p class="muted">${escapeHtml(data.description || '')}</p>
      <div>${categories || '<p class="muted">当前分区还没有内容。</p>'}</div>
      ${isOwner ? '<p><a class="button" href="manage.html">打开上传助手维护本分区</a></p>' : ''}
    `;
  } catch (error) {
    root.innerHTML = `<p>分区数据加载失败：${escapeHtml(error.message)}</p>`;
  }
}

async function renderGalleryPage() {
  const root = document.getElementById('section-root');
  if (!root || root.dataset.mode !== 'gallery') return;

  try {
    const data = await loadSectionData(root.dataset.source);
    const items = data.items || [];
    const isOwner = getOwnerMode();
    root.innerHTML = `
      <h2>${escapeHtml(data.title)}</h2>
      <p class="muted">${escapeHtml(data.description || '')}</p>
      <div class="gallery">
      ${items
        .map(
          (item) => `
          <figure>
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title || item.caption || 'life image')}" />
            <figcaption>
              <strong>${escapeHtml(item.title || '')}</strong>
              ${markdownToHtml(item.caption || '')}
            </figcaption>
          </figure>`
        )
        .join('')}
      </div>
      ${!items.length ? '<p class="muted">当前分区还没有内容。</p>' : ''}
      ${isOwner ? '<p><a class="button" href="manage.html">打开上传助手维护相册</a></p>' : ''}
    `;
  } catch (error) {
    root.innerHTML = `<p>相册加载失败：${escapeHtml(error.message)}</p>`;
  }
}

function defaultSectionData(sectionKey) {
  return JSON.parse(JSON.stringify(sectionSchema[sectionKey]));
}

function renderUploadAssistant() {
  const sectionSelect = document.getElementById('upload-section');
  if (!sectionSelect) return;

  const lockBox = document.getElementById('owner-lock');
  const ownerPasscode = document.getElementById('owner-passcode');
  const unlockButton = document.getElementById('owner-unlock');
  const lockMsg = document.getElementById('owner-lock-msg');
  const editor = document.getElementById('owner-editor');

  const docsForm = document.getElementById('docs-form');
  const lifeForm = document.getElementById('life-form');
  const titleInput = document.getElementById('entry-title');
  const markdownInput = document.getElementById('entry-markdown');
  const markdownFiles = document.getElementById('markdown-files');
  const lifeTitle = document.getElementById('life-title');
  const lifeMarkdown = document.getElementById('life-markdown');
  const lifeImage = document.getElementById('life-image');
  const addEntryButton = document.getElementById('add-entry');
  const applyButton = document.getElementById('apply-update');
  const clearButton = document.getElementById('clear-section');
  const pendingPreview = document.getElementById('pending-preview');
  const manageMsg = document.getElementById('manage-msg');

  if (
    !lockBox || !ownerPasscode || !unlockButton || !lockMsg || !editor || !docsForm || !lifeForm ||
    !titleInput || !markdownInput || !markdownFiles || !lifeTitle || !lifeMarkdown || !lifeImage ||
    !addEntryButton || !applyButton || !clearButton || !pendingPreview || !manageMsg
  ) return;

  const pending = { about: [], courses: [], essays: [], jottings: [], life: [] };

  function refreshMode() {
    const isLife = sectionSelect.value === 'life';
    docsForm.classList.toggle('hidden', isLife);
    lifeForm.classList.toggle('hidden', !isLife);
    pendingPreview.value = JSON.stringify(pending[sectionSelect.value], null, 2);
  }

  function unlockOwner() {
    if (ownerPasscode.value !== OWNER_PASSCODE) {
      lockMsg.textContent = '口令错误，请重试。';
      return;
    }
    localStorage.setItem(OWNER_STATE_KEY, '1');
    lockBox.classList.add('hidden');
    editor.classList.remove('hidden');
    manageMsg.textContent = '已解锁，可更新内容。';
  }

  if (getOwnerMode()) {
    lockBox.classList.add('hidden');
    editor.classList.remove('hidden');
  } else {
    lockBox.classList.remove('hidden');
    editor.classList.add('hidden');
  }

  unlockButton.addEventListener('click', unlockOwner);
  ownerPasscode.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') unlockOwner();
  });

  sectionSelect.addEventListener('change', refreshMode);
  refreshMode();

  markdownFiles.addEventListener('change', async (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;
    const sectionKey = sectionSelect.value;
    const contents = await Promise.all(
      files.map(async (file) => {
        const markdown = await file.text();
        return {
          title: file.name.replace(/\.[^.]+$/u, ''),
          markdown,
        };
      })
    );
    pending[sectionKey].push(...contents);
    pendingPreview.value = JSON.stringify(pending[sectionKey], null, 2);
    manageMsg.textContent = `已加入 ${contents.length} 个 Markdown 文件。`;
    markdownFiles.value = '';
  });

  addEntryButton.addEventListener('click', () => {
    const sectionKey = sectionSelect.value;
    if (sectionKey === 'life') {
      const file = lifeImage.files?.[0];
      if (!file) {
        manageMsg.textContent = '请先选择图片。';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        pending.life.push({
          title: lifeTitle.value.trim() || file.name,
          image: String(reader.result || ''),
          caption: lifeMarkdown.value.trim(),
        });
        pendingPreview.value = JSON.stringify(pending.life, null, 2);
        manageMsg.textContent = '已加入一条生活碎片。';
        lifeTitle.value = '';
        lifeMarkdown.value = '';
        lifeImage.value = '';
      };
      reader.readAsDataURL(file);
      return;
    }

    const title = titleInput.value.trim();
    const markdown = markdownInput.value.trim();
    if (!title || !markdown) {
      manageMsg.textContent = '请填写标题和 Markdown 内容。';
      return;
    }
    pending[sectionKey].push({ title, markdown });
    pendingPreview.value = JSON.stringify(pending[sectionKey], null, 2);
    manageMsg.textContent = '已加入一条 Markdown 内容。';
    titleInput.value = '';
    markdownInput.value = '';
  });

  applyButton.addEventListener('click', () => {
    const sectionKey = sectionSelect.value;
    if (!pending[sectionKey].length) {
      manageMsg.textContent = '待更新列表为空。';
      return;
    }
    const stored = getStoredContent();
    const sectionData = defaultSectionData(sectionKey);
    if (sectionKey === 'life') {
      sectionData.items = pending.life.slice();
    } else {
      sectionData.categories = [
        {
          name: '最新内容',
          description: '由上传助手自动更新。',
          items: pending[sectionKey].map((item) => ({ title: item.title, markdown: item.markdown })),
        },
      ];
    }
    stored[sectionKey] = sectionData;
    setStoredContent(stored);
    manageMsg.textContent = '更新完成，返回分区页即可看到最新内容。';
  });

  clearButton.addEventListener('click', () => {
    const sectionKey = sectionSelect.value;
    const stored = getStoredContent();
    stored[sectionKey] = defaultSectionData(sectionKey);
    setStoredContent(stored);
    pending[sectionKey] = [];
    pendingPreview.value = '[]';
    manageMsg.textContent = '当前分区已清空。';
  });
}

renderHome();
renderDocPage();
renderGalleryPage();
renderUploadAssistant();
