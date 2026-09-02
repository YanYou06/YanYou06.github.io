# YanYou06.github.io

中文个人主页（极客风格 + 分区化结构 + 可维护内容）。

## 已包含的分区
- 简介
- 学习课程（支持 LaTeX 页面与 PDF 链接）
- 杂谈
- 随记
- 生活碎片（相册模式）

## 维护方式（高自由度）
1. 新文章页面放到 `/posts` 或 `/notes`
2. 课程 PDF 放到 `/assets/docs`
3. 相册图片放到 `/assets/images`
4. 在对应的 `/data/*.json` 中新增条目（可用 `manage.html` 生成 JSON 片段）

## 本地预览
```bash
python -m http.server 8000
```
打开 `http://localhost:8000/index.html`
