# Web Agent v1.2.3 — Production MVP

一个浏览器里的 Coding Agent：无需安装本地客户端，桌面 Chromium 可直接授权真实项目目录；也可导入 ZIP / 文件夹到浏览器 Sandbox。

## 已包含

- Web Agent 品牌与 OpenCode 风格工作区
- 黑 / 白主题
- 左侧 Workspace、中央 Chat、右侧 Editor / Diff
- 所有主要面板可拖拽调整大小
- Enter 发送消息，Shift+Enter 换行
- OpenAI / Anthropic / Gemini / OpenRouter / DeepSeek / Qwen / Kimi / GLM / MiniMax / Doubao Ark / Baichuan / SiliconFlow / NVIDIA NIM / Mistral / xAI / Groq / Together / Fireworks / Cerebras / SambaNova / Perplexity / Cohere / 自定义 OpenAI Compatible
- 读取模型列表后选择具体模型
- Agent Loop：list_files / read_file / search_files / write_file / create_file / delete_file / rename_file / run_command
- 文件改动先进入 Diff，用户确认后再写回真实本地目录
- 浏览器 WebContainer Terminal
- Markdown / TXT / JSON Skill 装载、激活和移除
- 思考强度：自动 / 关闭 / 最低 / 低 / 中 / 高 / 极高
- 思考强度不按具体模型 ID 写死：OpenAI/兼容接口使用 reasoning_effort，Anthropic 使用 extended thinking，Gemini 使用 thinkingConfig；当供应商/模型拒绝显式参数时自动回退到模型默认行为
- 可选“公开推理摘要”显示；不会展示隐藏思维链
- 中英文 UI
- API Key 与全部供应商配置仅存于当前浏览器 localStorage，不上传到本项目服务器（本项目为静态前端）；请求只会直接发送到用户选择的 AI 供应商 API

## 本地测试

推荐 Python：

```bash
python3 server.py
```

打开：

```text
http://127.0.0.1:8080
```

Chrome DevTools Console 输入：

```js
crossOriginIsolated
```

应返回：

```text
true
```

## Vercel

直接把项目根目录部署到 Vercel。`vercel.json` 已配置 COOP / COEP：

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: credentialless`

## Netlify

直接把项目根目录部署到 Netlify。`netlify.toml` 与 `_headers` 已配置相同响应头。

## 重要的生产注意事项

### API Key

当前是 BYOK 浏览器直连模式，API Key 会保存在浏览器 localStorage。不要把固定平台密钥直接写进前端。正式商业产品建议提供后端代理 / OAuth / 更强的密钥管理策略。

### CORS

供应商 API 必须允许浏览器端请求，否则请配置自己的 API Proxy。

### WebContainer

`run_command` 在浏览器 WebContainer 沙箱内执行，不会执行用户电脑上的 PowerShell / bash / EXE / Unity / Xcode。正式商业化使用 WebContainer API 前，请确认当前许可方案和使用范围。

### 文件权限

桌面 Chromium 使用 File System Access API。只有用户主动授权的目录才会被读取或写回。

## Skill 格式

推荐 Markdown：

```md
# My Skill

你是一个严格的 TypeScript 重构专家。

- 优先保持现有架构
- 修改前先读取相关文件
- 完成后运行测试
```

也支持 JSON：

```json
{
  "name": "My Skill",
  "instructions": "你是一个严格的 TypeScript 重构专家。"
}
```

## 思考强度

“自动”模式使用模型自身默认行为；显式强度会使用供应商提供的通用推理参数。不同模型对可用强度可能不同，因此实现会在显式参数被拒绝时回退到默认行为，而不是依赖硬编码模型名单。

界面中的“公开推理摘要”只处理供应商明确返回的摘要字段；不会展示隐藏思维链。



## 供应商与模型列表

“读取模型”会优先调用供应商公开的模型列表接口；若供应商没有公开或浏览器直连被 CORS/策略阻断，部分供应商会回退到兼容模型目录，用户仍可手动输入模型 ID。浏览器直连是否成功取决于供应商是否允许 CORS。Google Gemini 官方提供 `models.list`，NVIDIA NIM 官方提供统一 OpenAI-compatible `/v1/chat/completions` endpoint，因此 NVIDIA 也提供了专用兼容处理。

## 密钥隐私

当前版本没有自己的后端 API Key 存储。API Key 使用浏览器 `localStorage` 保存，并由浏览器直接发送到用户选择的供应商。清除站点数据会清除本地配置。


## API connection mode

This release is **browser-direct only**. The static server (`server.py`, Vercel, Netlify, etc.) serves the UI files only; it does not receive or forward AI requests and does not store API keys.

The browser sends requests directly to the configured provider endpoint, including model discovery, API tests, chat completions, and tool-calling turns. Because of this, a provider must permit browser CORS for the chosen endpoint. A provider that blocks browser CORS cannot be made to work by this app without changing the architecture.

API keys are saved in `localStorage` on the current browser origin. Clearing site data removes them.

## v1.2.3 changes
- All AI/model requests remain browser-direct only; no API proxy is included.
- NVIDIA NIM shows an explicit browser-direct/CORS notice.
- API errors are classified as timeout/network/CORS, 400, 401, 403, 404, 408, 409, 422, 429, and 5xx where applicable.
- Unified Agent tools now include `copy_file`, `move_file`, `mkdir`, `delete_directory`, `git_diff`, `file_exists`, and `get_file_info`, in addition to the existing file and sandbox command tools.
- Directory changes are staged in Diff and require user approval before local disk changes are applied.
