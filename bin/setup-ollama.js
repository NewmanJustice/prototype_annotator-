#!/usr/bin/env node

/**
 * Ollama Setup Script for prototype-annotator
 *
 * This script helps users install and configure Ollama for AI-powered
 * prompt enhancement features.
 *
 * Usage: npx prototype-annotator-setup
 */

import { execSync, spawn } from 'child_process';
import { createInterface } from 'readline';
import { platform } from 'os';

const MODEL_NAME = 'tinyllama';
const OLLAMA_URL = 'http://localhost:11434';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}]${colors.reset} ${message}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, colors.green);
}

function logWarning(message) {
  log(`  ⚠ ${message}`, colors.yellow);
}

function logError(message) {
  log(`  ✗ ${message}`, colors.red);
}

function logInfo(message) {
  log(`  → ${message}`, colors.cyan);
}

async function checkOllamaInstalled() {
  try {
    execSync('ollama --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function checkOllamaRunning() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function checkModelInstalled() {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return false;

    const data = await response.json();
    const models = data.models || [];
    return models.some(m => m.name === MODEL_NAME || m.name.startsWith(`${MODEL_NAME}:`));
  } catch {
    return false;
  }
}

function getInstallCommand() {
  const os = platform();

  switch (os) {
    case 'darwin':
      return {
        method: 'brew',
        command: 'brew install ollama',
        manual: 'Or download from: https://ollama.com/download/mac',
      };
    case 'linux':
      return {
        method: 'curl',
        command: 'curl -fsSL https://ollama.com/install.sh | sh',
        manual: 'Or visit: https://ollama.com/download/linux',
      };
    case 'win32':
      return {
        method: 'download',
        command: null,
        manual: 'Download from: https://ollama.com/download/windows',
      };
    default:
      return {
        method: 'manual',
        command: null,
        manual: 'Visit: https://ollama.com/download',
      };
  }
}

async function promptUser(question) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function runCommand(command, description) {
  logInfo(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    logError(`Failed to ${description}`);
    return false;
  }
}

async function pullModel() {
  logInfo(`Pulling ${MODEL_NAME} model (this may take a few minutes)...`);

  return new Promise((resolve) => {
    const proc = spawn('ollama', ['pull', MODEL_NAME], {
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}

async function startOllama() {
  logInfo('Starting Ollama service...');

  // Start ollama serve in background
  const proc = spawn('ollama', ['serve'], {
    detached: true,
    stdio: 'ignore',
  });

  proc.unref();

  // Wait for it to start
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 1000));
    if (await checkOllamaRunning()) {
      return true;
    }
  }

  return false;
}

async function main() {
  console.log(`
${colors.bright}╔══════════════════════════════════════════════════════════╗
║       Prototype Annotator - Ollama Setup Script          ║
╚══════════════════════════════════════════════════════════╝${colors.reset}

This script will help you set up Ollama for AI-powered prompt
enhancement in prototype-annotator.
`);

  // Step 1: Check if Ollama is installed
  logStep('1/4', 'Checking Ollama installation...');

  const isInstalled = await checkOllamaInstalled();

  if (isInstalled) {
    logSuccess('Ollama is installed');
  } else {
    logWarning('Ollama is not installed');

    const installInfo = getInstallCommand();

    if (installInfo.command) {
      log(`\n  To install Ollama, run:`);
      log(`  ${colors.cyan}${installInfo.command}${colors.reset}\n`);

      const answer = await promptUser('  Would you like to install now? (y/n): ');

      if (answer === 'y' || answer === 'yes') {
        const success = await runCommand(installInfo.command, 'install Ollama');
        if (!success) {
          log(`\n  ${installInfo.manual}`);
          process.exit(1);
        }
      } else {
        log(`\n  ${installInfo.manual}`);
        log('  Run this script again after installing Ollama.');
        process.exit(0);
      }
    } else {
      log(`\n  ${installInfo.manual}`);
      log('  Run this script again after installing Ollama.');
      process.exit(0);
    }
  }

  // Step 2: Check if Ollama is running
  logStep('2/4', 'Checking if Ollama service is running...');

  let isRunning = await checkOllamaRunning();

  if (isRunning) {
    logSuccess('Ollama service is running');
  } else {
    logWarning('Ollama service is not running');

    const answer = await promptUser('  Would you like to start it now? (y/n): ');

    if (answer === 'y' || answer === 'yes') {
      isRunning = await startOllama();

      if (isRunning) {
        logSuccess('Ollama service started');
      } else {
        logError('Failed to start Ollama service');
        log(`\n  Try running manually: ${colors.cyan}ollama serve${colors.reset}`);
        process.exit(1);
      }
    } else {
      log(`\n  Start Ollama with: ${colors.cyan}ollama serve${colors.reset}`);
      log('  Run this script again after starting the service.');
      process.exit(0);
    }
  }

  // Step 3: Check if model is installed
  logStep('3/4', `Checking if ${MODEL_NAME} model is available...`);

  let hasModel = await checkModelInstalled();

  if (hasModel) {
    logSuccess(`${MODEL_NAME} model is ready`);
  } else {
    logWarning(`${MODEL_NAME} model is not downloaded`);

    const answer = await promptUser('  Would you like to download it now? (y/n): ');

    if (answer === 'y' || answer === 'yes') {
      hasModel = await pullModel();

      if (hasModel) {
        logSuccess(`${MODEL_NAME} model downloaded`);
      } else {
        logError('Failed to download model');
        log(`\n  Try running manually: ${colors.cyan}ollama pull ${MODEL_NAME}${colors.reset}`);
        process.exit(1);
      }
    } else {
      log(`\n  Download later with: ${colors.cyan}ollama pull ${MODEL_NAME}${colors.reset}`);
    }
  }

  // Step 4: Verify everything
  logStep('4/4', 'Verifying setup...');

  const finalRunning = await checkOllamaRunning();
  const finalModel = await checkModelInstalled();

  console.log(`
${colors.bright}══════════════════════════════════════════════════════════${colors.reset}
${colors.bright}Setup Summary:${colors.reset}

  Ollama Installed:  ${isInstalled ? colors.green + '✓ Yes' : colors.red + '✗ No'}${colors.reset}
  Ollama Running:    ${finalRunning ? colors.green + '✓ Yes' : colors.red + '✗ No'}${colors.reset}
  Model Ready:       ${finalModel ? colors.green + '✓ Yes' : colors.yellow + '⚠ No (will auto-download)'}${colors.reset}

${colors.bright}══════════════════════════════════════════════════════════${colors.reset}
`);

  if (finalRunning && finalModel) {
    log('🎉 Setup complete! AI enhancement is ready to use.\n', colors.green);
  } else if (finalRunning) {
    log('⚠ Ollama is running. The model will be downloaded on first use.\n', colors.yellow);
  } else {
    log('⚠ Please start Ollama with: ollama serve\n', colors.yellow);
  }

  log(`${colors.dim}For more information, visit: https://ollama.com${colors.reset}\n`);
}

main().catch(console.error);
