const fs = require('fs')
const path = require('path')
const process = require('process')
const { spawnSync } = require('child_process')
const log = console.log

function scanDirCallback(dir) {
  const childScanDirList = fs.readdirSync(dir)
  for (const child of childScanDirList) {
    var stat = fs.statSync(dir + path.sep + child)
    if (stat.isDirectory()) {
      const newName = formatName(child)
      const newPath = dir + path.sep + newName
      const oldPath = dir + path.sep + child
      scanDirCallback(dir + path.sep + child)
    } else {
      const oldPath = dir + path.sep + child
      const filename = formatName(child)
      const newPath = dir + path.sep + filename
      filenameMap.set(child, {
        oldPath,
        newPath,
        oldName: child,
        newName: filename,
      })
    }
  }
}

/**
 * @param {String} filename
 */
function formatName(filename) {
  if (/[A-Z]/.test(filename)) {
    function upperToLower(match, offset, string) {
      return `${offset ? '_' : ''}${match.toLowerCase()}`
    }
    const newFilename = filename.replace(/[A-Z]/g, upperToLower)
    return newFilename
  }
  return filename
}

const filenameMap = new Map()
const argv = process.argv
const cwd = process.cwd()
const option = argv.reduce((acc, itemArg) => {
  if (itemArg.includes('=')) {
    const item = itemArg.split('=')
    acc[item[0]] = item[1]
  }
  return acc
}, {})

let scanDir = cwd + path.sep
if (option.src) {
  scanDir += option.src
} else {
  throw new Error('缺少 src, 格式 src=xxx')
}

scanDirCallback(scanDir)
filenameMap.forEach((option, key, map) => {
  let fileContent = fs.readFileSync(option.oldPath).toString()
  filenameMap.forEach((option1, key1, map1) => {
    if (fileContent.includes(key1)) {
      fileContent = fileContent.replace(key1, option1.newName)
    }
  })
  fs.writeFileSync(option.oldPath, Buffer.from(fileContent))
  fs.renameSync(option.oldPath, option.newPath)
})
