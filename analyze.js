import fs from 'fs';
import path from 'path';

function analyzeDiff(diffContent) {
  const result = {
    riskLevel: 'LOW',
    filesChanged: 0,
    breakingChanges: [],
    securityHazards: [],
    testGaps: [],
    recommendations: []
  };

  if (!diffContent || diffContent.trim().length === 0) {
    result.riskLevel = 'LOW';
    result.filesChanged = 0;
    result.breakingChanges.push('No valid git diff provided');
    return result;
  }

  const lines = diffContent.split('\n');
  
  let apiBreaking = false;
  let hasSqlInjection = false;
  let hasHardcodedCreds = false;
  let newFunctions = 0;
  let newTests = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('+async function') || line.startsWith('+function')) {
      newFunctions++;
    }
    if (line.startsWith('+it(') || line.startsWith('+describe(')) {
      newTests++;
    }
    
    if (line.includes('${req.query') || line.includes('${req.body') || line.includes(\`\${}\`) {
      hasSqlInjection = true;
    }
    
    if (line.includes('sk_test_') || line.includes('AUTH_TOKEN') || line.includes('API_KEY') || line.includes('password') || line.includes('secret')) {
      const lower = line.toLowerCase();
      if (lower.includes('token') || lower.includes('key') || lower.includes('credential')) {
        hasHardcodedCreds = true;
      }
    }

    if (line.includes('DELETE FROM') || line.includes('DROP') || line.includes('ALTER TABLE')) {
      if (!apiBreaking) apiBreaking = true;
    }
    
    if (line.includes('module.exports') || line.includes('export ')) {
      result.filesChanged++;
    }
  }

  result.filesChanged = lines.filter(l => l.startsWith('diff --git')).length;

  if (hasSqlInjection) {
    result.riskLevel = 'HIGH';
    result.securityHazards.push('SQL injection risk detected - string interpolation used instead of parameterized queries');
  }

  if (hasHardcodedCreds) {
    result.riskLevel = 'HIGH';
    result.securityHazards.push('Hardcoded credentials or secrets detected');
  }

  if (apiBreaking) {
    result.riskLevel = 'HIGH';
    result.breakingChanges.push('Breaking API change detected');
  }

  if (newFunctions > 0 && newTests === 0) {
    result.riskLevel = 'MEDIUM';
    result.testGaps.push(`${newFunctions} new function${newFunctions > 1 ? 's' : ''} without test coverage`);
  }

  if (newFunctions > 0 && newTests > 0) {
    result.testGaps.push('New functionality has test coverage');
  }

  if (result.securityHazards.length === 0 && !apiBreaking && newTests > 0) {
    result.riskLevel = 'LOW';
  }

  if (result.breakingChanges.length > 0 && result.securityHazards.length === 0) {
    result.riskLevel = 'MEDIUM';
  }

  if (result.riskLevel === 'LOW' && result.securityHazards.length === 0 && result.breakingChanges.length === 0) {
    result.recommendations.push('No immediate action required');
  }

  if (result.securityHazards.length > 0) {
    result.recommendations.push('Fix SQL injection by using parameterized queries');
    result.recommendations.push('Remove hardcoded credentials - use environment variables or secret management');
  }

  if (result.testGaps.length > 0) {
    result.recommendations.push('Add test coverage for new functions/edge cases');
  }

  return result;
}

function generateMarkdown(analysis) {
  const breakingChanges = analysis.breakingChanges.length > 0 
    ? analysis.breakingChanges.join(', ')
    : 'None detected';

  const securityHazards = analysis.securityHazards.length > 0
    ? analysis.securityHazards.join('; ')
    : 'None detected';

  const coverage = analysis.testGaps.length > 0
    ? analysis.testGaps.join('; ')
    : 'Adequate';

  return `---
# 🔍 Automated PR Risk & Impact Analysis

### 📊 Executive Summary
* **Overall Risk Level:** [ ${analysis.riskLevel} ]
* **Files Changed:** [${analysis.filesChanged} files]
* **Primary Impact:** ${analysis.filesChanged > 0 ? 'Code changes detected requiring review' : 'No valid git diff provided or empty PR input'}

### ⚠️ Risk & Breaking Change Breakdown
* **API / Contract Breaking Changes:** [${breakingChanges}]
* **Security & Vulnerability Hazards:** [${securityHazards}]

### 🧪 Test Coverage & Gaps
* **Coverage Evaluation:** [${coverage}]
* **Missing Tests / Edge Cases:**${analysis.testGaps.map(g => `\n  * ${g}`).join('')}

### 💡 Actionable Recommendations${analysis.recommendations.length > 0 ? '\n' : ''}${analysis.recommendations.length > 0 ? analysis.recommendations.map((r, i) => `\n${i + 1}. ${r}`).join('') : ''}
---`;
}

function main() {
  const args = process.argv.slice(2);
  const diffFile = args[0];

  let diffContent = '';
  if (diffFile && fs.existsSync(diffFile)) {
    diffContent = fs.readFileSync(diffFile, 'utf-8');
  } else if (!diffFile) {
    diffContent = fs.readFileSync('/dev/stdin', 'utf-8');
  }

  const analysis = analyzeDiff(diffContent);
  const markdown = generateMarkdown(analysis);
  
  const outputPath = path.join process.cwd(), 'output.md');
  fs.writeFileSync(outputPath, markdown);
  console.log(`Analysis complete. Output written to ${outputPath}`);
  console.log(`Risk Level: ${analysis.riskLevel}`);
}

main();