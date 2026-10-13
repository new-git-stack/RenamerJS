#!/usr/bin/env node

import { readdir, rename, unlink, access } from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'

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

const filesArr = await readdir(process.cwd())
const extension = process.argv[2]
const newName = process.argv[3]

const files = filesArr.filter(
    (file) => path.extname(file).toLowerCase() === `.${extension}` && !file.toLowerCase().endsWith(`.temp.${extension}`)
)

files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

if (newName) {
    console.log(files)
    let i = 1
    for (const file of files) {
        await rename(file, `${newName} Ep${formatNumber(i)}.${extension}`)
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
            console.log(`Output: ${output} exists`)
            await rename(output, file)
        } catch (error) {
            try {
                await unlink(output)
            } catch {

            }
            console.error(`Failed to process: ${file}`)
            console.error(error.message)
        }

        console.log(`FFmpeg processed ${file} successfully`)
    }
} else {
    console.log("You have to specify the file extension of the videos")
}