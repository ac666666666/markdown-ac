<template>
  <div class="markdown-app">
    <!-- 头部导航 -->
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <svg
            class="logo-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            ></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          Markdown 预览器
        </h1>
        <div class="header-actions">
          <button
            class="btn-icon"
            @click="toggleSearch"
            :class="{ active: showSearch }"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
          <button class="btn-icon" @click="toggleUpload">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              ></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <polyline points="9,15 12,12 15,15"></polyline>
            </svg>
          </button>
          <button
            class="btn-icon"
            @click="toggleEditorMode"
            :class="{ active: showEditor }"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              ></path>
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              ></path>
            </svg>
          </button>
          <ThemeSelector />
          <!-- PWA安装按钮 -->
          <button
            v-if="isInstallable"
            class="btn-icon install-btn"
            @click="installApp"
            title="安装应用"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7,10 12,15 17,10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- PWA安装提示 -->
      <div class="install-prompt" v-if="showInstallPrompt">
        <div class="install-content">
          <div class="install-info">
            <svg
              class="install-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              ></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            <div class="install-text">
              <h4>安装 Markdown 预览器</h4>
              <p>安装到桌面，享受更好的使用体验</p>
            </div>
          </div>
          <div class="install-actions">
            <button class="btn-install" @click="installApp">安装</button>
            <button class="btn-dismiss" @click="dismissInstallPrompt">
              稍后
            </button>
          </div>
        </div>
      </div>

      <!-- 离线状态提示 -->
      <div class="offline-indicator" v-if="!isOnline">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M1 1l22 22"></path>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        <span>离线模式</span>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar" v-show="showSearch">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索文档标题、内容或标签..."
          class="search-input"
          @input="handleSearch"
        />
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <!-- 侧边栏 - 文档列表 -->
      <aside class="sidebar" :class="{ 'sidebar-hidden': currentDocument }">
        <div class="sidebar-header">
          <h2>文档列表</h2>
          <div class="document-stats">
            <span>{{ filteredDocuments.length }} 个文档</span>
            <div class="storage-actions">
              <button
                class="btn-storage"
                @click="handleExportDocuments"
                title="导出文档"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </button>
              <input
                ref="importInput"
                type="file"
                accept=".json"
                @change="handleImportDocuments"
                style="display: none"
              />
              <button
                class="btn-storage"
                @click="$refs.importInput.click()"
                title="导入文档"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17,8 12,3 7,8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </button>
              <button
                class="btn-storage danger"
                @click="handleClearDocuments"
                title="清空所有文档"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path
                    d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"
                  ></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 标签筛选 -->
        <div class="tag-filter" v-if="allTags.length > 0">
          <div class="tag-list">
            <button
              class="tag-btn"
              :class="{ active: selectedTag === null }"
              @click="selectedTag = null"
            >
              全部
            </button>
            <button
              v-for="tag in allTags"
              :key="tag"
              class="tag-btn"
              :class="{ active: selectedTag === tag }"
              @click="selectedTag = tag"
            >
              {{ tag }}
            </button>
          </div>
        </div>

        <!-- 文档列表 -->
        <div class="document-list">
          <div
            v-for="doc in filteredDocuments"
            :key="doc.id"
            class="document-item"
            :class="{ active: currentDocument?.id === doc.id }"
            @click="selectDocument(doc)"
          >
            <div class="document-header">
              <h3 class="document-title">{{ doc.title }}</h3>
              <span class="document-size">{{ doc.size }}</span>
            </div>
            <p class="document-summary">
              {{ getDocumentSummary(doc.content) }}
            </p>
            <div class="document-meta">
              <span class="document-date">{{ formatDate(doc.updatedAt) }}</span>
              <div class="document-tags">
                <span v-for="tag in doc.tags" :key="tag" class="tag">{{
                  tag
                }}</span>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredDocuments.length === 0" class="empty-state">
            <svg
              class="empty-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
              ></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
            <p>
              {{
                searchQuery
                  ? "没有找到匹配的文档"
                  : "暂无文档，点击上传按钮添加文档"
              }}
            </p>
          </div>
        </div>
      </aside>

      <!-- 文档预览区域 -->
      <section class="document-viewer" v-if="currentDocument">
        <div class="viewer-header">
          <button
            class="btn-back"
            @click="currentDocument = null"
            v-if="isMobile"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
            返回列表
          </button>
          <div class="document-info">
            <h1 class="viewer-title">{{ currentDocument.title }}</h1>
            <div class="document-actions">
              <button class="btn-action" @click="toggleTOC">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                目录
              </button>
              <button class="btn-action" @click="toggleFullscreen">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"
                  ></path>
                </svg>
                全屏
              </button>
              <button
                class="btn-action"
                @click="toggleEditorMode"
                :class="{ active: showEditor }"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                  ></path>
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                  ></path>
                </svg>
                编辑
              </button>
            </div>
          </div>
        </div>

        <!-- 编辑器模式 -->
        <MarkdownEditor
          v-if="showEditor && currentDocument"
          v-model="currentDocument.content"
          @save="saveDocument"
          class="document-editor"
        />

        <!-- 预览模式 -->
        <div v-else class="preview-mode">
          <div
            class="preview-container"
            :class="{
              'with-toc': showTOC && !isMobile && documentTOC.length > 0,
            }"
          >
            <!-- Markdown 内容 -->
            <div
              class="markdown-content"
              v-html="renderedContent"
              ref="contentRef"
            ></div>

            <!-- 目录组件 - PC端右侧显示 -->
            <div
              v-if="showTOC && !isMobile && documentTOC.length > 0"
              class="toc-sidebar"
            >
              <TableOfContents
                :toc-items="documentTOC"
                :auto-collapse="false"
                class="toc-component"
              />
            </div>
          </div>

          <!-- 目录组件 - 移动端顶部显示 -->
          <TableOfContents
            v-if="showTOC && isMobile && documentTOC.length > 0"
            :toc-items="documentTOC"
            :auto-collapse="true"
            class="toc-component mobile-toc"
          />

          <!-- 阅读进度条 -->
          <div class="reading-progress">
            <div
              class="progress-bar"
              :style="{ width: readingProgress + '%' }"
            ></div>
          </div>
        </div>
      </section>

      <!-- 欢迎页面 -->
      <section class="welcome-screen" v-else>
        <div class="welcome-content">
          <svg
            class="welcome-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            ></path>
            <polyline points="14,2 14,8 20,8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10,9 9,9 8,9"></polyline>
          </svg>
          <h2>欢迎使用 Markdown 预览器</h2>
          <p>选择左侧文档开始阅读，或上传新的 Markdown 文件</p>
          <div class="welcome-features">
            <div class="feature-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              <span>完整 Markdown 语法支持</span>
            </div>
            <div class="feature-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <span>移动端优化体验</span>
            </div>
            <div class="feature-item">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="3"></circle>
                <path
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
                ></path>
              </svg>
              <span>代码高亮与复制</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- 文件上传模态框 -->
    <div
      class="modal-overlay"
      v-show="showUploadModal"
      @click="closeUploadModal"
    >
      <div class="upload-modal" @click.stop>
        <div class="modal-header">
          <h3>上传 Markdown 文件</h3>
          <button class="btn-close" @click="closeUploadModal">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <LocalFileUpload
            :accept="'.md,.markdown,.txt'"
            :max-size="100 * 1024 * 1024"
            :multiple="false"
            :auto-process="true"
            @file-added="handleFileAdded"
            @file-success="handleFileSuccess"
            @file-error="handleFileError"
            @file-processed="handleFileProcessed"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import {
  getAllMarkdownFiles,
  searchMarkdownFiles,
  getMarkdownFilesByTag,
  getAllTags,
} from "../mock/sampleMarkdown.js";
import {
  parseMarkdown,
  extractTOC,
  getMarkdownSummary,
} from "../utils/markdown.js";
import { useDocumentStorage } from "../composables/useDocumentStorage.js";
import { usePWA } from "../composables/usePWA.js";
import CodeBlock from "../components/CodeBlock.vue";
import TableOfContents from "../components/TableOfContents.vue";
import FileUpload from "../components/FileUpload.vue";
import LocalFileUpload from "../components/LocalFileUpload.vue";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import ThemeSelector from "../components/ThemeSelector.vue";

