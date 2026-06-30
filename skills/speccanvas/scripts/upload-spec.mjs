#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseArgs(argv) {
  const args = {
    dataFiles: [],
    dryRun: false,
    endpoint: undefined,
    mode: 'upsert',
    projectDescription: undefined,
    projectId: undefined,
    projectName: undefined,
    revisionDescription: undefined,
    specCanvasRoot: undefined,
    token: undefined,
    tokenEnv: 'SPECCANVAS_MCP_TOKEN',
    validate: false,
    uiFiles: [],
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const readValue = () => {
      const value = argv[index + 1]
      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for ${arg}`)
      }
      index += 1
      return value
    }

    switch (arg) {
      case '--data':
        args.dataFiles.push({ file: readValue(), name: undefined })
        break
      case '--data-name':
        if (args.dataFiles.length === 0) throw new Error('--data-name must follow --data')
        args.dataFiles[args.dataFiles.length - 1].name = readValue()
        break
      case '--dry-run':
        args.dryRun = true
        break
      case '--endpoint':
        args.endpoint = readValue()
        break
      case '--mode':
        args.mode = readValue()
        break
      case '--project':
      case '--project-name':
        args.projectName = readValue()
        break
      case '--project-description':
        args.projectDescription = readValue()
        break
      case '--project-id':
        args.projectId = readValue()
        break
      case '--revision-description':
        args.revisionDescription = readValue()
        break
      case '--skip-validation':
        args.validate = false
        break
      case '--spec-canvas-root':
        args.specCanvasRoot = readValue()
        break
      case '--token':
        args.token = readValue()
        break
      case '--token-env':
        args.tokenEnv = readValue()
        break
      case '--ui':
        args.uiFiles.push({ file: readValue(), name: undefined })
        break
      case '--ui-name':
        if (args.uiFiles.length === 0) throw new Error('--ui-name must follow --ui')
        args.uiFiles[args.uiFiles.length - 1].name = readValue()
        break
      case '--validate':
        args.validate = true
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
      default:
        throw new Error(`Unknown argument: ${arg}`)
    }
  }

  if (!['create', 'upsert'].includes(args.mode)) {
    throw new Error('--mode must be create or upsert')
  }

  if (!args.projectId && !args.projectName) {
    throw new Error('Pass --project-name/--project or --project-id')
  }

  if (args.projectId && args.projectName) {
    throw new Error('Pass either --project-id or --project-name, not both')
  }

  if (args.uiFiles.length === 0 && args.dataFiles.length === 0) {
    throw new Error('Pass at least one --ui or --data file')
  }

  return args
}

function printUsage() {
  console.log(`Usage:
  node upload-spec.mjs --project-name NAME --ui docs/spec/ui-spec.yaml --data docs/spec/data-spec.yaml

Options:
  --endpoint URL              MCP HTTP endpoint. Defaults to SPECCANVAS_MCP_URL or SPEC_CANVAS_MCP_URL.
  --token VALUE               Bearer token. Defaults to the environment variable from --token-env.
  --token-env NAME            Bearer token environment variable. Default: SPECCANVAS_MCP_TOKEN.
  --project-name, --project   Find or create project by exact name.
  --project-id UUID           Upload into an existing project.
  --project-description TEXT  Description used only when creating a project.
  --ui FILE                   Upload a UI Spec YAML file.
  --ui-name NAME              Document name for the preceding --ui file.
  --data FILE                 Upload a Data Spec YAML file.
  --data-name NAME            Document name for the preceding --data file.
  --mode create|upsert        create always creates documents; upsert updates same docType+name. Default: upsert.
  --revision-description TEXT Description for created UI Spec revisions.
  --validate                  Run local validate-spec.mjs before upload. Server validation always runs on upload.
  --spec-canvas-root PATH     Optional local Spec Canvas repo root for --validate only.
  --skip-validation           Backward-compatible no-op; local validation is off by default.
  --dry-run                   Print planned operations without calling MCP.`)
}

function runValidation(filePath, specCanvasRoot) {
  const validationArgs = [path.join(__dirname, 'validate-spec.mjs')]
  if (specCanvasRoot) {
    validationArgs.push('--spec-canvas-root', specCanvasRoot)
  }
  validationArgs.push(filePath)

  const result = spawnSync(process.execPath, validationArgs, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  if (result.stdout.trim()) {
    console.log(result.stdout.trim())
  }
  if (result.stderr.trim()) {
    console.error(result.stderr.trim())
  }
  if (result.status !== 0) {
    throw new Error(`Validation failed for ${filePath}`)
  }
}

function parseMcpResponse(text, method) {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed)
  }

  const dataLines = text.split(/\r?\n/).filter((line) => line.startsWith('data:'))
  if (dataLines.length === 0) {
    throw new Error(`No MCP response data for ${method}: ${text.slice(0, 500)}`)
  }

  return JSON.parse(dataLines.map((line) => line.slice(5).trimStart()).join('\n'))
}

function extractToolJson(result) {
  const text = result?.content?.find((part) => part.type === 'text')?.text
  return text ? JSON.parse(text) : result?.structuredContent ?? result
}

class McpClient {
  constructor(endpoint, token) {
    this.endpoint = endpoint
    this.id = 1
    this.token = token
  }

  async rpc(method, params) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: this.id,
        method,
        params,
      }),
    })
    this.id += 1
    const text = await response.text()

    if (!response.ok) {
      throw new Error(`MCP HTTP ${response.status}: ${text.slice(0, 1000)}`)
    }

    const payload = parseMcpResponse(text, method)
    if (payload.error) {
      throw new Error(`${method} failed: ${JSON.stringify(payload.error)}`)
    }

    return payload.result
  }

  async initialize() {
    await this.rpc('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: {
        name: 'speccanvas-skill-upload-spec',
        version: '0.2.0',
      },
    })
  }

  async callTool(name, toolArguments) {
    return extractToolJson(await this.rpc('tools/call', {
      name,
      arguments: toolArguments,
    }))
  }
}

async function prepareDocuments(args) {
  const files = [
    ...args.uiFiles.map((item) => ({ ...item, expectedDocType: 'ui-spec' })),
    ...args.dataFiles.map((item) => ({ ...item, expectedDocType: 'data-spec' })),
  ]
  const prepared = []

  for (const item of files) {
    const filePath = path.resolve(item.file)
    if (args.validate) {
      runValidation(filePath, args.specCanvasRoot)
    }

    prepared.push({
      ...item,
      contentText: await fs.readFile(filePath, 'utf8'),
      filePath,
    })
  }

  return prepared
}

async function uploadDocument(client, item, args) {
  return client.callTool('upload_spec_file', {
    projectId: args.projectId,
    projectName: args.projectName,
    projectDescription: args.projectDescription ?? null,
    documentName: item.name,
    fileName: item.filePath,
    contentText: item.contentText,
    expectedDocType: item.expectedDocType,
    mode: args.mode,
    revisionDescription: args.revisionDescription ?? undefined,
  })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const endpoint = args.endpoint ?? process.env.SPECCANVAS_MCP_URL ?? process.env.SPEC_CANVAS_MCP_URL
  const token = args.token ?? process.env[args.tokenEnv]

  if (!endpoint) {
    throw new Error('MCP endpoint is required. Pass --endpoint or set SPECCANVAS_MCP_URL.')
  }
  if (!args.dryRun && !token) {
    throw new Error(`Bearer token is required. Pass --token or set ${args.tokenEnv}.`)
  }

  const documents = await prepareDocuments(args)

  if (args.dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      endpoint,
      mode: args.mode,
      projectId: args.projectId,
      projectName: args.projectName,
      localValidation: args.validate,
      documents: documents.map((item) => ({
        file: item.filePath,
        docType: item.expectedDocType,
        name: item.name ?? '<server resolves from metadata.name or file name>',
      })),
    }, null, 2))
    return
  }

  const client = new McpClient(endpoint, token)
  await client.initialize()
  const uploaded = []
  let projectSummary

  for (const item of documents) {
    const uploadResult = await uploadDocument(client, item, args)
    projectSummary = {
      id: uploadResult.project.id,
      name: uploadResult.project.name,
    }
    uploaded.push({
      action: uploadResult.action,
      docType: uploadResult.docType,
      documentId: uploadResult.document.id,
      file: item.filePath,
      name: uploadResult.document.name,
      revisionId: uploadResult.revision?.id,
      revisionVersion: uploadResult.revision?.version,
      viewRevisionId: uploadResult.document.viewRevisionId,
    })
  }

  console.log(JSON.stringify({
    project: projectSummary,
    uploaded,
  }, null, 2))
}

main().catch((error) => {
  console.error(`Upload failed: ${error.message}`)
  process.exit(1)
})
