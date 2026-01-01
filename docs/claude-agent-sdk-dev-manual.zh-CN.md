# Claude Agent SDK（原 Claude Code SDK）开发手册

> 目标：整理 Claude Agent SDK（原 Claude Code SDK）官方文档要点，作为本地手册，便于后续开发插件型 agent。  
> 本手册聚焦 **SDK 接入、核心概念、权限与工具、MCP 扩展、会话与多轮** 等开发要点。

## 1. SDK 概览

Claude Agent SDK 是 Claude Code SDK 的新名称，能力从“编码助手”扩展到通用 AI agent 构建。SDK 自带工具执行与会话编排能力，能够直接调用工具并在消息流中返回进度与结果。

**内置工具（常用）**

| 工具 | 作用 |
| --- | --- |
| `Read` | 读取工作目录内文件 |
| `Write` | 新建文件 |
| `Edit` | 精确编辑已有文件 |
| `Bash` | 执行命令、脚本、git 操作 |
| `Glob` | 按路径模式查找文件（如 `**/*.ts`） |
| `Grep` | 正则搜索文件内容 |
| `WebSearch` | 联网搜索 |
| `WebFetch` | 抓取并解析网页 |

**Claude Code 文件系统特性（可选）**

SDK 可以读取 Claude Code 的文件系统配置，但**默认不加载**。若要启用，需要配置 `setting_sources` / `settingSources`。

| 特性 | 说明 | 位置 |
| --- | --- | --- |
| Skills | Markdown 定义的专项能力 | `.claude/skills/SKILL.md` |
| Slash commands | 自定义命令 | `.claude/commands/*.md` |
| Memory | 项目上下文/指令 | `CLAUDE.md` 或 `.claude/CLAUDE.md` |
| Plugins | 扩展命令、agent、MCP | 通过 `plugins` 选项注入 |

## 2. 安装与准备

### 2.1 安装 Claude Code 运行时

SDK 依赖 Claude Code 作为运行时：

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

Windows / 其他平台参考 Claude Code setup 文档（官方提供多平台指引）。

### 2.2 安装 SDK

**TypeScript**

```bash
npm install @anthropic-ai/claude-agent-sdk
```

**Python**

```bash
pip install claude-agent-sdk
```

### 2.3 API Key 与第三方授权

设置 API Key：

```bash
export ANTHROPIC_API_KEY=your-api-key
```

支持第三方 API 提供方：

- Amazon Bedrock：`CLAUDE_CODE_USE_BEDROCK=1`
- Google Vertex AI：`CLAUDE_CODE_USE_VERTEX=1`
- Microsoft Foundry：`CLAUDE_CODE_USE_FOUNDRY=1`

> 注意：官方要求 SDK 应用使用 API key 方式授权，避免使用 claude.ai 登录与限额分发。

## 3. 快速上手流程（Quickstart 精简版）

1. 创建项目目录（如 `my-agent`）
2. 写入含 bug 的示例文件（如 `utils.py`）
3. 编写 agent 程序（Python / TS），核心由三部分组成：
   - `query`：启动 agentic loop，返回异步消息流
   - `prompt`：任务指令
   - `options`：权限与工具配置

**Python 示例（只允许运行编辑工具）**

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt="Find and fix bugs in utils.py",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Glob"],
            permission_mode="acceptEdits",
        ),
    ):
        if hasattr(message, "result"):
            print(message.result)