// 初始化文档存储管理器
const documentStorage = useDocumentStorage();
const {
  documents,
  addDocument,
  updateDocument,
  deleteDocument,
  clearAllDocuments,
  exportDocuments,
  importDocuments,
  saveCurrentDocumentId,
  loadCurrentDocumentId,
  getStorageUsage,
} = documentStorage.createDocumentManager(getAllMarkdownFiles());

// 初始化PWA功能
const {
  isOnline,
  isInstallable,
  showInstallPrompt,
  installApp,
  dismissInstallPrompt,
} = usePWA();

// 响应式数据
const currentDocument = ref(null);
const searchQuery = ref("");
const selectedTag = ref(null);
const showSearch = ref(false);
const showUploadModal = ref(false);
const showTOC = ref(false);
const showEditor = ref(false);
const readingProgress = ref(0);
const contentRef = ref(null);
const fileInput = ref(null);
const isMobile = ref(window.innerWidth <= 768);

// 计算属性
const allTags = computed(() => getAllTags());

const filteredDocuments = computed(() => {
  let result = documents.value;

  // 按标签筛选
  if (selectedTag.value) {
    result = getMarkdownFilesByTag(selectedTag.value);
  }

  // 按搜索关键词筛选
  if (searchQuery.value.trim()) {
    result = searchMarkdownFiles(searchQuery.value.trim());
  }

  return result;
});

