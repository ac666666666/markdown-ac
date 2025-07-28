import { marked } from 'marked';
import hljs from 'highlight.js';

// 配置 marked v4.x
marked.setOptions({
  gfm: true,
  breaks: true,
  tables: true,
  sanitize: false,
  smartLists: true,
  smartypants: false
});

// 自定义渲染器
const renderer = new marked.Renderer();

// 自定义标题渲染，添加锚点
renderer.heading = function(text, level) {
  const escapedText = text.toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return `<h${level} id="${escapedText}">${text}</h${level}>`;
};

// 自定义代码块渲染
renderer.code = function(code, infostring, escaped) {
  const lang = (infostring || '').match(/\S*/)[0];
  if (lang && hljs.getLanguage(lang)) {
    try {
      const highlighted = hljs.highlight(code, { language: lang }).value;
      return `
        <div class="code-block">
          <div class="code-header">
            <span class="language">${lang}</span>
            <button class="copy-btn" onclick="copyCode(this)" title="复制代码">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
        </div>
      `;
    } catch (err) {
      console.warn('代码高亮失败:', err);
    }
  }
  
  const highlighted = hljs.highlightAuto(code).value;
  return `
    <div class="code-block">
      <div class="code-header">
        <span class="language">text</span>
        <button class="copy-btn" onclick="copyCode(this)" title="复制代码">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      <pre><code class="hljs">${highlighted}</code></pre>
    </div>
  `;
};

// 自定义表格渲染
renderer.table = function(header, body) {
  return `
    <div class="table-wrapper">
      <table>
        <thead>${header}</thead>
        <tbody>${body}</tbody>
      </table>
    </div>
  `;
};

// 自定义链接渲染，外部链接添加 target="_blank"
renderer.link = function(href, title, text) {
  const isExternal = href.startsWith('http://') || href.startsWith('https://');
  const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr}${target}>${text}</a>`;
};

// 自定义图片渲染，添加懒加载和错误处理
renderer.image = function(href, title, text) {
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : '';
  return `
    <div class="image-wrapper">
      <img src="${href}"${altAttr}${titleAttr} loading="lazy" onerror="this.style.display='none'" />
    </div>
  `;
};

marked.use({ renderer });

/**
 * 解析 Markdown 文本为 HTML
 * @param {string} markdown - Markdown 文本
 * @returns {string} HTML 字符串
 */
export function parseMarkdown(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }
  
  try {
    // 使用 marked v4.x 的 API
    return marked(markdown);
  } catch (error) {
    console.error('Markdown 解析失败:', error);
    return `<p>Markdown 解析失败: ${error.message}</p>`;
  }
}

/**
 * 提取 Markdown 文档的目录结构
 * @param {string} markdown - Markdown 文本
 * @returns {Array} 目录数组
 */
export function extractTOC(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return [];
  }
  
  const toc = [];
  const lines = markdown.split('\n');
  
  lines.forEach((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const title = match[2].trim();
      const anchor = title.toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
      
      toc.push({
        level,
        text: title,
        id: anchor,
        line: index + 1
      });
    }
  });
  
  return toc;
}

/**
 * 获取 Markdown 文档的摘要
 * @param {string} markdown - Markdown 文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 摘要文本
 */
export function getMarkdownSummary(markdown, maxLength = 200) {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }
  
  // 移除 Markdown 语法，只保留纯文本
  let text = markdown
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*(.+?)\*/g, '$1') // 移除斜体标记
    .replace(/`(.+?)`/g, '$1') // 移除行内代码标记
    .replace(/```[\s\S]*?```/g, '[代码块]') // 替换代码块
    .replace(/!\[.*?\]\(.*?\)/g, '[图片]') // 替换图片
    .replace(/\[(.+?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
    .replace(/>/g, '') // 移除引用标记
    .replace(/[-*+]\s+/g, '') // 移除列表标记
    .replace(/\d+\.\s+/g, '') // 移除有序列表标记
    .replace(/\n+/g, ' ') // 替换换行为空格
    .trim();
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * 统计 Markdown 文档信息
 * @param {string} markdown - Markdown 文本
 * @returns {Object} 统计信息
 */
export function getMarkdownStats(markdown) {
  if (!markdown || typeof markdown !== 'string') {
    return {
      characters: 0,
      words: 0,
      lines: 0,
      headings: 0,
      codeBlocks: 0,
      images: 0,
      links: 0
    };
  }
  
  const lines = markdown.split('\n');
  const characters = markdown.length;
  const words = markdown.split(/\s+/).filter(word => word.length > 0).length;
  const headings = (markdown.match(/^#{1,6}\s+/gm) || []).length;
  const codeBlocks = (markdown.match(/```[\s\S]*?```/g) || []).length;
  const images = (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length;
  const links = (markdown.match(/\[.+?\]\(.*?\)/g) || []).length;
  
  return {
    characters,
    words,
    lines: lines.length,
    headings,
    codeBlocks,
    images,
    links
  };
}

/**
 * 复制代码到剪贴板的全局函数
 * @param {HTMLElement} button - 复制按钮元素
 */
window.copyCode = function(button) {
  const codeBlock = button.closest('.code-block');
  const code = codeBlock.querySelector('code');
  const text = code.textContent || code.innerText;
  
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
    `;
    button.style.color = '#28a745';
    
    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.color = '';
    }, 2000);
  }).catch(err => {
    console.error('复制失败:', err);
    // 降级方案：选中文本
    const range = document.createRange();
    range.selectNode(code);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  });
};