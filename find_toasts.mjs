import fs from 'fs';
import path from 'path';

const searchRegex = /toast\.(success|error|info|warning|promise|loading|dismiss|custom)\s*\(([\s\S]*?)\)/g;

function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            if (fs.statSync(dirFile).isDirectory()) {
                if (!dirFile.includes('node_modules') && !dirFile.includes('.next')) {
                    filelist = walkSync(dirFile, filelist);
                }
            } else {
                if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
                    filelist.push(dirFile);
                }
            }
        } catch (err) {
            // ignore
        }
    });
    return filelist;
}

const targetDir = 'd:\\Study\\Nam4_2025-2026\\DATN\\TheLastOfUs';
const files = [...walkSync(path.join(targetDir, 'apps')), ...walkSync(path.join(targetDir, 'packages'))];

let markdownContent = '# Danh sách thông báo (Toast) từ Sonner\n\n';
let count = 0;

const groupedByFile = {};

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = searchRegex.exec(content)) !== null) {
        const type = match[1];

        // Calculate line number
        const lineNumber = content.substring(0, match.index).split('\n').length;

        const relativePath = path.relative(targetDir, file);

        if (!groupedByFile[relativePath]) {
            groupedByFile[relativePath] = [];
        }

        let snippet = content.substring(match.index, match.index + match[0].length).trim();
        if (snippet.length > 200) {
            snippet = snippet.substring(0, 200) + '...';
        }

        groupedByFile[relativePath].push({
            type,
            lineNumber,
            snippet
        });
        count++;
    }
});

markdownContent = `Tổng số thông báo (toast) tìm thấy: **${count}**\n\n`;

for (const [file, toasts] of Object.entries(groupedByFile)) {
    markdownContent += `### \`${file.replace(/\\/g, '/')}\`\n`;
    toasts.forEach(t => {
        markdownContent += `- **Loại:** \`${t.type}\` | **Dòng:** ${t.lineNumber}\n`;
        markdownContent += `  \`\`\`typescript\n  ${t.snippet.replace(/\n*\s*$/, '').replace(/\n/g, '\n  ')}\n  \`\`\`\n`;
    });
    markdownContent += '\n';
}

fs.writeFileSync(path.join(targetDir, 'toast_report.md'), markdownContent);
console.log('Report generated with ' + count + ' toasts.');