const renderedContent = computed(() => {
  if (!currentDocument.value || !currentDocument.value.content) return "";
  // 确保 content 是字符串类型
  const content = currentDocument.value.content;
  if (typeof content !== "string") {
    console.warn("文档内容不是字符串类型:", content);
    return "";
  }
  return parseMarkdown(content);
});

const documentTOC = computed(() => {
  if (!currentDocument.value) return [];
  return extractTOC(currentDocument.value.content);
});

// 方法
const selectDocument = (doc) => {
  currentDocument.value = doc;
  // 只在移动端自动隐藏目录
  if (isMobile.value) {
    showTOC.value = false;
  }

  // 保存当前文档ID到本地存储
  if (doc && doc.id) {
    saveCurrentDocumentId(doc.id);
  }

  nextTick(() => {
    updateReadingProgress();
  });
};

const toggleSearch = () => {
  showSearch.value = !showSearch.value;
  if (!showSearch.value) {
    searchQuery.value = "";
  }
};

const toggleUpload = () => {
  showUploadModal.value = true;
};

const closeUploadModal = () => {
  showUploadModal.value = false;
};

const toggleTOC = () => {
  showTOC.value = !showTOC.value;
};

const toggleEditorMode = () => {
  showEditor.value = !showEditor.value;
  if (showEditor.value) {
    showTOC.value = false;
  }
};

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
};

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
};

const getDocumentSummary = (content) => {
  return getMarkdownSummary(content, 100);
};

const formatDate = (date) => {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

const scrollToHeading = (anchor) => {
  const element = document.getElementById(anchor);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

const updateReadingProgress = () => {
  if (!contentRef.value) return;

  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollHeight =
    document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / scrollHeight) * 100;
  readingProgress.value = Math.min(100, Math.max(0, progress));
};

const handleResize = () => {
  isMobile.value = window.innerWidth <= 768;
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  processFiles(files);
};

const handleDrop = (event) => {
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files);
  processFiles(files);
};

const processFiles = async (files) => {
  for (const file of files) {
    if (
      file.type === "text/markdown" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".markdown") ||
      file.name.endsWith(".txt")
    ) {
      try {
        const content = await file.text();
        const newDoc = {
          id: Date.now() + Math.random(),
          title: file.name.replace(/\.(md|markdown|txt)$/, ""),
          filename: file.name,
          content: content,
          createdAt: new Date(),
          updatedAt: new Date(),
          size: formatFileSize(file.size),
          tags: ["上传"],
        };
        documents.value.unshift(newDoc);
      } catch (error) {
        console.error("文件读取失败:", error);
      }
    }
  }
  closeUploadModal();
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const handleFileUploaded = (fileData) => {
  const newDoc = {
    id: Date.now() + Math.random(),
    title: fileData.name.replace(/\.(md|markdown|txt)$/, ""),
    filename: fileData.name,
    content: fileData.content,
    createdAt: new Date(),
    updatedAt: new Date(),
    size: formatFileSize(fileData.size),
    tags: ["上传"],
  };
  documents.value.unshift(newDoc);
  closeUploadModal();
  selectDocument(newDoc);
};

