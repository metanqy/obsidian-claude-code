# Obsidian 插件开发指南（中文整理）

> 目标：把 Obsidian 社区插件（Community plugin）的**开发、调试、发布、上架**流程整理成一份可复用的参考文档，便于后续持续迭代。

## 1. 你要开发的“插件”是什么？

- **社区插件（Community plugin）**：用 TypeScript/JavaScript 调用 Obsidian 提供的插件 API 扩展功能；用户可在 Obsidian 的 *Community plugins* 面板安装/更新。
- **运行时位置（本地）**：单个插件安装在某个 Vault 的 `VaultFolder/.obsidian/plugins/<plugin-id>/` 目录下。

## 2. 开发前的准备（强烈建议）

### 2.1 单独准备一个“开发用 Vault”

官方建议：**不要在你的主力 Vault 里开发插件**，避免 bug 造成误写/误删笔记数据。新建一个空 Vault 专门用于开发和手工测试。

### 2.2 基础工具链

- Git
- Node.js（建议使用 LTS；官方 sample plugin 提示至少 Node 16+）
- 编辑器（VS Code 等）

## 3. 插件工程与文件结构（你需要认识这些文件）

### 3.1 Obsidian 运行时必需文件（安装到 Vault 后）

在 `VaultFolder/.obsidian/plugins/<plugin-id>/` 下：

- `manifest.json`（必须）：插件元信息与兼容性声明
- `main.js`（必须）：打包/编译后的插件入口
- `styles.css`（可选）：插件样式

### 3.2 发布到社区目录时，仓库根目录常见文件

官方提交指南要求根目录至少准备：

- `README.md`：插件用途与用法（并在必要时**披露**网络访问/账户/付费/越权文件访问等）
- `LICENSE`：开源/授权协议
- `manifest.json`

实践中还会包含：

- `versions.json`：`{ "x.y.z": "minAppVersion" }`，用于兼容不同 Obsidian 版本
- `src/`：TypeScript 源码
- `esbuild.config.mjs`（或其他 bundler 配置）：打包到 `main.js`

### 3.3 `manifest.json` 字段速查（官方 schema）

必填字段：

- `id`：插件唯一 ID（**不能包含** `obsidian`；本地开发时建议与文件夹名一致）
- `name`：展示名称
- `version`：语义化版本 `x.y.z`
- `minAppVersion`：最低 Obsidian 版本
- `author`：作者
- `description`：描述
- `isDesktopOnly`：是否仅桌面端（使用 Node/Electron API 时必须为 `true`）

可选字段：

- `authorUrl`
- `fundingUrl`（字符串或对象）

## 4. 从官方模板开始（最快路径）

推荐直接使用官方模板仓库：`obsidianmd/obsidian-sample-plugin`。

典型步骤（官方 Build a plugin 教程 + 模板 README 的合并整理）：

1. 在你的开发 Vault 下创建插件目录：
   - `VaultFolder/.obsidian/plugins/`
2. 将你的插件仓库（由模板创建）克隆到该目录内：
   - `VaultFolder/.obsidian/plugins/<your-repo>/`
3. 在插件仓库目录执行：
   - `npm install`
   - `npm run dev`（watch 模式，源文件变更会自动重建 `main.js`）
4. 在 Obsidian：
   - Settings → Community plugins → Turn on community plugins
   - Installed plugins 中启用你的插件

> 注意：**修改 `manifest.json` 后需要重启 Obsidian**（官方教程明确提示）。

## 5. 开发工作流：构建 + 热更新/重载

### 5.1 构建（以官方模板为例）

- `npm run dev`：开发 watch 构建，输出 `main.js`
- `npm run build`：生产构建（通常会额外做类型检查/压缩）
- `npm run lint`：Lint（官方模板已预置 eslint + obsidian 规则）

### 5.2 重载插件（不想频繁重启）

Obsidian 插件在你改源码后需要 reload 才会生效：

