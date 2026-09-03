const OWNER_PASSCODE = 'YanYou06-owner-only';
const OWNER_STATE_KEY = 'yy06-owner-unlocked';
const OWNER_TOKEN_KEY = 'yy06-github-token';
const REPO_OWNER = 'YanYou06';
const REPO_NAME = 'YanYou06.github.io';

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

const sectionToPath = {
  about: 'data/about.json',
  courses: 'data/courses.json',
  essays: 'data/essays.json',
  jottings: 'data/jottings.json',
  life: 'data/life.json',
};

function getOwnerMode() {
  return localStorage.getItem(OWNER_STATE_KEY) === '1';
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
  const response = await fetch(path, { cache: 'no-store' });
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
    const data = await fetchJSON(root.dataset.source);
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
    const data = await fetchJSON(root.dataset.source);
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

function cloneDefaultSection(sectionKey) {
  return JSON.parse(JSON.stringify(sectionSchema[sectionKey]));
}

async function githubRequest(path, token, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `token ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub API 错误 ${response.status}: ${detail.slice(0, 180)}`);
  }
  return response.status === 204 ? null : response.json();
}

async function getContentMeta(path, token) {
  return githubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, token);
}

async function putFile(path, rawContent, token, message) {
  let sha;
  try {
    const meta = await getContentMeta(path, token);
    sha = meta.sha;
  } catch {}
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(rawContent))),
  };
  if (sha) body.sha = sha;
  return githubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function putBinaryFile(path, base64Content, token, message) {
  let sha;
  try {
    const meta = await getContentMeta(path, token);
    sha = meta.sha;
  } catch {}
  const body = { message, content: base64Content };
  if (sha) body.sha = sha;
  return githubRequest(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, token, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function renderUploadAssistant() {
  const sectionSelect = document.getElementById('upload-section');
  if (!sectionSelect) return;

  const lockBox = document.getElementById('owner-lock');
  const ownerPasscode = document.getElementById('owner-passcode');
  const unlockButton = document.getElementById('owner-unlock');
  const lockMsg = document.getElementById('owner-lock-msg');
  const editor = document.getElementById('owner-editor');
  const tokenInput = document.getElementById('github-token');

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
  const currentItems = document.getElementById('current-items');

  if (
    !lockBox || !ownerPasscode || !unlockButton || !lockMsg || !editor || !tokenInput || !docsForm ||
    !lifeForm || !titleInput || !markdownInput || !markdownFiles || !lifeTitle || !lifeMarkdown ||
    !lifeImage || !addEntryButton || !applyButton || !clearButton || !pendingPreview || !manageMsg || !currentItems
  ) return;

  const pending = { about: [], courses: [], essays: [], jottings: [], life: [] };
  const loaded = {};

  function getToken() {
    return tokenInput.value.trim();
  }

  function updatePreview() {
    pendingPreview.value = JSON.stringify(pending[sectionSelect.value], null, 2);
  }

  function renderCurrentList() {
    const key = sectionSelect.value;
    const data = loaded[key] || cloneDefaultSection(key);
    const items = key === 'life'
      ? (data.items || []).map((item, index) => ({ title: item.title || `生活碎片 ${index + 1}`, index }))
      : (data.categories || []).flatMap((cat) => (cat.items || []).map((item, index) => ({ title: item.title || `条目 ${index + 1}`, categoryName: cat.name || '未分类', index })));

    if (!items.length) {
      currentItems.innerHTML = '<p class="muted">当前分区没有已发布内容。</p>';
      return;
    }

    currentItems.innerHTML = `
      <p class="muted">当前已发布内容（可删除）：</p>
      ${items
        .map((item) => `
          <div class="item">
            <span>${escapeHtml(item.categoryName ? `[${item.categoryName}] ${item.title}` : item.title)}</span>
            <button type="button" data-delete-index="${item.index}">删除</button>
          </div>`)
        .join('')}
    `;

    currentItems.querySelectorAll('button[data-delete-index]').forEach((button) => {
      button.addEventListener('click', () => {
        const deleteIndex = Number(button.dataset.deleteIndex);
        if (Number.isNaN(deleteIndex)) return;
        if (key === 'life') {
          loaded[key].items.splice(deleteIndex, 1);
        } else {
          const itemsRef = loaded[key].categories?.[0]?.items || [];
          itemsRef.splice(deleteIndex, 1);
          loaded[key].categories = [{ ...(loaded[key].categories?.[0] || { name: '最新内容', description: '由上传助手自动更新。' }), items: itemsRef }];
        }
        renderCurrentList();
        manageMsg.textContent = '已从当前分区删除该内容，点击“更新内容”后会发布。';
      });
    });
  }

  async function loadSection(sectionKey) {
    const filePath = sectionToPath[sectionKey];
    loaded[sectionKey] = await fetchJSON(`${filePath}?t=${Date.now()}`);
    if (sectionKey !== 'life') {
      const first = loaded[sectionKey].categories?.[0];
      if (!first) {
        loaded[sectionKey].categories = [{ name: '最新内容', description: '由上传助手自动更新。', items: [] }];
      }
    }
    renderCurrentList();
  }

  function refreshMode() {
    const isLife = sectionSelect.value === 'life';
    docsForm.classList.toggle('hidden', isLife);
    lifeForm.classList.toggle('hidden', !isLife);
    updatePreview();
    if (loaded[sectionSelect.value]) renderCurrentList();
  }

  function unlockOwner() {
    if (ownerPasscode.value !== OWNER_PASSCODE) {
      lockMsg.textContent = '口令错误，请重试。';
      return;
    }
    localStorage.setItem(OWNER_STATE_KEY, '1');
    lockBox.classList.add('hidden');
    editor.classList.remove('hidden');
    tokenInput.value = localStorage.getItem(OWNER_TOKEN_KEY) || '';
    manageMsg.textContent = '已解锁，可更新内容。';
    loadSection(sectionSelect.value).catch((error) => {
      manageMsg.textContent = `加载分区失败：${error.message}`;
    });
  }

  if (getOwnerMode()) {
    lockBox.classList.add('hidden');
    editor.classList.remove('hidden');
    tokenInput.value = localStorage.getItem(OWNER_TOKEN_KEY) || '';
    await loadSection(sectionSelect.value).catch(() => {
      currentItems.innerHTML = '<p class="muted">分区内容加载失败。</p>';
    });
  } else {
    lockBox.classList.remove('hidden');
    editor.classList.add('hidden');
  }

  tokenInput.addEventListener('change', () => {
    localStorage.setItem(OWNER_TOKEN_KEY, tokenInput.value.trim());
  });

  unlockButton.addEventListener('click', unlockOwner);
  ownerPasscode.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') unlockOwner();
  });

  sectionSelect.addEventListener('change', () => {
    refreshMode();
    loadSection(sectionSelect.value).catch((error) => {
      manageMsg.textContent = `加载分区失败：${error.message}`;
    });
  });
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
    updatePreview();
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
      pending.life.push({
        title: lifeTitle.value.trim() || file.name,
        caption: lifeMarkdown.value.trim(),
        imageFile: file,
      });
      updatePreview();
      manageMsg.textContent = '已加入一条生活碎片。';
      lifeTitle.value = '';
      lifeMarkdown.value = '';
      lifeImage.value = '';
      return;
    }

    const title = titleInput.value.trim();
    const markdown = markdownInput.value.trim();
    if (!title || !markdown) {
      manageMsg.textContent = '请填写标题和 Markdown 内容。';
      return;
    }
    pending[sectionKey].push({ title, markdown });
    updatePreview();
    manageMsg.textContent = '已加入一条 Markdown 内容。';
    titleInput.value = '';
    markdownInput.value = '';
  });

  applyButton.addEventListener('click', async () => {
    const sectionKey = sectionSelect.value;
    const token = getToken();
    if (!token) {
      manageMsg.textContent = '请先输入 GitHub Token。';
      return;
    }

    try {
      const sectionData = loaded[sectionKey] || cloneDefaultSection(sectionKey);
      if (sectionKey === 'life') {
        for (const lifeItem of pending.life) {
          const arrayBuffer = await lifeItem.imageFile.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          bytes.forEach((value) => {
            binary += String.fromCharCode(value);
          });
          const base64Image = btoa(binary);
          const filename = `${Date.now()}-${lifeItem.imageFile.name.replace(/\s+/g, '-')}`;
          const imagePath = `assets/images/${filename}`;
          await putBinaryFile(imagePath, base64Image, token, `feat: add life image ${filename}`);
          sectionData.items = sectionData.items || [];
          sectionData.items.push({
            title: lifeItem.title,
            image: imagePath,
            caption: lifeItem.caption,
          });
        }
      } else {
        sectionData.categories = sectionData.categories || [{ name: '最新内容', description: '由上传助手自动更新。', items: [] }];
        sectionData.categories[0].name = sectionData.categories[0].name || '最新内容';
        sectionData.categories[0].description = sectionData.categories[0].description || '由上传助手自动更新。';
        sectionData.categories[0].items = sectionData.categories[0].items || [];
        sectionData.categories[0].items.push(...pending[sectionKey].map((item) => ({ title: item.title, markdown: item.markdown })));
      }

      await putFile(
        sectionToPath[sectionKey],
        `${JSON.stringify(sectionData, null, 2)}\n`,
        token,
        `feat: update ${sectionKey} content`
      );

      loaded[sectionKey] = sectionData;
      pending[sectionKey] = [];
      updatePreview();
      renderCurrentList();
      manageMsg.textContent = '更新已提交到仓库，网站会在 Pages 构建完成后公开可见。';
    } catch (error) {
      manageMsg.textContent = `更新失败：${error.message}`;
    }
  });

  clearButton.addEventListener('click', async () => {
    const sectionKey = sectionSelect.value;
    const token = getToken();
    if (!token) {
      manageMsg.textContent = '请先输入 GitHub Token。';
      return;
    }
    try {
      const cleared = cloneDefaultSection(sectionKey);
      await putFile(
        sectionToPath[sectionKey],
        `${JSON.stringify(cleared, null, 2)}\n`,
        token,
        `feat: clear ${sectionKey} content`
      );
      loaded[sectionKey] = cleared;
      pending[sectionKey] = [];
      updatePreview();
      renderCurrentList();
      manageMsg.textContent = '已清空并提交，网站将同步为公开最新内容。';
    } catch (error) {
      manageMsg.textContent = `清空失败：${error.message}`;
    }
  });
}

renderHome();
renderDocPage();
renderGalleryPage();
renderUploadAssistant();
