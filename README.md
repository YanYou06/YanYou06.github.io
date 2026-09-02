# YanYou06.github.io

中文个人主页（极客风格 + 分区化结构 + 可维护内容）。

## 已包含的分区
- 简介
- 学习课程（支持 LaTeX 页面与 PDF 链接）
- 杂谈
- 随记
- 生活碎片（相册模式）

## 维护方式（上传助手）
1. 进入 `manage.html`，输入站长口令后解锁更新
2. 简介/课程/杂谈/随记：直接输入 Markdown 或上传 `.md` 文件
3. 生活碎片：上传图片并填写 Markdown 说明
4. 点击“更新内容”后，分区页面会自动读取并展示最新内容（浏览器本地保存）

## 本地预览
```bash
python -m http.server 8000
```
打开 `http://localhost:8000/index.html`
