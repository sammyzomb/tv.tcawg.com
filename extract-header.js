const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'official-video-source.html');
const out = path.join(__dirname, 'header.html');

const html = fs.readFileSync(src, 'utf8');
const start = html.indexOf('<header id="header">');
const end = html.indexOf('</header>', start) + 9;
const header = html.slice(start, end);

const wrapper = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<base href="https://www.tcawg.com/travel/">
<link href="themes/zh-tw/assets/css/site.core.min.css?t=1750068401" rel="stylesheet">
<link href="themes/zh-tw/assets/css/plugin-slick.min.css?t=1486697134" rel="stylesheet">
</head>
<body>
${header}
<script src="https://www.tcawg.com/travel/themes/zh-tw/assets/js/site.core.min.js?t=1721355506"></script>
</body>
</html>
`;

fs.writeFileSync(out, wrapper, 'utf8');
console.log('header.html written, length:', wrapper.length);
