#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseArgs(argv) {
  const args = { files: [], specCanvasRoot: undefined }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--spec-canvas-root') {
      args.specCanvasRoot = argv[i + 1]
      i += 1
      continue
    }

    args.files.push(arg)
  }

  return args
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath)
    return true
  } catch {
    return false
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
    const uiDir = path.join(candidate, 'spec-canvas-ui')
    if (await pathExists(uiDir)) {
      return candidate
    }
  }

  const searchRoots = [path.dirname(path.resolve(process.argv.at(-1) ?? '.')), process.cwd()]
  for (const root of searchRoots) {
    const discovered = await findSpecCanvasRoot(root)
    if (discovered) {
      return discovered
    }
  }

  throw new Error(
    'Spec Canvas repo not found. Pass --spec-canvas-root or set SPEC_CANVAS_ROOT.'
  )
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

async function resolveBundledSchema(docType) {
  const schemaFileName = docType === 'ui-spec' ? 'ui-spec.schema.json' : 'data-spec.schema.json'
  const bundledPath = path.join(__dirname, '..', 'schemas', schemaFileName)

  if (await pathExists(bundledPath)) {
    return bundledPath
  }

  return undefined
}

function getPackageRequire(specCanvasRoot) {
  const packageJsonPath = path.join(specCanvasRoot, 'spec-canvas-ui', 'package.json')
  return createRequire(packageJsonPath)
}

function normalizeAjvExport(mod) {
  return mod?.default ?? mod
}

function normalizeYamlExport(mod) {
  return mod?.default ?? mod
}

function normalizeAddFormatsExport(mod) {
  return mod?.default ?? mod
}

function formatIssue(issue) {
  return `${issue.severity.toUpperCase()} ${issue.path} ${issue.message}`
}

function mapAjvErrors(errors) {
  return errors.map((error) => ({
    severity: 'error',
    path: error.instancePath || '/',
    message: error.message || 'Validation error',
  }))
}

