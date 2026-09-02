const baseSections = [
  { title: '简介', path: 'about.html' },
  { title: '学习课程', path: 'courses.html' },
  { title: '杂谈', path: 'essays.html' },
  { title: '随记', path: 'jottings.html' },
  { title: '生活碎片', path: 'life.html' },
  { title: '上传助手', path: 'manage.html' },
];

const navEl = document.getElementById('site-nav');
if (navEl) {
  navEl.innerHTML = baseSections
    .map((item) => `<a href="${item.path}">${item.title}</a>`)
    .join('');
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

async function renderHome() {
  const root = document.getElementById('home-sections');
  if (!root) return;

  try {
    const data = await fetchJSON('data/home-sections.json');
    root.innerHTML = data.sections
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
    const categories = data.categories
      .map(
        (cat) => `
        <section class="category">
          <h3>${escapeHtml(cat.name)}</h3>
          <p class="muted">${escapeHtml(cat.description || '')}</p>
          ${cat.items
            .map(
              (item) => `
              <article class="item">
                <strong>${escapeHtml(item.title)}</strong>
                <p>${escapeHtml(item.summary || '')}</p>
                <small class="muted">类型：${escapeHtml(item.type || '文章')}</small><br />
                <a class="item-link" href="${escapeHtml(item.href)}" ${item.external ? 'target="_blank" rel="noopener noreferrer"' : ''}>打开内容</a>
              </article>`
            )
            .join('')}
        </section>`
      )
      .join('');

    root.innerHTML = `
      <h2>${escapeHtml(data.title)}</h2>
      <p class="muted">${escapeHtml(data.description || '')}</p>
      <div>${categories}</div>
      <p><a class="button" href="manage.html">打开上传助手维护本分区</a></p>
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
    root.innerHTML = `
      <h2>${escapeHtml(data.title)}</h2>
      <p class="muted">${escapeHtml(data.description || '')}</p>
      <div class="gallery">
      ${data.items
        .map(
          (item) => `
          <figure>
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.caption)}" />
            <figcaption>
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.caption)}</p>
            </figcaption>
          </figure>`
        )
        .join('')}
      </div>
      <p><a class="button" href="manage.html">打开上传助手维护相册</a></p>
    `;
  } catch (error) {
    root.innerHTML = `<p>相册加载失败：${escapeHtml(error.message)}</p>`;
  }
}

function renderUploadAssistant() {
  const output = document.getElementById('upload-output');
  const input = document.getElementById('upload-input');
  const section = document.getElementById('upload-section');
  if (!output || !input || !section) return;

  input.addEventListener('change', (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) {
      output.value = '';
      return;
    }

    const sectionName = section.value;
    const snippets = files.map((file) => {
      const safeName = file.name.replace(/\s+/g, '-');

      if (sectionName === 'life') {
        return `{"title":"${safeName}","image":"assets/images/${safeName}","caption":"写一句生活说明"}`;
      }

      if (sectionName === 'courses') {
        return `{"title":"${safeName}","summary":"课程笔记简介","type":"pdf/latex","href":"assets/docs/${safeName}"}`;
      }

      return `{"title":"${safeName}","summary":"文章简介","type":"文章","href":"posts/${safeName.replace(/\.[^.]+$/, '.html')}"}`;
    });

    output.value = snippets.join(',\n');
  });
}

renderHome();
renderDocPage();
renderGalleryPage();
renderUploadAssistant();
