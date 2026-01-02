const fs = require('fs');

const content = fs.readFileSync('index.html', 'utf8');
const lines = content.split('\n');

const extract = (startLine, endLine) => {
    return lines.slice(startLine - 1, endLine).join('\n');
};

const pages = [
    { name: 'about', start: 204, end: 309 },
    { name: 'cv', start: 313, end: 1133 },
    { name: 'references', start: 1137, end: 1801 },
    { name: 'showcase', start: 1806, end: 2495 },
    { name: 'blog', start: 2500, end: 4459 }
];

if (!fs.existsSync('pages')) {
    fs.mkdirSync('pages');
}

pages.forEach(page => {
    const extractedContent = extract(page.start, page.end);
    fs.writeFileSync(`pages/${page.name}.html`, extractedContent);
    console.log(`Extracted ${page.name}.html`);
});