function validateUiCustomRules(doc) {
  const issues = []

  if (doc.templates && typeof doc.templates === 'object') {
    for (const [templateId, template] of Object.entries(doc.templates)) {
      const regions = Array.isArray(template?.regions) ? template.regions : []
      const contentRegions = regions.filter((region) => region?.type === 'content')

      if (contentRegions.length !== 1) {
        issues.push({
          severity: 'error',
          path: `/templates/${templateId}/regions`,
          message: `template must contain exactly one content region, found ${contentRegions.length}`,
        })
      }

      const regionIds = new Set()
      for (let index = 0; index < regions.length; index += 1) {
        const region = regions[index]
        const regionPath = `/templates/${templateId}/regions/${index}`

        if (regionIds.has(region.id)) {
          issues.push({
            severity: 'error',
            path: `${regionPath}/id`,
            message: `duplicate region id '${region.id}'`,
          })
        }
        regionIds.add(region.id)

        const blocks = Array.isArray(region.blocks) ? region.blocks : []
        const regionBlockIds = new Set()

        for (let blockIndex = 0; blockIndex < blocks.length; blockIndex += 1) {
          const block = blocks[blockIndex]
          const blockPath = `${regionPath}/blocks/${blockIndex}`

          if (regionBlockIds.has(block.id)) {
            issues.push({
              severity: 'error',
              path: `${blockPath}/id`,
              message: `duplicate template block id '${block.id}' in region '${region.id}'`,
            })
          }
          regionBlockIds.add(block.id)
        }

        if ((region.type === 'static' || region.type === 'floating') && blocks.length === 0) {
          issues.push({
            severity: 'error',
            path: `${regionPath}/blocks`,
            message: `${region.type} region must contain at least one block`,
          })
        }

        if (region.type === 'content' && blocks.length > 0) {
          issues.push({
            severity: 'error',
            path: `${regionPath}/blocks`,
            message: 'content region must not contain blocks',
          })
        }

        const floatingPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']
        const regularPositions = ['left', 'right', 'top', 'bottom', 'center']

        if (region.type === 'floating' && !floatingPositions.includes(region.position)) {
          issues.push({
            severity: 'error',
            path: `${regionPath}/position`,
            message: `floating region must use one of: ${floatingPositions.join(', ')}`,
          })
        }

        if (
          (region.type === 'static' || region.type === 'content') &&
          !regularPositions.includes(region.position)
        ) {
          issues.push({
            severity: 'error',
            path: `${regionPath}/position`,
            message: `${region.type} region must use one of: ${regularPositions.join(', ')}`,
          })
        }

        if (region.fixed && region.type !== 'static') {
          issues.push({
            severity: 'warning',
            path: `${regionPath}/fixed`,
            message: 'fixed=true is only meaningful for static regions',
          })
        }
      }
    }
  }

  const templateIds = doc.templates ? Object.keys(doc.templates) : []
  if (doc.default_template && !templateIds.includes(doc.default_template)) {
    issues.push({
      severity: 'error',
      path: '/default_template',
      message: `references missing template '${doc.default_template}'`,
    })
  }

  const screens = doc.screens && typeof doc.screens === 'object' ? doc.screens : {}
  const screenIds = Object.keys(screens)

  for (const [screenId, screen] of Object.entries(screens)) {
    if (typeof screen?.template === 'string') {
      if (!templateIds.includes(screen.template)) {
        issues.push({
          severity: 'error',
          path: `/screens/${screenId}/template`,
          message: `references missing template '${screen.template}'`,
        })
      }
    } else if (screen?.template && typeof screen.template === 'object') {
      for (const [breakpoint, templateId] of Object.entries(screen.template)) {
        if (!templateIds.includes(templateId)) {
          issues.push({
            severity: 'error',
            path: `/screens/${screenId}/template/${breakpoint}`,
            message: `references missing template '${templateId}'`,
          })
        }
      }
    }

    const blocks = Array.isArray(screen?.blocks) ? screen.blocks : []
    const blockIdIssues = validateUiBlockIds(screenId, blocks)
    const rowWarnings = validateUiColumns(screenId, blocks)
    issues.push(...blockIdIssues)
    issues.push(...rowWarnings)
  }

  const navigationItems = Array.isArray(doc.navigation?.items) ? doc.navigation.items : []
  for (let index = 0; index < navigationItems.length; index += 1) {
    const item = navigationItems[index]
    if (!screenIds.includes(item.target)) {
      issues.push({
        severity: 'error',
        path: `/navigation/items/${index}/target`,
        message: `references missing screen '${item.target}'`,
      })
    }
  }

  const groupIssues = validateUiScreenGroups(doc, screenIds)
  const navIssues = validateUiMainNavigation(doc)
  issues.push(...groupIssues, ...navIssues)

  return issues
}

function validateUiBlockIds(screenId, blocks) {
  const issues = []
  const allIds = new Set()

  function visit(nodeBlocks, parentPath) {
    const siblingIds = new Set()

    for (let index = 0; index < nodeBlocks.length; index += 1) {
      const block = nodeBlocks[index]
      const blockPath = `${parentPath}/${index}`

      if (siblingIds.has(block.id)) {
        issues.push({
          severity: 'error',
          path: `${blockPath}/id`,
          message: `duplicate sibling block id '${block.id}'`,
        })
      }
      siblingIds.add(block.id)

      if (allIds.has(block.id)) {
        issues.push({
          severity: 'error',
          path: `${blockPath}/id`,
          message: `duplicate block id '${block.id}' in screen '${screenId}'`,
        })
      }
      allIds.add(block.id)

      const childBlocks = Array.isArray(block.blocks) ? block.blocks : []
      if (childBlocks.length > 0) {
        visit(childBlocks, `${blockPath}/blocks`)
      }
    }
  }

  visit(blocks, `/screens/${screenId}/blocks`)
  return issues
}

