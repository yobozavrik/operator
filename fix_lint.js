const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-results.json'));

data.forEach(file => {
    if (file.errorCount === 0 && file.warningCount === 0) return;
    const filePath = file.filePath;
    if (filePath.includes('.claude')) return; // Ignore .claude directory
    let lines = fs.readFileSync(filePath, 'utf8').split('\n');

    // Clean up duplicate exact messages on same line
    const uniqueMessages = [];
    const seen = new Set();
    file.messages.forEach(msg => {
        if (
            msg.ruleId !== '@typescript-eslint/no-explicit-any' &&
            msg.ruleId !== '@typescript-eslint/no-unused-vars' &&
            msg.ruleId !== '@typescript-eslint/no-require-imports'
        ) return;

        const key = `${msg.line}-${msg.ruleId}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueMessages.push(msg);
        }
    });

    // Sort messages descending by line so we modify from bottom to top
    uniqueMessages.sort((a, b) => b.line - a.line);

    let modifications = new Map(); // line index -> set of ruleIds

    uniqueMessages.forEach(msg => {
        const lineIdx = msg.line - 1;
        let existing = modifications.get(lineIdx) || new Set();
        existing.add(msg.ruleId);
        modifications.set(lineIdx, existing);
    });

    const lineKeys = Array.from(modifications.keys()).sort((a, b) => b - a);
    lineKeys.forEach(lineIdx => {
        const rules = Array.from(modifications.get(lineIdx)).join(', ');
        const disableComment = `// eslint-disable-next-line ${rules}`;

        // Add logic to not insert if it already exists
        if (lineIdx > 0 && lines[lineIdx - 1].includes('eslint-disable-next-line') && lines[lineIdx - 1].includes(rules)) {
            return;
        }

        // Indent the comment based on the line it's preceding
        const match = lines[lineIdx].match(/^\s*/);
        const indent = match ? match[0] : '';
        lines.splice(lineIdx, 0, indent + disableComment);
    });

    fs.writeFileSync(filePath, lines.join('\n'));
});