- 手动：Settings → Community plugins → Installed plugins → 关闭再打开插件开关
- 命令面板：使用 Obsidian 的 reload 相关命令（例如 “Reload app without saving”）
- 自动：安装开发者常用的 [Hot-Reload](https://github.com/pjeby/hot-reload) 插件（文件变更后自动重载）

## 6. 生命周期与资源管理（写对 `onload` / `onunload`）

插件通常继承 `Plugin`：

- `onload()`：插件启用/加载时执行（注册命令、事件、视图、设置页等）
- `onunload()`：插件禁用/卸载时执行（释放资源）

资源管理建议（来自官方指南与 review 常见意见）：

- 避免使用全局 `app` / `window.app`，使用 `this.app`
- 使用 `this.registerEvent(...)`、`this.registerDomEvent(...)`、`this.registerInterval(...)` 等，让 Obsidian 在卸载时自动清理
- 避免在 `onunload` 中做破坏性 UI 操作（例如随意 detach workspace leaf）
- 避免无意义的 `console.log`（默认控制台应尽量干净，只保留必要的错误/诊断信息）

## 7. 常用能力：你大概率会用到的 API 模式

下面这些是官方 sample plugin 中演示的常见入口（建议你在自己的插件里重命名/删掉示例代码再提交）：

- **Ribbon icon**：`this.addRibbonIcon(...)`（左侧栏图标）
- **Status bar**：`this.addStatusBarItem()`（仅桌面端）
- **Commands**：`this.addCommand(...)`
  - `callback`：任意场景可用
  - `editorCallback`：需要编辑器上下文
  - `checkCallback`：先判断当前状态是否允许执行（决定是否在命令面板显示）
- **Settings UI**：`PluginSettingTab` + `Setting(...)`
- **持久化设置**：`this.loadData()` / `this.saveData()`
- **通知**：`new Notice(...)`

## 8. 文件与编辑器操作：性能与体验要点

官方 review 指南中反复强调的实践：

- 修改**当前打开的笔记**优先用 **Editor API**，避免直接 `Vault.modify` 导致光标/折叠等状态丢失
- 修改**后台文件**优先用 `Vault.process`（原子化修改，减少与其他插件冲突）
- 修改 frontmatter 优先用 `FileManager.processFrontMatter`（原子化、格式更一致）
- 优先用 Vault API（`app.vault`）而不是 Adapter API（性能/安全更好）
- 不要遍历所有文件找路径：用 `Vault.getFileByPath` / `getFolderByPath` / `getAbstractFileByPath`

## 9. UI 文案与设置页规范（减少 review 修改成本）

来自官方插件指南：

- 设置页文案倾向 **Sentence case**（句首大写风格），避免 Title Case
- 只有在设置项分多个 section 时才加 heading；避免 “General settings/Settings” 这类冗余标题
- 在设置页做标题时用 `new Setting(containerEl).setName(...).setHeading()`，避免直接写 `<h1>/<h2>`

## 10. 安全、隐私与合规（上架必看）

### 10.1 官方开发者政策（Developer policies）核心点

不允许：

- 代码混淆以隐藏真实目的
- 动态广告（联网加载）
- 客户端遥测（client-side telemetry）
- 插件自带“自动更新机制”（Obsidian 有自己的更新渠道）

如果涉及以下行为，必须在 `README` **清晰披露**：

- 需要付费/账户
- 网络访问（用到哪些远端服务、为什么需要）
- 访问 Vault 之外的文件（为什么需要）
- 服务端遥测（需隐私政策链接）
- 闭源（会 case by case 审核）

### 10.2 DOM 安全

避免 `innerHTML` / `outerHTML` / `insertAdjacentHTML` 拼接用户输入；优先用 DOM API 或 Obsidian 提供的 `createEl/createDiv/createSpan` 等帮助函数。

## 11. 桌面端 vs 移动端兼容

- Node.js / Electron API **仅桌面端可用**（如 `fs`、`os`、`crypto`、Electron 等）
- 一旦使用这些能力，`manifest.json` 中 **必须** 设置 `isDesktopOnly: true`
- 能用 Web API 就尽量用：
  - `SubtleCrypto` 替代 Node `crypto`
  - `navigator.clipboard.*` 处理剪贴板

## 12. 版本管理与发布（GitHub Releases）

### 12.1 版本号规则

- 使用语义化版本：`x.y.z`（官方提交指南强调格式）
- 同步更新：
  - `manifest.json` 的 `version`
  - `manifest.json` 的 `minAppVersion`
  - `versions.json`（把新版本映射到对应 `minAppVersion`）

### 12.2 创建 GitHub Release（Obsidian 用它安装/更新）

官方模板 README 与提交指南的共识流程：

1. 创建 GitHub Release，Tag 版本号必须与 `manifest.json.version` **完全一致**（模板 README 提示不要加 `v` 前缀）
2. 在 Release 附件上传：
   - `main.js`
   - `manifest.json`
   - `styles.css`（可选）
3. 同时把 `manifest.json`（以及常见的 `versions.json`）放在仓库默认分支的根目录，便于 Obsidian 读取最新版本与兼容性信息

> 官方模板还提供 `npm version patch|minor|major` 的版本 bump 思路（会更新 `manifest.json`/`package.json` 并写入 `versions.json`，具体以你的脚本为准）。

## 13. 提交到官方社区插件目录（上架流程）

官方指南要点如下：

1. 仓库根目录准备好 `README.md`、`LICENSE`、`manifest.json`
2. 按上文创建一个可下载的 GitHub Release（附件包含 `main.js/manifest.json/styles.css`）
3. 到 `obsidianmd/obsidian-releases` 仓库编辑 `community-plugins.json`，在数组末尾新增条目：
   - `id/name/author/description/repo`
   - `id` 需唯一，且不能包含 `obsidian`
4. 提交 PR，并在 GitHub 的 PR 模板里选择 **Community Plugin** 检查清单
5. 等待自动校验（Ready for review / Validation failed）
6. 根据 review 反馈修改代码并更新 release（**不要新开 PR**，在原 PR 上迭代）

## 14. 常见问题排查清单

- 插件不出现/不生效：
  - `VaultFolder/.obsidian/plugins/<plugin-id>/` 下是否真的有 `main.js` 和 `manifest.json`
  - `manifest.json.id` 是否与文件夹名一致（官方 manifest 说明里提到本地开发不一致会影响某些回调）
  - 是否在 Obsidian 里开启了 Community plugins 并启用插件
  - 改了 `manifest.json` 后是否重启 Obsidian
- 构建失败：
  - Node 版本是否满足模板要求
  - 先 `npm install` 再 `npm run dev`
- 移动端异常：
  - 是否误用了 Node/Electron API（需要 `isDesktopOnly: true` 或替换为 Web API）

## 15. 官方/权威参考链接（建议收藏）

- 开发者文档主页：https://docs.obsidian.md
- Build a plugin：https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
- Anatomy of a plugin：https://docs.obsidian.md/Plugins/Getting+started/Anatomy+of+a+plugin
- Development workflow：https://docs.obsidian.md/Plugins/Getting+started/Development+workflow
- Manifest schema：https://docs.obsidian.md/Reference/Manifest
- Plugin guidelines：https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines
- Developer policies：https://docs.obsidian.md/Developer+policies
- Submission requirements for plugins：https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins
- Submit your plugin：https://docs.obsidian.md/Plugins/Releasing/Submit+your+plugin
- 官方模板仓库：https://github.com/obsidianmd/obsidian-sample-plugin
- 社区插件目录仓库：https://github.com/obsidianmd/obsidian-releases

