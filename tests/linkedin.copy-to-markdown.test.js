const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const exportedFunctions = [
  'parseDocumentTitle', 'findRoot', 'findHeaderBlock', 'collectSections', 'expandTruncated', 'extractJobId',
  'buildMarkdown',
].join(', ');

const loadUserscript = (overrides = {}) => {
  const filePath = path.join(__dirname, '..', 'greasemonkey', 'linkedin.copy-to-markdown.user.js');
  const source = fs.readFileSync(filePath, 'utf8');
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console: {
      log() {}, warn() {}, error() {}, group() {}, groupEnd() {},
    },
    setTimeout,
    clearTimeout,
    requestAnimationFrame: (cb) => cb(),
    Promise,
    window: { location: { href: 'https://www.linkedin.com/jobs/view/1000000001/' } },
    document: { title: '', querySelector: () => null, body: { appendChild() {} } },
    VM: { shortcut: { register() {} } },
    GM: { registerMenuCommand() {}, setClipboard() {} },
    ...overrides,
  };

  vm.runInNewContext(`${source}\nmodule.exports = { ${exportedFunctions} };`, sandbox, {
    filename: 'linkedin.copy-to-markdown.user.js',
  });

  return sandbox.module.exports;
};

const fixturePath = path.join(__dirname, 'fixtures', 'linkedin-job-view.html');
const loadFixtureDocument = () => new JSDOM(fs.readFileSync(fixturePath, 'utf8')).window.document;

const {
  parseDocumentTitle, findRoot, findHeaderBlock, collectSections, expandTruncated, extractJobId, buildMarkdown,
} = loadUserscript();

// Values returned from vm.runInNewContext live in a different realm than this
// file, so plain objects have a different prototype than a host-realm literal.
// assert.deepEqual (deepStrictEqual) treats that as unequal even when every
// property matches, so results are spread into a host-realm object first.
const plain = (obj) => ({ ...obj });

test('parseDocumentTitle — standard LinkedIn job title', () => {
  assert.deepEqual(plain(parseDocumentTitle('Staff Platform Engineer | Acme Corp | LinkedIn')), {
    jobTitle: 'Staff Platform Engineer',
    company: 'Acme Corp',
  });
});

test('parseDocumentTitle — no company segment', () => {
  assert.deepEqual(plain(parseDocumentTitle('Some Job | LinkedIn')), { jobTitle: 'Some Job', company: '' });
});

test('parseDocumentTitle — pipe inside the job title', () => {
  assert.deepEqual(plain(parseDocumentTitle('Engineer | Backend | Acme | LinkedIn')), {
    jobTitle: 'Engineer | Backend',
    company: 'Acme',
  });
});

test('parseDocumentTitle — empty title', () => {
  assert.deepEqual(plain(parseDocumentTitle('')), { jobTitle: '', company: '' });
});

test('parseDocumentTitle — undefined title', () => {
  assert.deepEqual(plain(parseDocumentTitle(undefined)), { jobTitle: '', company: '' });
});

test('findRoot — prefers the primary content section', () => {
  const doc = loadFixtureDocument();
  const root = findRoot(doc);
  assert.equal(root.tagName, 'SECTION');
  assert.equal(root.getAttribute('aria-label'), 'Primary content');
});

test('findRoot — falls back to main when the primary section is absent', () => {
  const doc = new JSDOM('<main><p>content</p></main>').window.document;
  assert.equal(findRoot(doc).tagName, 'MAIN');
});

test('findRoot — returns null when neither is present', () => {
  const doc = new JSDOM('<div><p>content</p></div>').window.document;
  assert.equal(findRoot(doc), null);
});

test('findHeaderBlock — extracts the job header from the fixture', () => {
  const root = findRoot(loadFixtureDocument());
  const text = findHeaderBlock(root).textContent.replace(/\s+/g, ' ');
  assert.match(text, /Staff Platform Engineer/);
  assert.match(text, /Acme Corp/);
  assert.match(text, /United States/);
  assert.match(text, /Reposted 2 days ago/);
  assert.match(text, /Over 100 people clicked apply/);
  assert.match(text, /Remote/);
  assert.match(text, /Full-time/);
});