function validateUiColumns(screenId, blocks) {
  const issues = []
  const numericBlocks = blocks
    .map((block) => ({ columns: getDefaultColumns(block?.columns) }))
    .filter(({ columns }) => Number.isInteger(columns))

  if (numericBlocks.length === 0) {
    return issues
  }

  let currentRowSum = 0
  let rowStartIndex = 0

  for (let index = 0; index < numericBlocks.length; index += 1) {
    const columns = numericBlocks[index].columns

    if (currentRowSum + columns > 12) {
      if (currentRowSum > 0 && currentRowSum < 12) {
        issues.push({
          severity: 'warning',
          path: `/screens/${screenId}/blocks`,
          message: `grid row starting at block ${rowStartIndex} totals ${currentRowSum}, not 12`,
        })
      }

      currentRowSum = columns
      rowStartIndex = index
    } else {
      currentRowSum += columns
    }
  }

  if (currentRowSum > 0 && currentRowSum < 12) {
    issues.push({
      severity: 'warning',
      path: `/screens/${screenId}/blocks`,
      message: `last grid row totals ${currentRowSum}, not 12`,
    })
  }

  return issues
}

function getDefaultColumns(columns) {
  if (Number.isInteger(columns)) {
    return columns
  }

  if (columns && typeof columns === 'object' && Number.isInteger(columns.default)) {
    return columns.default
  }

  return undefined
}

function validateUiScreenGroups(doc, screenIds) {
  const issues = []
  const groups = Array.isArray(doc.screen_groups) ? doc.screen_groups : []
  const groupIds = new Set()
  const assignedScreens = new Map()

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index]
    const groupPath = `/screen_groups/${index}`

    if (groupIds.has(group.id)) {
      issues.push({
        severity: 'error',
        path: `${groupPath}/id`,
        message: `duplicate screen group id '${group.id}'`,
      })
    }
    groupIds.add(group.id)

    const groupScreens = Array.isArray(group.screens) ? group.screens : []
    for (let screenIndex = 0; screenIndex < groupScreens.length; screenIndex += 1) {
      const screenId = groupScreens[screenIndex]

      if (!screenIds.includes(screenId)) {
        issues.push({
          severity: 'error',
          path: `${groupPath}/screens/${screenIndex}`,
          message: `references missing screen '${screenId}'`,
        })
      }

      if (assignedScreens.has(screenId)) {
        issues.push({
          severity: 'warning',
          path: `${groupPath}/screens/${screenIndex}`,
          message: `screen '${screenId}' already assigned to group '${assignedScreens.get(screenId)}'`,
        })
      } else {
        assignedScreens.set(screenId, group.id)
      }
    }
  }

  return issues
}

function validateUiMainNavigation(doc) {
  const issues = []
  const navigationItems = Array.isArray(doc.navigation?.items) ? doc.navigation.items : []

  if (navigationItems.length === 0 || !doc.templates || typeof doc.templates !== 'object') {
    return issues
  }

  const hasMainNavigation = Object.values(doc.templates).some((template) =>
    Array.isArray(template?.regions) &&
    template.regions.some((region) =>
      Array.isArray(region?.blocks) &&
      region.blocks.some((block) => block?.type === 'main_navigation')
    )
  )

  if (!hasMainNavigation) {
    issues.push({
      severity: 'warning',
      path: '/navigation/items',
      message: "navigation.items exist but no template renders a block with type 'main_navigation'",
    })
  }

  return issues
}

