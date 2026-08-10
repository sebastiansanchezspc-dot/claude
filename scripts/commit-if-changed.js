#!/usr/bin/env node
// Hace commit + push de posts/ si hay cambios, sin depender de sintaxis de bash
// (el runner self-hosted de Windows no tiene bash disponible).
// Uso: node scripts/commit-if-changed.js <prefijo-del-mensaje>
'use strict';

const { execSync } = require('child_process');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

const prefix = process.argv[2] || 'update';
const dateStr = new Date().toISOString().slice(0, 10);

run('git config user.name "ofertas-bot"');
run('git config user.email "actions@users.noreply.github.com"');
run('git add posts/');

const status = execSync('git status --porcelain -- posts/').toString().trim();
if (status) {
  run(`git commit -m "${prefix}: ${dateStr}"`);
  run('git push');
} else {
  console.log('Sin cambios en posts/, no se commitea.');
}