test('findHeaderBlock — excludes the job description', () => {
  const root = findRoot(loadFixtureDocument());
  assert.doesNotMatch(findHeaderBlock(root).textContent, /About the job/);
});

test('findHeaderBlock — returns null when the description slot is missing', () => {
  const root = new JSDOM('<main><div>nothing here</div></main>').window.document.querySelector('main');
  assert.equal(findHeaderBlock(root), null);
});

test('collectSections — returns non-empty content slots in document order', () => {
  const root = findRoot(loadFixtureDocument());
  const keys = [...collectSections(root).map((el) => el.getAttribute('componentkey'))];
  assert.deepEqual(keys, [
    'JobDetails_AboutTheJob_1000000001',
    'JobDetails_AboutTheCompany_1000000001',
    'JobDetailsSimilarJobsSlot_1000000001',
  ]);
});

test('collectSections — drops slots that render empty', () => {
  const root = findRoot(loadFixtureDocument());
  const keys = collectSections(root).map((el) => el.getAttribute('componentkey'));
  // The hiring-team slot exists in the DOM but has no text on this posting.
  assert.ok(root.querySelector('[componentkey^="JobDetailsPeopleWhoCanHelpSlot_"]'));
  assert.ok(!keys.some((k) => k.startsWith('JobDetailsPeopleWhoCanHelpSlot_')));
});

test('collectSections — excludes premium and furniture slots', () => {
  const root = findRoot(loadFixtureDocument());
  const keys = collectSections(root).map((el) => el.getAttribute('componentkey'));
  const excluded = [
    'InitialStateHowYouFitSlot',
    'JobDetails_PremiumApplicantInsights_',
    'JobDetails_PremiumCompanyInsights_',
    'JobDetails_ResumeReview_',
    'JobDetails_ManageJobBanner_',
    'JobDetails_JobAlertToggle_',
  ];
  excluded.forEach((prefix) => {
    assert.ok(!keys.some((k) => k.startsWith(prefix)), `${prefix} should not be collected`);
  });
});

test('collectSections — returns an empty array when no slots are present', () => {
  const root = new JSDOM('<main><div>nothing</div></main>').window.document.querySelector('main');
  assert.deepEqual([...collectSections(root)], []);
});

test('expandTruncated — clicks every truncation toggle in the fixture', () => {
  const root = findRoot(loadFixtureDocument());
  const clicked = [];
  root.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => clicked.push(b.textContent.trim()));
  });
  assert.equal(expandTruncated(root), 2);
  assert.equal(clicked.length, 2);
  clicked.forEach((label) => assert.match(label, /more/i));
});

test('expandTruncated — ignores buttons that merely contain the word more', () => {
  const doc = new JSDOM(`
    <main>
      <button>More jobs</button>
      <button>Show more results</button>
      <button>… more</button>
      <button>See more</button>
    </main>
  `).window.document;
  const root = doc.querySelector('main');
  const clicked = [];
  root.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => clicked.push(b.textContent.trim()));
  });
  assert.equal(expandTruncated(root), 2);
  assert.deepEqual(clicked, ['… more', 'See more']);
});

test('expandTruncated — returns 0 when there is nothing to expand', () => {
  const root = new JSDOM('<main><p>text</p></main>').window.document.querySelector('main');
  assert.equal(expandTruncated(root), 0);
});

test('extractJobId — reads the id from the componentkey suffix', () => {
  const root = findRoot(loadFixtureDocument());
  assert.equal(extractJobId(root, 'https://www.linkedin.com/jobs/view/1000000001/'), '1000000001');
});

test('extractJobId — falls back to the URL when the slot is missing', () => {
  const root = new JSDOM('<main></main>').window.document.querySelector('main');
  assert.equal(extractJobId(root, 'https://www.linkedin.com/jobs/view/1234567890/'), '1234567890');
});

test('extractJobId — handles a URL with query parameters', () => {
  const root = new JSDOM('<main></main>').window.document.querySelector('main');
  assert.equal(extractJobId(root, 'https://www.linkedin.com/jobs/view/999/?refId=abc'), '999');
});

test('extractJobId — returns an empty string when the id is unknowable', () => {
  const root = new JSDOM('<main></main>').window.document.querySelector('main');
  assert.equal(extractJobId(root, 'https://www.linkedin.com/feed/'), '');
  assert.equal(extractJobId(null, ''), '');
});

