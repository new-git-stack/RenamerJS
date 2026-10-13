#!/usr/bin/env node

import { readdir, rename, unlink, access } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import packageJson from './package.json' with { type: 'json' }

function runFFmpeg(args) {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', args)

        ffmpeg.on('error', (error) => {
            reject(error)
        })

        let stderr = ''

        ffmpeg.stderr.on('data', (data) => {
            stderr += data.toString()
        })

        ffmpeg.on('close', (code) => {
            if (code === 0) {
                resolve()
            } else {
                const errorLines = stderr.trim().split('\n')
                const shortError = errorLines.slice(-3).join('\n')

                reject(new Error(`FFmpeg exited with code ${code}\n${shortError}`))
            }
        })
    })
}

function formatNumber(num) {
    if (num < 10) {
        return `0${num}`
    } else {
        return num
    }
}

const version = packageJson.version

if (process.argv[2] === '--version') {
    console.log(version)
    process.exit(0)
}

if (process.argv[2] === '--help' || !process.argv[2]) {
    console.log('renamer --version: View renamer version')
    console.log("renamer mp4: Update the title in the metadata of each mp4 file to it's corresponding filename")
    console.log('renamer mp4 "Rings Of Power": renames every mp4 file sequentially')
    for (let i = 1; i < 6; i++) {
        console.log(`Ep${formatNumber(i)}: Rings of Power Ep${formatNumber(i)}`)
    }
    process.exit(0)
}

const filesArr = await readdir(process.cwd())
const extension = process.argv[2]?.toLowerCase()
const newName = process.argv[3]
let checkExtension = false

filesArr.forEach(file => {
    if(file.includes(`.${extension}`)) {
        checkExtension = !checkExtension
    }
})

if (!checkExtension) {
    console.log(`There are no .${extension} files in the current directory`)
    process.exit(0)
}

const files = filesArr.filter(
    (file) => path.extname(file).toLowerCase() === `.${extension}` && !file.toLowerCase().endsWith(`.temp.${extension}`)
)

files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

if (newName) {
    console.log(files)
    let i = 1
    for (const file of files) {
        const newFileName = `${newName} E${formatNumber(i)}.${extension}`
        if (files.includes(newFileName)) {
            continue
        }
        await rename(file, newFileName)
        i++
    }
} else if (extension) {
    for (const file of files) {
        const title = path.basename(file, path.extname(file))
        const output = `${title}.${randomUUID()}.temp.${extension}`

        try {
            await runFFmpeg([
                '-n',
                '-i', file,
                '-map', '0',
                '-c', 'copy',
                '-metadata', `title=${title}`,
                output
            ])
            await access(output)
            await rename(output, file)
            console.log(`FFmpeg processed "${file}" successfully`)
        } catch (error) {
            try {
                await unlink(output)
            } catch {

            }
            console.error(`Failed to process: ${file}`)
            console.error(error.message)
        }
    }
} else {
    console.log("You have to specify the file extension of the videos")
}