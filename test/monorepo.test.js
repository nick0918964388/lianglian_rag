const fs = require('fs');
const path = require('path');

// ANSI color codes for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

// Test monorepo structure
function testMonorepoStructure() {
  console.log('Testing monorepo structure...\n');
  
  const requiredDirs = [
    'apps/frontend',
    'apps/backend',
    'packages/eslint-config-custom',
    'packages/tsconfig'
  ];
  
  const requiredFiles = [
    'package.json',
    'README.md',
    '.gitignore',
    '.editorconfig',
    'apps/frontend/package.json',
    'apps/backend/package.json',
    'packages/eslint-config-custom/package.json',
    'packages/eslint-config-custom/index.js',
    'packages/tsconfig/package.json',
    'packages/tsconfig/base.json'
  ];
  
  let allTestsPassed = true;
  
  // Test directories
  console.log('Checking directories:');
  requiredDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    const exists = fs.existsSync(fullPath);
    const symbol = exists ? '✓' : '✗';
    const color = exists ? colors.green : colors.red;
    console.log(`  ${color}${symbol}${colors.reset} ${dir}`);
    if (!exists) allTestsPassed = false;
  });
  
  console.log('\nChecking files:');
  // Test files
  requiredFiles.forEach(file => {
    const fullPath = path.join(__dirname, '..', file);
    const exists = fs.existsSync(fullPath);
    const symbol = exists ? '✓' : '✗';
    const color = exists ? colors.green : colors.red;
    console.log(`  ${color}${symbol}${colors.reset} ${file}`);
    if (!exists) allTestsPassed = false;
  });
  
  // Test workspace configuration
  console.log('\nChecking workspace configuration:');
  const packageJson = require('../package.json');
  const hasWorkspaces = packageJson.workspaces && 
                       packageJson.workspaces.includes('apps/*') &&
                       packageJson.workspaces.includes('packages/*');
  const wsSymbol = hasWorkspaces ? '✓' : '✗';
  const wsColor = hasWorkspaces ? colors.green : colors.red;
  console.log(`  ${wsColor}${wsSymbol}${colors.reset} Workspaces configured correctly`);
  if (!hasWorkspaces) allTestsPassed = false;
  
  // Test shared config references
  console.log('\nChecking shared configuration references:');
  const frontendPkg = require('../apps/frontend/package.json');
  const backendPkg = require('../apps/backend/package.json');
  
  const frontendHasConfigs = frontendPkg.devDependencies &&
                            frontendPkg.devDependencies['@lianglian-rag/eslint-config-custom'] &&
                            frontendPkg.devDependencies['@lianglian-rag/tsconfig'];
  const backendHasConfigs = backendPkg.devDependencies &&
                           backendPkg.devDependencies['@lianglian-rag/eslint-config-custom'] &&
                           backendPkg.devDependencies['@lianglian-rag/tsconfig'];
  
  const feSymbol = frontendHasConfigs ? '✓' : '✗';
  const feColor = frontendHasConfigs ? colors.green : colors.red;
  console.log(`  ${feColor}${feSymbol}${colors.reset} Frontend has shared config dependencies`);
  
  const beSymbol = backendHasConfigs ? '✓' : '✗';
  const beColor = backendHasConfigs ? colors.green : colors.red;
  console.log(`  ${beColor}${beSymbol}${colors.reset} Backend has shared config dependencies`);
  
  if (!frontendHasConfigs || !backendHasConfigs) allTestsPassed = false;
  
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log(`${colors.green}✓ All tests passed!${colors.reset}`);
  } else {
    console.log(`${colors.red}✗ Some tests failed!${colors.reset}`);
  }
  console.log('='.repeat(50));
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run tests
try {
  testMonorepoStructure();
} catch (error) {
  console.error(`${colors.red}Test execution failed:${colors.reset}`, error.message);
  process.exit(1);
}