// Turndown loads from a CDN at runtime and is third-party; the fake keeps these
// tests about which content is selected, not about markdown fidelity. buildMarkdown
// passes elements (not innerHTML strings), matching the real Turndown API.
const fakeTurndown = {
  turndown: (node) => node.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
};

const buildFixtureMarkdown = () => {
  const doc = loadFixtureDocument();
  const root = findRoot(doc);
  return buildMarkdown(doc, root, fakeTurndown, 'https://www.linkedin.com/jobs/view/1000000001/');
};

test('buildMarkdown — opens with a heading built from the document title', () => {
  assert.ok(buildFixtureMarkdown().startsWith('# Staff Platform Engineer — Acme Corp\n'));
});

test('buildMarkdown — includes the header details', () => {
  const md = buildFixtureMarkdown();
  assert.match(md, /United States/);
  assert.match(md, /Reposted 2 days ago/);
  assert.match(md, /Over 100 people clicked apply/);
  assert.match(md, /Full-time/);
});

test('buildMarkdown — includes every allow-listed section', () => {
  const md = buildFixtureMarkdown();
  assert.match(md, /About the job/);
  assert.match(md, /Nomad scheduler API/);
  assert.match(md, /About the company/);
  assert.match(md, /Software Development . 501-1000 employees/);
  assert.match(md, /More jobs/);
  assert.match(md, /\$210K\/yr - \$290K\/yr/);
});

test('buildMarkdown — excludes premium upsell content', () => {
  const md = buildFixtureMarkdown();
  assert.doesNotMatch(md, /Reactivate Premium/);
  assert.doesNotMatch(md, /Use AI to assess how you fit/);
  assert.doesNotMatch(md, /Job search faster with Premium/);
  assert.doesNotMatch(md, /Set alert for similar jobs/);
});

test('buildMarkdown — ends with a source footer carrying the job id', () => {
  const md = buildFixtureMarkdown();
  assert.ok(md.endsWith('_Source: https://www.linkedin.com/jobs/view/1000000001/ — job ID 1000000001_'));
});

test('buildMarkdown — omits the job id from the footer when unknown', () => {
  const doc = new JSDOM('<html><head><title>Role | Acme | LinkedIn</title></head><body><main></main></body></html>')
    .window.document;
  const md = buildMarkdown(doc, doc.querySelector('main'), fakeTurndown, 'https://www.linkedin.com/feed/');
  assert.ok(md.endsWith('_Source: https://www.linkedin.com/feed/_'));
  assert.ok(md.startsWith('# Role — Acme'));
});

test('buildMarkdown — a section that throws does not lose the other sections', () => {
  const doc = loadFixtureDocument();
  const root = findRoot(doc);
  let call = 0;
  const flakyTurndown = {
    turndown: (node) => {
      call += 1;
      // Fail on the job description, the second conversion after the header.
      if (call === 2) throw new Error('turndown exploded');
      return fakeTurndown.turndown(node);
    },
  };
  const md = buildMarkdown(doc, root, flakyTurndown, 'https://www.linkedin.com/jobs/view/1000000001/');
  assert.doesNotMatch(md, /Nomad scheduler API/);
  assert.match(md, /About the company/);
  assert.match(md, /More jobs/);
  assert.ok(md.endsWith('_Source: https://www.linkedin.com/jobs/view/1000000001/ — job ID 1000000001_'));
});

test('buildMarkdown — a header that throws does not lose the sections', () => {
  const doc = loadFixtureDocument();
  const root = findRoot(doc);
  let call = 0;
  const flakyTurndown = {
    turndown: (node) => {
      call += 1;
      // Fail on the header, the first conversion.
      if (call === 1) throw new Error('turndown exploded');
      return fakeTurndown.turndown(node);
    },
  };
  const md = buildMarkdown(doc, root, flakyTurndown, 'https://www.linkedin.com/jobs/view/1000000001/');
  assert.doesNotMatch(md, /Reposted 2 days ago/);
  assert.match(md, /Nomad scheduler API/);
  assert.match(md, /About the company/);
  assert.match(md, /More jobs/);
  assert.ok(md.endsWith('_Source: https://www.linkedin.com/jobs/view/1000000001/ — job ID 1000000001_'));
});
