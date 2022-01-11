import { readdir, stat, open } from 'fs/promises';
import { join, parse } from 'path';

const FileExts = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.vue'];
const ExtMap = new Map();
FileExts.forEach(ext => ExtMap.set(ext, true));

(async function main() {

    try {
        const path = '';
        const sta = await stat(path);

        const res = {
            files: [],
            types: FileExts.reduce((prev, curr) => ({ ...prev, [curr]: [] }), {}),
            lines: {
                totalLine: 0,
                codeLine: 0,
                commentLine: 0,
                blankLine: 0
            }
        };

        if (sta.isFile()) {
            await countFile(path, res);
        }
        else if (sta.isDirectory()) {
            await countDir(path, res);
        }

        console.log(res.lines);
    }
    catch (err) {
        console.error(err);
    }
})();

async function countFile(path, res) {
    const info = parse(path);
    if (!ExtMap.has(info.ext)) {
        return;
    }

    try {
        const file = await open(path);

        const lines = (await file.readFile({ encoding: 'utf-8' })).split('\n');

        let blankLine = 0, commentLine = 0, codeLine = 0;

        lines.forEach(line => {
            line = line.trim();
            if (line === '') {
                blankLine++;
            }
            else if (line.startsWith('//')) {
                commentLine++;
            }
        })

        const stat = {
            path,
            ext: info.ext,
            totalLine: lines.length,
            codeLine: lines.length - commentLine - blankLine,
            commentLine,
            blankLine
        }

        res.files.push(stat);
        res.types[info.ext].push(stat);
        res.lines.totalLine += stat.totalLine;
        res.lines.codeLine += stat.codeLine;
        res.lines.commentLine += stat.commentLine;
        res.lines.blankLine += stat.blankLine;

        file.close();
    }
    catch (err) {
        console.error(err);
    }
}

async function countDir(path, res) {
    try {
        const files = await readdir(path, { withFileTypes: true });
        for (const file of files) {
            if (file.isFile()) {
                await countFile(join(path, file.name), res);
            }
            else if (file.isDirectory()) {
                await countDir(join(path, file.name), res);
            }
        }
    }
    catch (err) {
        console.error(err);
    }
}