const handleFilePreview = (fileData) => {
  const tempDoc = {
    id: "preview-" + Date.now(),
    title: fileData.name.replace(/\.(md|markdown|txt)$/, ""),
    filename: fileData.name,
    content: fileData.content,
    createdAt: new Date(),
    updatedAt: new Date(),
    size: formatFileSize(fileData.size),
    tags: ["预览"],
  };
  selectDocument(tempDoc);
  closeUploadModal();
};

const handleFileCleared = () => {
  // 文件清除处理
};

// 增强文件上传事件处理
const handleFileAdded = (file) => {
  console.log("文件已添加:", file.name);
};

const handleFileProcessed = (fileData) => {
  const newDoc = {
    id: Date.now(),
    title: fileData.name.replace(/\.(md|markdown|txt)$/i, ""),
    content: fileData.content,
    tags: ["本地"],
    createdAt: new Date(),
    updatedAt: new Date(),
    summary: getMarkdownSummary(fileData.content),
  };

  addDocument(newDoc);
  selectDocument(newDoc);
  closeUploadModal();
};

const handleFileSuccess = (file) => {
  console.log("文件读取成功:", file.name);

  // 如果是文本文件且有内容，添加到文档列表
  if (file.content && file.name.match(/\.(md|markdown|txt)$/i)) {
    const newDoc = {
      id: Date.now() + Math.random(),
      title: file.name.replace(/\.(md|markdown|txt)$/i, ""),
      filename: file.name,
      content: file.content,
      createdAt: new Date(),
      updatedAt: new Date(),
      size: formatFileSize(file.size),
      tags: ["上传"],
    };

    addDocument(newDoc);
    selectDocument(newDoc);
    closeUploadModal();
  }
};

const handleFileError = (file, error) => {
  console.error("文件处理失败:", file.name, error);
  // 可以在这里显示错误提示
};

// 导出文档
const handleExportDocuments = () => {
  try {
    const success = exportDocuments();
    if (success) {
      console.log("文档导出成功");
    } else {
      console.error("文档导出失败");
    }
  } catch (error) {
    console.error("导出文档时发生错误:", error);
  }
};

// 导入文档
const handleImportDocuments = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const importedCount = await importDocuments(file);
    console.log(`成功导入 ${importedCount} 个文档`);
    // 重置文件输入
    event.target.value = "";
  } catch (error) {
    console.error("导入文档失败:", error.message);
    event.target.value = "";
  }
};

// 清空所有文档
const handleClearDocuments = () => {
  if (confirm("确定要清空所有文档吗？此操作不可撤销。")) {
    clearAllDocuments();
    currentDocument.value = null;
    console.log("所有文档已清空");
  }
};

const saveDocument = () => {
  if (currentDocument.value) {
    const updates = {
      content: currentDocument.value.content,
      summary: getMarkdownSummary(currentDocument.value.content),
    };

    const updatedDoc = updateDocument(currentDocument.value.id, updates);
    if (updatedDoc) {
      currentDocument.value = updatedDoc;
    }

    console.log("文档已保存:", currentDocument.value.title);
  }
};

// 生命周期
onMounted(() => {
  window.addEventListener("scroll", updateReadingProgress);
  window.addEventListener("resize", handleResize);

  // 尝试恢复上次选择的文档
  const lastDocId = loadCurrentDocumentId();
  if (lastDocId && documents.value.length > 0) {
    const lastDoc = documents.value.find(
      (doc) => doc.id.toString() === lastDocId
    );
    if (lastDoc) {
      selectDocument(lastDoc);
      return;
    }
  }

  // 如果没有找到上次的文档，选择第一个
  if (documents.value.length > 0) {
    selectDocument(documents.value[0]);
  }
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateReadingProgress);
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
/* CSS变量定义 */
:root {
  --theme-primary: #007bff;
  --theme-secondary: #6c757d;
  --theme-background: #ffffff;
  --theme-text: #2c3e50;
  --theme-surface: #f8f9fa;
  --theme-border: #e1e5e9;
  --theme-hover: #f0f8ff;
}

/* 动画关键帧 */
@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

/* 使用 rem 单位确保移动端适配 */
.markdown-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-size: 1rem;
  background: var(--theme-background);
  color: var(--theme-text);
  transition: all 0.3s ease;
}

/* 头部样式 */
.app-header {
  background: var(--theme-background);
  border-bottom: 1px solid var(--theme-border);
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--theme-text);
  margin: 0;
}

