# PR Risk Analysis Playbook

## Overview
A reusable framework for automated PR risk and impact analysis. Follow this playbook to consistently evaluate pull requests for breaking changes, security hazards, and test coverage gaps.

## 📋 Input Requirements

### Mandatory Input Handling
- **PRIMARY INPUT**: Raw git diff or PR content
- **IF INPUT IS EMPTY/MALFORMED/NON-TEXT**:
  - Do not raise raw errors or crash
  - Return default response: "Status: Skipped. Reason: No valid git diff provided or empty PR input."

## 🔧 Processing Instructions

### 1. Analyze API & Breaking Changes
- Identify modifications to API signatures, routes, function parameters, or schema files
- Highlight any potential breaking backward-compatibility issues

### 2. Unit Test Coverage Gap Analysis
- Identify new or updated logic/functions that lack corresponding tests in the diff

### 3. Security Hazard Detection
- Scan for exposed secrets/keys, injection risks, hardcoded credentials, or insecure function calls

### 4. Risk Level Calculation
Assign ONE level based on the criteria below:

| Level | Description |
|-------|-------------|
| **LOW** | Non-breaking refactors, documentation, simple UI/test updates |
| **MEDIUM** | Non-breaking feature additions, minor API changes with test coverage |
| **HIGH** | Breaking API changes, deleted test suites, unhandled edge cases, or potential security vulnerabilities |

## 📤 Required Output Format

Always generate the response strictly using this markdown layout:

```
---
# 🔍 Automated PR Risk & Impact Analysis

### 📊 Executive Summary
* **Overall Risk Level:** [ LOW | MEDIUM | HIGH ]
* **Files Changed:** [Count or Brief Summary]
* **Primary Impact:** [1-2 sentence core evaluation]

### ⚠️ Risk & Breaking Change Breakdown
* **API / Contract Breaking Changes:** [None detected | List specific risks]
* **Security & Vulnerability Hazards:** [None detected | List concerns]

### 🧪 Test Coverage & Gaps
* **Coverage Evaluation:** [Adequate | Deficient | Unclear]
* **Missing Tests / Edge Cases:**
  * [Suggested Test Case 1]
  * [Suggested Test Case 2]

### 💡 Actionable Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
---
```

## 🛠️ Quick Reference Checklist

### Security Red Flags (HIGH risk if present)
- [ ] String interpolation in SQL queries instead of parameterized queries
- [ ] Hardcoded credentials, tokens, or API keys in source code
- [ ] Exposed secrets in commit history or PR description
- [ ] Insecure function calls (eval, exec, etc.)

### Breaking Change Indicators (HIGH risk if present)
- [ ] Removed function/parameter from API
- [ ] Changed function signature or return type
- [ ] Modified schema files without migration plan
- [ ] Changed endpoint URLs or HTTP methods

### Test Coverage Checks
- [ ] New functions have corresponding test cases
- [ ] Edge cases covered for new logic
- [ ] No test suites deleted or deprecated without replacement

## 📝 Example Workflow

1. **Provide diff** - Paste the git diff or PR content
2. **Analyze** - Apply the processing instructions above
3. **Output** - Generate markdown using the required format
4. **Review** - Verify all sections are populated correctly

## 🔄 Reusability Tips

- Save this playbook for future PR analyses
- Customize risk thresholds based on your team's standards
- Add organization-specific security checks to the checklist
- Modify the output format while maintaining the required sections