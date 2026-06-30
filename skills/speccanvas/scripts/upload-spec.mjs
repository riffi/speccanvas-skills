#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
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
    skipValidation: false,
    specCanvasRoot: undefined,
    token: undefined,
    tokenEnv: 'SPECCANVAS_MCP_TOKEN',
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
        args.skipValidation = true
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
  --spec-canvas-root PATH     Local Spec Canvas repo root used for YAML parser and validation dependencies.
  --skip-validation           Parse and upload without running validate-spec.mjs.
  --dry-run                   Validate and print planned operations without calling MCP.`)
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function findSpecCanvasRoot(startDir) {
  let currentDir = startDir

  while (true) {
    const siblingCandidate = path.join(currentDir, 'spec-canvas')
    if (await pathExists(path.join(siblingCandidate, 'spec-canvas-ui'))) {
      return siblingCandidate
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) {
      return undefined
    }

    currentDir = parentDir
  }
}

async function resolveSpecCanvasRoot(explicitRoot) {
  const candidates = [
    explicitRoot,
    process.env.SPEC_CANVAS_ROOT,
    path.resolve(process.cwd(), 'spec-canvas'),
    path.resolve(process.cwd(), '..', 'spec-canvas'),
    path.resolve(process.cwd(), '..', '..', 'spec-canvas'),
    path.resolve(__dirname, '../../../../spec-canvas'),
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (await pathExists(path.join(candidate, 'spec-canvas-ui'))) {
      return candidate
    }
  }

  const discovered = await findSpecCanvasRoot(process.cwd())
  if (discovered) {
    return discovered
  }

  throw new Error('Spec Canvas repo not found. Pass --spec-canvas-root or set SPEC_CANVAS_ROOT.')
}

function getPackageRequire(specCanvasRoot) {
  return createRequire(path.join(specCanvasRoot, 'spec-canvas-ui', 'package.json'))
}

function normalizeYamlExport(mod) {
  return mod?.default ?? mod
}

function runValidation(filePath, specCanvasRoot) {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, 'validate-spec.mjs'), '--spec-canvas-root', specCanvasRoot, filePath],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )

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

async function loadYamlFile(yamlModule, filePath) {
  const source = await fs.readFile(filePath, 'utf8')
  const yamlDocument = yamlModule.parseDocument(source)

  if (Array.isArray(yamlDocument.errors) && yamlDocument.errors.length > 0) {
    throw new Error(yamlDocument.errors[0].message)
  }

  return yamlDocument.toJS()
}

function getDefaultDocumentName(doc, fallback) {
  const metadataName = typeof doc?.metadata?.name === 'string' ? doc.metadata.name.trim() : ''
  return metadataName || fallback
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
        version: '0.1.0',
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

async function resolveProject(client, args) {
  if (args.projectId) {
    const result = await client.callTool('get_project', { projectId: args.projectId })
    return result.project
  }

  const result = await client.callTool('list_projects', {})
  const existing = result.projects.find((project) => project.name === args.projectName)

  if (existing) {
    return existing
  }

  const created = await client.callTool('create_project', {
    name: args.projectName,
    description: args.projectDescription ?? null,
  })
  return created.project
}

function findExistingDocument(documents, docType, name) {
  return documents.find((document) => document.docType === docType && document.name === name)
}

async function uploadDocument(client, project, item, docType, doc, args) {
  const name = item.name ?? getDefaultDocumentName(
    doc,
    docType === 'ui-spec' ? 'UI Spec' : 'Data Spec'
  )
  const documentsResult = await client.callTool('list_documents', {
    projectId: project.id,
    docType,
    includeDocument: false,
  })
  const existingDocument = args.mode === 'upsert'
    ? findExistingDocument(documentsResult.documents, docType, name)
    : undefined

  if (existingDocument) {
    const updated = await client.callTool('update_document', {
      documentId: existingDocument.id,
      name,
      document: doc,
    })
    return { action: 'updated', document: updated.document }
  }

  const created = await client.callTool(
    docType === 'ui-spec' ? 'create_ui_spec' : 'create_data_spec',
    {
      projectId: project.id,
      name,
      document: doc,
    }
  )
  return { action: 'created', document: created.document }
}

async function createUiRevision(client, document, doc, filePath, args) {
  const result = await client.callTool('create_revision', {
    documentId: document.id,
    revisionData: doc,
    description: args.revisionDescription ?? `Uploaded from ${filePath}`,
  })
  const revision = result.revision

  const updated = await client.callTool('update_document', {
    documentId: document.id,
    name: document.name,
    document: doc,
    viewRevisionId: revision.id,
  })

  return { document: updated.document, revision }
}

async function prepareDocuments(args, specCanvasRoot) {
  const YAML = normalizeYamlExport(getPackageRequire(specCanvasRoot)('yaml'))
  const files = [
    ...args.uiFiles.map((item) => ({ ...item, expectedDocType: 'ui-spec' })),
    ...args.dataFiles.map((item) => ({ ...item, expectedDocType: 'data-spec' })),
  ]
  const prepared = []

  for (const item of files) {
    const filePath = path.resolve(item.file)
    if (!args.skipValidation) {
      runValidation(filePath, specCanvasRoot)
    }

    const document = await loadYamlFile(YAML, filePath)
    if (document?.docType !== item.expectedDocType) {
      throw new Error(`${filePath} has docType '${document?.docType}', expected '${item.expectedDocType}'`)
    }

    prepared.push({ ...item, filePath, document })
  }

  return prepared
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

  const specCanvasRoot = await resolveSpecCanvasRoot(args.specCanvasRoot)
  const documents = await prepareDocuments(args, specCanvasRoot)

  if (args.dryRun) {
    console.log(JSON.stringify({
      dryRun: true,
      endpoint,
      mode: args.mode,
      projectId: args.projectId,
      projectName: args.projectName,
      documents: documents.map((item) => ({
        file: item.filePath,
        docType: item.expectedDocType,
        name: item.name ?? getDefaultDocumentName(item.document, item.expectedDocType === 'ui-spec' ? 'UI Spec' : 'Data Spec'),
      })),
    }, null, 2))
    return
  }

  const client = new McpClient(endpoint, token)
  await client.initialize()
  const project = await resolveProject(client, args)
  const uploaded = []

  for (const item of documents) {
    const uploadResult = await uploadDocument(
      client,
      project,
      item,
      item.expectedDocType,
      item.document,
      args
    )
    let revision
    let finalDocument = uploadResult.document

    if (item.expectedDocType === 'ui-spec') {
      const revisionResult = await createUiRevision(
        client,
        uploadResult.document,
        item.document,
        item.filePath,
        args
      )
      finalDocument = revisionResult.document
      revision = revisionResult.revision
    }

    uploaded.push({
      action: uploadResult.action,
      docType: item.expectedDocType,
      documentId: finalDocument.id,
      file: item.filePath,
      name: finalDocument.name,
      revisionId: revision?.id,
      revisionVersion: revision?.version,
      viewRevisionId: finalDocument.viewRevisionId,
    })
  }

  console.log(JSON.stringify({
    project: {
      id: project.id,
      name: project.name,
    },
    uploaded,
  }, null, 2))
}

main().catch((error) => {
  console.error(`Upload failed: ${error.message}`)
  process.exit(1)
})