.logo-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--theme-primary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--theme-secondary);
  position: relative;
  overflow: hidden;
}

.btn-icon::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.btn-icon:hover::before {
  left: 100%;
}

.btn-icon:hover,
.btn-icon.active {
  background: var(--theme-primary);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(var(--theme-primary-rgb, 102, 126, 234), 0.4);
}

.btn-icon svg {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.3s ease;
}

.btn-icon:hover svg {
  transform: scale(1.1) rotate(5deg);
}

/* 移动端触摸反馈 */
@media (max-width: 768px) {
  .btn-icon:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}

.search-bar {
  padding: 0 1rem 1rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  animation: slideInDown 0.6s ease-out 0.2s both;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--theme-border);
  border-radius: 25px;
  font-size: 1rem;
  background: var(--theme-surface);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  color: var(--theme-text);
}

.search-input:focus {
  outline: none;
  border-color: var(--theme-primary);
  background: var(--theme-background);
  box-shadow: 0 8px 25px rgba(var(--theme-primary-rgb, 102, 126, 234), 0.3);
  transform: translateY(-2px);
}

.search-input::placeholder {
  color: var(--theme-secondary);
  transition: color 0.3s ease;
}

.search-input:focus::placeholder {
  color: var(--theme-secondary);
  opacity: 0.7;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 侧边栏样式 */
.sidebar {
  width: 20rem;
  background: var(--theme-surface);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 8rem);
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--theme-border);
  transition: all 0.3s ease;
}

.sidebar:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--theme-border);
  background: var(--theme-background);
}

.sidebar-header h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--theme-text);
}

.document-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--theme-secondary);
}

.storage-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.btn-storage {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  padding: 0;
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  background: var(--theme-surface);
  color: var(--theme-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-storage:hover {
  background: var(--theme-primary);
  color: #fff;
  border-color: var(--theme-primary);
  transform: translateY(-1px);
}

.btn-storage.danger:hover {
  background: #dc3545;
  border-color: #dc3545;
}

.btn-storage svg {
  width: 0.875rem;
  height: 0.875rem;
}

/* PWA安装按钮样式 */
.install-btn {
  background: var(--theme-primary) !important;
  color: white !important;
  border: none !important;
}

.install-btn:hover {
  background: var(--theme-primary) !important;
  transform: translateY(-1px);
  opacity: 0.9;
}

/* PWA安装提示样式 */
.install-prompt {
  position: fixed;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  background: var(--theme-background);
  border: 1px solid var(--theme-border);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.install-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.install-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.install-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--theme-primary);
  flex-shrink: 0;
}

.install-text h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--theme-text);
}

.install-text p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--theme-secondary);
}

.install-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-install {
  background: var(--theme-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-install:hover {
  background: var(--theme-primary);
  transform: translateY(-1px);
  opacity: 0.9;
}

.btn-dismiss {
  background: transparent;
  color: var(--theme-secondary);
  border: 1px solid var(--theme-border);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.btn-dismiss:hover {
  background: var(--theme-surface);
  color: var(--theme-text);
}

/* 离线状态指示器 */
.offline-indicator {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: #f59e0b;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  z-index: 1000;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.offline-indicator svg {
  width: 1rem;
  height: 1rem;
}

.tag-filter {
  padding: 1rem;
  border-bottom: 1px solid var(--theme-border);
  background: var(--theme-background);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-btn {
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--theme-border);
  background: var(--theme-background);
  border-radius: 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--theme-secondary);
}

.tag-btn:hover,
.tag-btn.active {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
  color: #fff;
}

.document-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.document-item {
  padding: 1rem;
  margin-bottom: 0.5rem;
  background: var(--theme-background);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.document-item:hover {
  border-color: var(--theme-primary);
  box-shadow: 0 0.125rem 0.25rem rgba(0, 123, 255, 0.15);
}

.document-item.active {
  border-color: var(--theme-primary);
  background: var(--theme-hover);
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.document-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--theme-text);
  line-height: 1.4;
}

.document-size {
  font-size: 0.75rem;
  color: var(--theme-secondary);
  background: var(--theme-surface);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
}

.document-summary {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: var(--theme-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.document-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.document-date {
  font-size: 0.75rem;
  color: var(--theme-secondary);
}

.document-tags {
  display: flex;
  gap: 0.25rem;
}

.tag {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  background: var(--theme-surface);
  color: var(--theme-text);
  border-radius: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--theme-secondary);
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  margin-bottom: 1rem;
  color: var(--theme-border);
}

/* 文档预览区域 */
.document-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--theme-background);
  padding-left: 1.5rem;
}

.viewer-header {
  padding: 0.5rem 2rem;
  border-bottom: 1px solid var(--theme-border);
  background: var(--theme-background);
  position: sticky;
  top: 0;
  z-index: 10;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--theme-border);
  background: var(--theme-background);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  margin-bottom: 1rem;
  transition: all 0.15s ease;
  color: var(--theme-secondary);
}

