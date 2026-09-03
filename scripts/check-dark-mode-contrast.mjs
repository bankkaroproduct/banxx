#!/usr/bin/env node
/**
 * Guards the one accessibility rule that a code review will not reliably catch.
 *
 * --banxx-indigo (#6A35FF) on the dark base surface #121212 is 3.18:1, which
 * fails WCAG AA for body text. In dark mode indigo is a FILL colour only,
 * always with white on top. Indigo as text must use --accent-text, which
 * resolves to indigo-300 (#9B7BFF, 5.95:1 on #121212).
 *
 * This fails the build if anyone reintroduces raw indigo in a text position, or
 * hardcodes a dark:text- indigo utility.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ROOT = 'src';
const EXTS = new Set(['.ts', '.tsx', '.css']);

const VIOLATIONS = [
  {
    name: 'raw indigo hex in a Tailwind text utility',
    re: /\b(?:dark:)?(?:group-)?(?:hover:|focus:|active:)?text-\[#(?:6A35FF|5A2BE0)\]/gi,
  },
  {
    name: 'raw indigo hex in a CSS color declaration',
    re: /(?<!-)\bcolor\s*:\s*['"]?#(?:6A35FF|5A2BE0)\b/gi,
  },
  {
    name: 'dark-mode text utility bound to --primary (a fill token) instead of --accent-text',
    re: /dark:text-primary\b(?!-foreground)/g,
  },
  {
    // A gradient clip-text heading paints the gradient as the TEXT, so a stop
    // built on --primary is indigo-as-text and fails AA on the dark surface.
    // bg-gradient-heading is the mode-aware token for this.
    name: 'gradient clip-text heading built on a fill token instead of bg-gradient-heading',
    re: /(?:from|via|to)-primary\b(?![-\w])(?=[^"'`]*bg-clip-text)|bg-clip-text(?=[^"'`]*(?:from|via|to)-primary\b(?![-\w]))/g,
  },
  {
    name: 'reintroduced template teal',
    re: /#(?:0B7A8A|E0F7F9|BDE6E2|0D2B28|1A3B38|F7FFFE|085F6D|064D59|7EC8C0|2D6B63|E8F4FF)\b/gi,
  },
];

const walk = (dir) =>
  readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

let failures = 0;
for (const file of walk(ROOT).filter((f) => EXTS.has(extname(f)))) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    for (const { name, re } of VIOLATIONS) {
      re.lastIndex = 0;
      const match = re.exec(line);
      if (match) {
        console.error(`${file}:${index + 1}  ${name}\n    ${match[0]}`);
        failures += 1;
      }
    }
  });
}

if (failures > 0) {
  console.error(`\n${failures} contrast/token violation(s).`);
  console.error('Use text-accent-text for indigo text: it resolves to indigo-300 in dark mode.');
  process.exit(1);
}
console.log('Dark-mode contrast and token guards: clean.');
