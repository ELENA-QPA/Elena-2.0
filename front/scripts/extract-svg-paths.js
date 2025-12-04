const fs = require('fs');
const path = require('path');

const svgPath = path.resolve(__dirname, '..', 'public', 'Mapa.svg');
const outPath = path.resolve(__dirname, '..', 'src', 'views', 'EstadisticasView', 'map-paths.json');

function parseAttributes(tag) {
    const attrs = {};
    const attrRegex = /([:\w-]+)\s*=\s*"([^"]*)"|'([^']*)'/g;
    // Improved: support double and single quotes
    const regex = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = regex.exec(tag)) !== null) {
        const key = m[1];
        const val = m[2] !== undefined ? m[2] : m[3];
        attrs[key] = val;
    }
    return attrs;
}

(function() {
    try {
        const svg = fs.readFileSync(svgPath, 'utf8');
        const pathRegex = /<path\b[^>]*>/gi;
        const matches = svg.match(pathRegex) || [];
        const paths = matches.map((tag, i) => {
            const attrs = parseAttributes(tag);
            return {
                index: i,
                id: attrs.id || null,
                fill: attrs.fill || null,
                opacity: attrs.opacity || null,
                d: attrs.d || null,
                raw: tag,
            };
        });

        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(paths, null, 2), 'utf8');
        console.log('Wrote', outPath, 'with', paths.length, 'paths');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();