const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'app/dashboard/companies-hiring/page.tsx');
let code = fs.readFileSync(file, 'utf8');

// Replace fetch('/api/path', {
code = code.replace(/fetch\((['"`]\/api\/[^'"`]+['"`])\s*,\s*\{/g, "fetch($1, { credentials: 'include',");

// Replace fetch('/api/path')
code = code.replace(/fetch\((['"`]\/api\/[^'"`]+['"`])\)/g, "fetch($1, { credentials: 'include' })");

// Also replace Jooble references
code = code.replace(/Jooble\/Adzuna/g, "Legacy Providers");

// Remove Jooble from source dropdown manually if it exists, wait, the source is not hardcoded here except in filters.
code = code.replace(/<option value="Jooble">Jooble<\/option>/g, "");
code = code.replace(/<option value="JOOBLE">Jooble<\/option>/g, "");

fs.writeFileSync(file, code);
console.log('done');
