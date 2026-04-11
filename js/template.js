/**
 * Lightweight template engine supporting Handlebars-compatible syntax.
 * Supports: {{var}}, {{{raw}}}, {{#each}}, {{#if}}, {{#ifCond}}, {{helper var}}, {{../parent}}, {{this}}, {{@key}}.
 */

const helpers = {}

function registerHelper (name, fn) {
  helpers[name] = fn
}

function compile (template) {
  return (context) => render(template, context, context)
}

function render (tmpl, ctx, parent) {
  let result = ''
  let i = 0

  while (i < tmpl.length) {
    if (tmpl.startsWith('{{{', i)) {
      const end = tmpl.indexOf('}}}', i + 3)
      result += String(evalExpr(tmpl.slice(i + 3, end).trim(), ctx, parent) ?? '')
      i = end + 3
      continue
    }

    if (tmpl.startsWith('{{#', i)) {
      const tagEnd = tmpl.indexOf('}}', i + 3)
      const [tagName, ...args] = tmpl.slice(i + 3, tagEnd).trim().split(/\s+/)
      const innerStart = tagEnd + 2
      const closeEnd = findClose(tmpl, tagName, innerStart)
      const closeStart = closeEnd - `{{/${tagName}}}`.length
      const inner = tmpl.slice(innerStart, closeStart)
      const [trueBlock, falseBlock] = splitElse(inner, tagName)

      if (tagName === 'each') {
        const items = resolve(args[0], ctx, parent)
        if (Array.isArray(items)) {
          result += items.map((item, idx) => {
            const c = typeof item === 'object' && item !== null ? { ...item, '@index': idx } : item
            return render(trueBlock, c, ctx)
          }).join('')
        } else if (items && typeof items === 'object') {
          result += Object.entries(items).map(([key, val]) => {
            const c = typeof val === 'object' && val !== null
              ? { ...val, '@key': key }
              : { '@key': key, _thisVal: val }
            return render(trueBlock, c, ctx)
          }).join('')
        }
      } else if (tagName === 'if') {
        const val = resolve(args[0], ctx, parent)
        result += render(val ? trueBlock : (falseBlock || ''), ctx, parent)
      } else if (tagName === 'ifCond') {
        const v1 = resolve(args[0], ctx, parent)
        const v2 = resolve(args[1], ctx, parent)
        result += render(v1 === v2 ? trueBlock : (falseBlock || ''), ctx, parent)
      }

      i = closeEnd
      continue
    }

    if (tmpl.startsWith('{{', i)) {
      const end = tmpl.indexOf('}}', i + 2)
      const val = evalExpr(tmpl.slice(i + 2, end).trim(), ctx, parent)
      result += escapeHtml(String(val ?? ''))
      i = end + 2
      continue
    }

    result += tmpl[i]
    i++
  }

  return result
}

function resolve (path, ctx, parent) {
  if (path === 'this') return ctx?._thisVal !== undefined ? ctx._thisVal : ctx
  if (path.startsWith('@')) return ctx?.[path]
  if (path.startsWith('../')) return resolve(path.slice(3), parent, parent)
  if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path)
  if (/^["'].*["']$/.test(path)) return path.slice(1, -1)
  return path.split('.').reduce((obj, key) => obj?.[key], ctx)
}

function evalExpr (expr, ctx, parent) {
  const parts = expr.split(/\s+/)
  if (parts.length >= 2 && helpers[parts[0]]) {
    return helpers[parts[0]](resolve(parts[1], ctx, parent))
  }
  return resolve(parts[0], ctx, parent)
}

function findClose (tmpl, tagName, from) {
  const open = `{{#${tagName}`
  const close = `{{/${tagName}}}`
  let depth = 1
  let i = from
  while (i < tmpl.length) {
    if (tmpl.startsWith(close, i)) {
      depth--
      if (depth === 0) return i + close.length
    } else if (tmpl.startsWith(open, i)) {
      depth++
    }
    i++
  }
  throw new Error(`Unclosed {{#${tagName}}} block`)
}

function splitElse (inner, tagName) {
  const elseTag = '{{else}}'
  let depth = 0
  for (let i = 0; i < inner.length; i++) {
    if (inner.startsWith(`{{#`, i)) depth++
    else if (inner.startsWith(`{{/`, i)) depth--
    else if (depth === 0 && inner.startsWith(elseTag, i)) {
      return [inner.slice(0, i), inner.slice(i + elseTag.length)]
    }
  }
  return [inner, '']
}

function escapeHtml (str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export { compile, registerHelper }