.btn-back:hover {
  border-color: var(--theme-primary);
  color: var(--theme-primary);
}

.btn-back svg {
  width: 1rem;
  height: 1rem;
}

.document-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.viewer-title {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--theme-text);
  line-height: 1.3;
}

.document-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--theme-border);
  background: var(--theme-background);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  color: var(--theme-secondary);
}

.btn-action:hover {
  border-color: var(--theme-primary);
  color: var(--theme-primary);
}

.btn-action svg {
  width: 1rem;
  height: 1rem;
}

.toc-sidebar {
  position: absolute;
  top: 100%;
  right: 1rem;
  width: 15rem;
  max-height: 20rem;
  background: var(--theme-background);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  z-index: 20;
  overflow-y: auto;
}

.toc-sidebar h3 {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--theme-text);
  border-bottom: 1px solid var(--theme-border);
}

.toc-nav {
  padding: 0.5rem 0;
}

.toc-nav a {
  display: block;
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  color: var(--theme-secondary);
  text-decoration: none;
  transition: all 0.15s ease;
}

.toc-nav a:hover {
  background: var(--theme-surface);
  color: var(--theme-primary);
}

.toc-level-1 {
  padding-left: 1rem;
}
.toc-level-2 {
  padding-left: 1.5rem;
}
.toc-level-3 {
  padding-left: 2rem;
}
.toc-level-4 {
  padding-left: 2.5rem;
}
.toc-level-5 {
  padding-left: 3rem;
}
.toc-level-6 {
  padding-left: 3.5rem;
}

.reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 0.25rem;
  background: rgba(0, 123, 255, 0.1);
  z-index: 1000;
}

.progress-bar {
  height: 100%;
  background: var(--theme-primary);
  transition: width 0.1s ease;
}

/* 欢迎页面 */
.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--theme-surface);
}

.welcome-content {
  text-align: center;
  max-width: 30rem;
}

.welcome-icon {
  width: 4rem;
  height: 4rem;
  color: var(--theme-primary);
  margin-bottom: 1.5rem;
}

.welcome-content h2 {
  margin: 0 0 1rem 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--theme-text);
}

.welcome-content p {
  margin: 0 0 2rem 0;
  font-size: 1.125rem;
  color: var(--theme-secondary);
  line-height: 1.6;
}

.welcome-features {
  display: grid;
  gap: 1rem;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--theme-background);
  border-radius: 0.375rem;
  border: 1px solid var(--theme-border);
}

.feature-item svg {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--theme-primary);
  flex-shrink: 0;
}

.feature-item span {
  font-size: 0.875rem;
  color: var(--theme-text);
  font-weight: 500;
}

/* 上传模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.upload-modal {
  background: var(--theme-background);
  border-radius: 0.5rem;
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175);
  width: 100%;
  max-width: 30rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--theme-text);
}

.btn-close {
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--theme-secondary);
  transition: all 0.15s ease;
}

.btn-close:hover {
  background: var(--theme-surface);
  color: var(--theme-text);
}

.btn-close svg {
  width: 1.25rem;
  height: 1.25rem;
}

.modal-content {
  padding: 1.5rem;
}

.upload-area {
  border: 2px dashed var(--theme-border);
  border-radius: 0.5rem;
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.15s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: var(--theme-primary);
  background: rgba(0, 123, 255, 0.05);
}

.upload-icon {
  width: 3rem;
  height: 3rem;
  color: var(--theme-secondary);
  margin-bottom: 1rem;
}

.upload-area p {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: var(--theme-text);
}

.btn-select {
  color: var(--theme-primary);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}

.upload-area small {
  color: var(--theme-secondary);
  font-size: 0.875rem;
}

/* 预览容器布局 */
.preview-container {
  display: flex;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
}