function validateDataCustomRules(doc) {
  const issues = []
  const entities = doc.entities && typeof doc.entities === 'object' ? doc.entities : {}
  const entityNames = new Set(Object.keys(entities))
  const enumNames = new Set(Object.keys(doc.enums || {}))
  const builtInTypes = new Set(['string', 'integer', 'decimal', 'boolean', 'datetime', 'uuid', 'json'])

  for (const [entityName, entity] of Object.entries(entities)) {
    const fields = entity?.fields && typeof entity.fields === 'object' ? entity.fields : {}

    for (const [fieldName, field] of Object.entries(fields)) {
      if (field?.type && !builtInTypes.has(field.type) && !enumNames.has(field.type)) {
        issues.push({
          severity: 'error',
          path: `/entities/${entityName}/fields/${fieldName}/type`,
          message: `references missing enum '${field.type}'`,
        })
      }

      if (field?.fk) {
        const [refEntity, refField] = String(field.fk).split('.')

        if (!entityNames.has(refEntity)) {
          issues.push({
            severity: 'error',
            path: `/entities/${entityName}/fields/${fieldName}/fk`,
            message: `references missing entity '${refEntity}'`,
          })
          continue
        }

        if (!entities[refEntity]?.fields?.[refField]) {
          issues.push({
            severity: 'error',
            path: `/entities/${entityName}/fields/${fieldName}/fk`,
            message: `references missing field '${refEntity}.${refField}'`,
          })
        }
      }
    }
  }

  const validCardinalities = new Set(['one_to_one', 'one_to_many', 'many_to_many'])
  const relations = Array.isArray(doc.relations) ? doc.relations : []
  for (let index = 0; index < relations.length; index += 1) {
    const relation = relations[index]

    if (!entityNames.has(relation.entity_a)) {
      issues.push({
        severity: 'error',
        path: `/relations/${index}/entity_a`,
        message: `references missing entity '${relation.entity_a}'`,
      })
    }

    if (!entityNames.has(relation.entity_b)) {
      issues.push({
        severity: 'error',
        path: `/relations/${index}/entity_b`,
        message: `references missing entity '${relation.entity_b}'`,
      })
    }

    if (!validCardinalities.has(relation.cardinality)) {
      issues.push({
        severity: 'error',
        path: `/relations/${index}/cardinality`,
        message: `invalid cardinality '${relation.cardinality}'`,
      })
    }
  }

  return issues
}

async function loadYamlFile(yamlModule, filePath) {
  const source = await fs.readFile(filePath, 'utf8')
  const document = yamlModule.parseDocument(source)

  if (Array.isArray(document.errors) && document.errors.length > 0) {
    const firstError = document.errors[0]
    throw new Error(firstError.message)
  }

  return document.toJS()
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.files.length !== 1) {
    console.error('Usage: node validate-spec.mjs [--spec-canvas-root PATH] <spec-file.yaml>')
    process.exit(2)
  }

  const specFile = path.resolve(args.files[0])
  const specCanvasRoot = await resolveSpecCanvasRoot(args.specCanvasRoot)
  const requireFromSpecCanvas = getPackageRequire(specCanvasRoot)

  const YAML = normalizeYamlExport(requireFromSpecCanvas('yaml'))
  const Ajv = normalizeAjvExport(requireFromSpecCanvas('ajv'))
  const addFormats = normalizeAddFormatsExport(requireFromSpecCanvas('ajv-formats'))

  const doc = await loadYamlFile(YAML, specFile)
  const docType = doc?.docType

  let schemaPath
  let customIssues = []

  if (docType === 'ui-spec') {
    schemaPath =
      (await resolveBundledSchema(docType)) ??
      path.join(specCanvasRoot, 'spec-canvas-ui', 'src', 'features', 'ui-spec', 'schemas', 'ui-spec.schema.json')
    customIssues = validateUiCustomRules(doc)
  } else if (docType === 'data-spec') {
    schemaPath =
      (await resolveBundledSchema(docType)) ??
      path.join(specCanvasRoot, 'spec-canvas-ui', 'src', 'features', 'data-spec', 'schemas', 'data-spec.schema.json')
    customIssues = validateDataCustomRules(doc)
  } else {
    throw new Error(`Unsupported or missing docType '${docType}'. Expected 'ui-spec' or 'data-spec'.`)
  }

  const schema = JSON.parse(await fs.readFile(schemaPath, 'utf8'))
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
    allowUnionTypes: true,
  })
  addFormats(ajv)
  const validate = ajv.compile(schema)
  validate(doc)

  const schemaIssues = validate.errors ? mapAjvErrors(validate.errors) : []
  const issues = [...schemaIssues, ...customIssues]
  const errors = issues.filter((issue) => issue.severity === 'error')
  const warnings = issues.filter((issue) => issue.severity === 'warning')

  console.log(`Validated: ${specFile}`)
  console.log(`Spec Canvas root: ${specCanvasRoot}`)
  console.log(`Schema errors: ${errors.length}`)
  console.log(`Warnings: ${warnings.length}`)

  for (const issue of issues) {
    console.log(formatIssue(issue))
  }

  if (errors.length > 0) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(`Validation failed: ${error.message}`)
  process.exit(1)
})