asyncio.run(main())
```

**运行后效果：** Claude 会读取文件、分析问题、修改代码并返回结果。

## 4. 核心概念与配置

### 4.1 `query`：自动工具循环

- `query()` 会返回 **异步迭代器**
- SDK 负责工具调用、上下文维护与重试
- 你只需消费消息流（可过滤成文本输出）

### 4.2 权限模式（Permission Mode）

| 模式 | 行为 | 使用场景 |
| --- | --- | --- |
| `acceptEdits` | 自动批准文件编辑，其它操作仍需确认 | 可信开发环境 |
| `bypassPermissions` | 全自动，不弹窗 | CI/CD、自动化管道 |
| `default` | 需自行实现 `canUseTool` 回调 | 自定义审批流程 |

### 4.3 System Prompt（默认不再加载）

SDK 现在**默认不使用** Claude Code 的系统提示词。若想使用：

```ts
systemPrompt: { type: "preset", preset: "claude_code" }
```

或直接传入自定义系统提示：

```ts
systemPrompt: "You are a helpful coding assistant"
```

### 4.4 `settingSources` / `setting_sources`

默认不加载任何文件系统配置，保证隔离性。若要读取本地配置：

- `user`：`~/.claude/settings.json`
- `project`：`.claude/settings.json`
- `local`：`.claude/settings.local.json`

**常见用法：**

```ts
settingSources: ["project"] // 仅加载团队共享配置
```

若希望恢复 Claude Code SDK v0.0.x 行为：

```ts
settingSources: ["user", "project", "local"]
```

## 5. MCP 与自定义工具

### 5.1 Python MCP 工具（内嵌）

```python
from claude_agent_sdk import tool, create_sdk_mcp_server, ClaudeAgentOptions

@tool("add", "Add two numbers", {"a": float, "b": float})
async def add(args):
    return {
        "content": [{"type": "text", "text": f"Sum: {args['a'] + args['b']}"}]
    }

calculator = create_sdk_mcp_server(name="calculator", tools=[add])

options = ClaudeAgentOptions(
    mcp_servers={"calc": calculator},
    allowed_tools=["mcp__calc__add"],
)
```

### 5.2 TypeScript MCP 工具

TypeScript 用 `tool()` + `createSdkMcpServer()` 定义工具与 MCP 实例，再通过 `mcpServers` 注入。

## 6. 会话与多轮交互

### 6.1 Python：`ClaudeSDKClient`

当需要**持续会话上下文**时，使用 `ClaudeSDKClient`，可多次调用 `query()`，保持记忆。

### 6.2 TypeScript：V2 Preview 简化接口

V2 预览提供更简洁的 `send()/receive()` 方式：

- `session.send()`：发送消息
- `session.receive()`：以流式方式接收结果

适合多轮对话，不需要管理 AsyncGenerator 状态。

## 7. 迁移要点（Claude Code SDK ➜ Agent SDK）

| 变更项 | 旧 | 新 |
| --- | --- | --- |
| TS 包名 | `@anthropic-ai/claude-code` | `@anthropic-ai/claude-agent-sdk` |
| Python 包名 | `claude-code-sdk` | `claude-agent-sdk` |
| 文档位置 | Claude Code docs | API Guide → Agent SDK |

关键 Breaking Changes：

1. **系统提示不再默认加载**
2. **本地 settings 不再自动加载**
3. Python `ClaudeCodeOptions` 改名为 `ClaudeAgentOptions`

如依赖 CLAUDE.md、slash commands 等配置，需要显式 `settingSources`。

## 8. 常见问题与排查

- **Claude Code not found**：安装 Claude Code 运行时并重启终端
- **API key not found**：确认 `ANTHROPIC_API_KEY` 环境变量
- **设置未生效**：检查是否配置 `settingSources` 包含 `project`

## 9. 参考链接（官方）

- Agent SDK Overview: https://platform.claude.com/docs/en/agent-sdk/overview
- Quickstart: https://platform.claude.com/docs/en/agent-sdk/quickstart
- Python SDK: https://platform.claude.com/docs/en/agent-sdk/python
- TypeScript SDK: https://platform.claude.com/docs/en/agent-sdk/typescript
- TypeScript V2 Preview: https://platform.claude.com/docs/en/agent-sdk/typescript-v2-preview
- Migration Guide: https://platform.claude.com/docs/en/agent-sdk/migration-guide
- Permissions: https://platform.claude.com/docs/en/agent-sdk/permissions
- Hooks: https://platform.claude.com/docs/en/agent-sdk/hooks
- Sessions: https://platform.claude.com/docs/en/agent-sdk/sessions
- MCP: https://platform.claude.com/docs/en/agent-sdk/mcp