.preview-container.with-toc .markdown-content {
  flex: 1;
  min-width: 0;
}

.markdown-content {
  flex: 1;
  line-height: 1.6;
  color: var(--theme-text);
  font-size: 1rem;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  padding: 1.5rem 2rem;
}

/* 目录侧边栏 */
.toc-sidebar {
  width: 18rem;
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
  align-self: flex-start;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
}

.toc-sidebar .toc-component {
  position: static;
  width: 100%;
  max-height: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid var(--theme-border);
  border-radius: 0.375rem;
  background: var(--theme-background);
}

/* 移动端目录 */
.mobile-toc {
  position: absolute;
  top: 100%;
  right: 1rem;
  width: 15rem;
  max-height: 20rem;
  z-index: 20;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.document-editor {
  flex: 1;
  height: calc(100vh - 8rem);
}

.preview-mode {
  flex: 1;
  position: relative;
}

.btn-action.active {
  background: var(--theme-primary);
  color: #fff;
  border-color: var(--theme-primary);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header-content {
    padding: 0.75rem 1rem;
  }

  .app-title {
    font-size: 1.125rem;
  }

  .main-content {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
  }

  .sidebar {
    width: 100%;
    max-height: none;
    border-radius: 16px;
    margin-bottom: 1rem;
  }

  .sidebar:hover {
    transform: none;
  }

  .sidebar-hidden {
    display: none;
  }

  .document-viewer {
    min-height: calc(100vh - 4rem);
    padding-left: 0;
    border-radius: 16px;
    background: var(--theme-surface);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }

  .viewer-header {
    padding: 0.75rem 1rem;
    border-radius: 16px 16px 0 0;
  }

  .viewer-title {
    font-size: 1.25rem;
  }

  .document-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .document-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .btn-action {
    font-size: 0.8125rem;
    padding: 0.375rem 0.625rem;
    border-radius: 12px;
  }

  .btn-action.active {
    background: var(--theme-primary);
    color: #fff;
    border-color: var(--theme-primary);
  }

  /* 移动端预览容器 */
  .preview-container {
    flex-direction: column;
    gap: 1rem;
  }

  .toc-sidebar {
    position: static;
    width: 100%;
    max-height: 15rem;
    margin-bottom: 1rem;
    border-radius: 12px;
  }

  .mobile-toc {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: calc(100% - 2rem);
    max-width: 20rem;
  }

  .toc-component {
    order: -1;
    border-radius: 12px;
  }

  .document-editor {
    height: calc(100vh - 6rem);
  }

  /* 移动端按钮触摸反馈 */
  .btn-back:active,
  .btn-action:active,
  .tag-btn:active,
  .document-item:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }

  /* 移动端搜索栏 */
  .search-input {
    border-radius: 20px;
  }

  .btn-icon {
    width: 2.25rem;
    height: 2.25rem;
  }

  .welcome-content {
    padding: 1rem;
  }

  .welcome-content h2 {
    font-size: 1.5rem;
  }

  .welcome-content p {
    font-size: 1rem;
  }

  .upload-modal {
    margin: 1rem;
  }

  .upload-area {
    padding: 2rem 1rem;
  }

  .install-prompt {
    bottom: 1rem;
    left: 1rem;
    right: 1rem;
    transform: none;
    max-width: none;
    width: auto;
  }
  
  .offline-indicator {
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
  }
  
  .install-actions {
    flex-direction: column;
  }
  
  .btn-install,
  .btn-dismiss {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: 0.5rem 0.75rem;
  }

  .app-title {
    font-size: 1rem;
  }

  .logo-icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .btn-icon {
    width: 2.25rem;
    height: 2.25rem;
  }

  .btn-icon svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  .search-bar {
    padding: 0 0.75rem 0.75rem;
  }

  .sidebar-header,
  .tag-filter {
    padding: 0.75rem;
  }

  .document-list {
    padding: 0.375rem;
  }

  .document-item {
    padding: 0.75rem;
  }

  .viewer-header {

    padding: 0.5rem 0.75rem;
  }

  .viewer-title {
    font-size: 1.125rem;
  }

  .document-viewer {
    padding-left: 0.75rem;
  }
}
</style>