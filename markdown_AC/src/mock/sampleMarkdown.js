// 示例 Markdown 数据

export const sampleMarkdownFiles = [
  {
    id: 1,
    title: "欢迎使用 Markdown 预览器",
    filename: "welcome.md",
    content: `# 欢迎使用 Markdown 预览器

这是一个基于 Vue 3 + Vite 开发的 Markdown 文档预览应用，支持 PWA 安装到手机桌面。

## 主要功能

- ✅ **Markdown 渲染**：支持完整的 Markdown 语法
- ✅ **代码高亮**：基于 highlight.js 的语法高亮
- ✅ **响应式设计**：完美适配手机和桌面设备
- ✅ **PWA 支持**：可安装到手机桌面，离线使用
- ✅ **文件管理**：支持多文档管理和切换

## 支持的语法

### 标题

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题
###### 六级标题

### 文本样式

**粗体文本**
*斜体文本*
~~删除线~~
\`行内代码\`

### 列表

#### 无序列表
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3

#### 有序列表
1. 第一项
2. 第二项
3. 第三项

### 链接和图片

[GitHub](https://github.com)

### 引用

> 这是一个引用块。
> 可以包含多行内容。
>
> — 作者

### 代码块

\`\`\`javascript
function hello() {
  console.log('Hello, Markdown!');
}

hello();
\`\`\`

### 表格

| 功能 | 支持 | 说明 |
|------|------|------|
| 标题 | ✅ | 支持 1-6 级标题 |
| 列表 | ✅ | 有序和无序列表 |
| 代码 | ✅ | 行内和块级代码 |
| 表格 | ✅ | 支持表格渲染 |

### 分割线

---

## 开始使用

1. 选择或上传 Markdown 文件
2. 在预览区域查看渲染效果
3. 享受流畅的阅读体验

**祝您使用愉快！** 🎉`,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    size: '2.1 KB',
    tags: ['欢迎', '介绍']
  },
  {
    id: 2,
    title: "JavaScript 基础教程",
    filename: "javascript-basics.md",
    content: `# JavaScript 基础教程

## 简介

JavaScript 是一种高级的、解释型的编程语言，是 Web 开发的核心技术之一。

## 变量声明

### var、let 和 const

\`\`\`javascript
// var - 函数作用域
var name = 'John';

// let - 块级作用域
let age = 25;

// const - 常量
const PI = 3.14159;
\`\`\`

## 数据类型

### 基本数据类型

1. **Number**：数字
2. **String**：字符串
3. **Boolean**：布尔值
4. **Undefined**：未定义
5. **Null**：空值
6. **Symbol**：符号（ES6+）
7. **BigInt**：大整数（ES2020+）

### 引用数据类型

- **Object**：对象
- **Array**：数组
- **Function**：函数

## 函数

### 函数声明

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### 箭头函数

\`\`\`javascript
const greet = (name) => \`Hello, \${name}!\`;
\`\`\`

## 对象和数组

### 对象

\`\`\`javascript
const person = {
  name: 'Alice',
  age: 30,
  city: 'New York'
};
\`\`\`

### 数组

\`\`\`javascript
const fruits = ['apple', 'banana', 'orange'];
\`\`\`

## 控制流

### 条件语句

\`\`\`javascript
if (age >= 18) {
  console.log('成年人');
} else {
  console.log('未成年人');
}
\`\`\`

### 循环

\`\`\`javascript
// for 循环
for (let i = 0; i < 5; i++) {
  console.log(i);
}

// forEach
fruits.forEach(fruit => {
  console.log(fruit);
});
\`\`\`

## 异步编程

### Promise

\`\`\`javascript
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
\`\`\`

### async/await

\`\`\`javascript
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}
\`\`\`

## 总结

JavaScript 是一门功能强大的语言，掌握这些基础概念是进一步学习的重要基础。

> 💡 **提示**：多练习，多实践，是学习编程的最佳方式！`,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
    size: '3.5 KB',
    tags: ['JavaScript', '教程', '编程']
  },
  {
    id: 3,
    title: "Vue 3 组合式 API 指南",
    filename: "vue3-composition-api.md",
    content: `# Vue 3 组合式 API 指南

## 什么是组合式 API？

组合式 API 是 Vue 3 中引入的一套新的 API，它提供了一种更灵活的方式来组织组件逻辑。

## 基础用法

### setup 函数

\`\`\`vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>计数：{{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    const title = ref('Vue 3 组合式 API')
    const count = ref(0)
    
    const increment = () => {
      count.value++
    }
    
    return {
      title,
      count,
      increment
    }
  }
}
</script>
\`\`\`

### script setup 语法糖

\`\`\`vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <p>计数：{{ count }}</p>
    <button @click="increment">增加</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('Vue 3 组合式 API')
const count = ref(0)

const increment = () => {
  count.value++
}
</script>
\`\`\`

## 响应式 API

### ref

用于创建响应式的基本数据类型：

\`\`\`javascript
import { ref } from 'vue'

const count = ref(0)
const message = ref('Hello')

// 访问值需要使用 .value
console.log(count.value) // 0
count.value = 1
\`\`\`

### reactive

用于创建响应式的对象：

\`\`\`javascript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  message: 'Hello'
})

// 直接访问属性
console.log(state.count) // 0
state.count = 1
\`\`\`

### computed

计算属性：

\`\`\`javascript
import { ref, computed } from 'vue'

const count = ref(0)
const doubleCount = computed(() => count.value * 2)
\`\`\`

### watch

侦听器：

\`\`\`javascript
import { ref, watch } from 'vue'

const count = ref(0)

watch(count, (newValue, oldValue) => {
  console.log(\`count 从 \${oldValue} 变为 \${newValue}\`)
})
\`\`\`

## 生命周期钩子

\`\`\`javascript
import { 
  onMounted, 
  onUpdated, 
  onUnmounted 
} from 'vue'

export default {
  setup() {
    onMounted(() => {
      console.log('组件已挂载')
    })
    
    onUpdated(() => {
      console.log('组件已更新')
    })
    
    onUnmounted(() => {
      console.log('组件即将卸载')
    })
  }
}
\`\`\`

## 组合函数（Composables）

创建可复用的逻辑：

\`\`\`javascript
// composables/useCounter.js
import { ref } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const increment = () => count.value++
  const decrement = () => count.value--
  const reset = () => count.value = initialValue
  
  return {
    count,
    increment,
    decrement,
    reset
  }
}
\`\`\`

使用组合函数：

\`\`\`vue
<script setup>
import { useCounter } from './composables/useCounter'

const { count, increment, decrement, reset } = useCounter(10)
</script>
\`\`\`

## 优势

1. **更好的逻辑复用**：通过组合函数实现
2. **更好的类型推导**：对 TypeScript 更友好
3. **更灵活的代码组织**：相关逻辑可以组织在一起
4. **更小的打包体积**：支持 tree-shaking

## 总结

组合式 API 为 Vue 3 带来了更强大和灵活的开发体验，特别适合复杂的应用开发。

> 📚 **推荐阅读**：[Vue 3 官方文档](https://cn.vuejs.org/)`,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-14'),
    size: '4.2 KB',
    tags: ['Vue', 'Vue3', '组合式API', '前端']
  }
];

// 获取所有文档
export function getAllMarkdownFiles() {
  return sampleMarkdownFiles;
}

// 根据 ID 获取文档
export function getMarkdownFileById(id) {
  return sampleMarkdownFiles.find(file => file.id === id);
}

// 根据标签筛选文档
export function getMarkdownFilesByTag(tag) {
  return sampleMarkdownFiles.filter(file => 
    file.tags.includes(tag)
  );
}

// 搜索文档
export function searchMarkdownFiles(keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return sampleMarkdownFiles.filter(file => 
    file.title.toLowerCase().includes(lowerKeyword) ||
    file.content.toLowerCase().includes(lowerKeyword) ||
    file.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
  );
}

// 获取所有标签
export function getAllTags() {
  const allTags = sampleMarkdownFiles.flatMap(file => file.tags);
  return [...new Set(allTags)];
}