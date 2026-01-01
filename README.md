# obsidian-claude-code-plugin

开发 Obsidian 社区插件的整理笔记与后续实现仓库。

- 开发指南：`docs/obsidian-plugin-dev-guide.zh-CN.md`

## Demo 插件：AI Chatbot 右侧面板

该示例插件会在右侧面板创建一个占位视图，用于后续接入 AI Chatbot 交互。

- 命令面板执行：`Open AI chatbot panel (right)`
- 或点击左侧工具栏的机器人图标打开

## 快速开始（建议流程）

1. 新建一个“开发专用 Vault”（不要在主力 Vault 里开发）。
2. 将插件仓库放到 `VaultFolder/.obsidian/plugins/<plugin-id>/`（或用 symlink 指向该目录）。
3. 在仓库目录执行：
   - `npm install`
   - `npm run dev`
4. 在 Obsidian 中启用 Community plugins，并在 Installed plugins 里启用本插件。
5. 改源码后通过开关重载插件，或使用 Hot-Reload 插件自动重载。
