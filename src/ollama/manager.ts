export interface OllamaStatus {
  installed: boolean;
  running: boolean;
  modelAvailable: boolean;
  modelName: string;
  error?: string;
}

export class OllamaManager {
  private baseUrl: string;
  private modelName: string;
  private cachedStatus: OllamaStatus | null = null;
  private statusCheckedAt: number = 0;
  private readonly STATUS_CACHE_MS = 30000; // Cache status for 30 seconds

  constructor(baseUrl: string, modelName: string) {
    this.baseUrl = baseUrl;
    this.modelName = modelName;
  }

  async getStatus(forceRefresh = false): Promise<OllamaStatus> {
    const now = Date.now();
    if (!forceRefresh && this.cachedStatus && (now - this.statusCheckedAt) < this.STATUS_CACHE_MS) {
      return this.cachedStatus;
    }

    const status: OllamaStatus = {
      installed: false,
      running: false,
      modelAvailable: false,
      modelName: this.modelName,
    };

    try {
      // Check if Ollama is running
      const running = await this.isOllamaRunning();
      status.running = running;
      status.installed = running; // If running, it's installed

      if (running) {
        // Check if model is available
        status.modelAvailable = await this.isModelAvailable();
      }
    } catch (error) {
      status.error = String(error);
    }

    this.cachedStatus = status;
    this.statusCheckedAt = now;
    return status;
  }

  async ensureReady(): Promise<boolean> {
    const status = await this.getStatus();

    if (!status.running) {
      console.warn('[prototype-annotator] Ollama is not running. AI enhancement disabled.');
      console.warn('[prototype-annotator] To enable AI features, install and start Ollama:');
      console.warn('[prototype-annotator]   1. Install: https://ollama.com/download');
      console.warn('[prototype-annotator]   2. Start: ollama serve');
      console.warn('[prototype-annotator]   3. The model will be auto-downloaded on first use.');
      return false;
    }

    if (!status.modelAvailable) {
      console.log(`[prototype-annotator] Pulling model "${this.modelName}"...`);
      const pulled = await this.pullModel();
      if (!pulled) {
        console.warn(`[prototype-annotator] Failed to pull model "${this.modelName}". AI enhancement disabled.`);
        return false;
      }
      console.log(`[prototype-annotator] Model "${this.modelName}" ready.`);
      // Refresh status
      await this.getStatus(true);
    }

    return true;
  }

  async isOllamaRunning(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async isModelAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) return false;

      const data = (await response.json()) as { models?: { name: string }[] };
      const models = data.models || [];

      return models.some(
        (m) => m.name === this.modelName || m.name.startsWith(`${this.modelName}:`)
      );
    } catch {
      return false;
    }
  }

  async pullModel(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes for model download

      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.modelName, stream: false }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('[prototype-annotator] Failed to pull model:', error);
      return false;
    }
  }

  async generate(prompt: string): Promise<string | null> {
    const status = await this.getStatus();
    if (!status.running || !status.modelAvailable) {
      const ready = await this.ensureReady();
      if (!ready) return null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.modelName,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 2048,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('[prototype-annotator] Ollama generate failed:', response.status);
        return null;
      }

      const data = (await response.json()) as { response?: string };
      return data.response || null;
    } catch (error) {
      console.warn('[prototype-annotator] Ollama generate error:', error);
      return null;
    }
  }

  getSetupInstructions(): string {
    return `
Ollama Setup Instructions
=========================

Ollama is required for AI-powered prompt enhancement.

Installation:
-------------
• macOS:     brew install ollama
• Linux:     curl -fsSL https://ollama.com/install.sh | sh
• Windows:   Download from https://ollama.com/download

After Installation:
-------------------
1. Start the Ollama service:
   $ ollama serve

2. The "${this.modelName}" model will be automatically downloaded
   when you first use the AI enhancement feature.

Manual Model Download (optional):
---------------------------------
   $ ollama pull ${this.modelName}

Verify Installation:
--------------------
   $ ollama list

For more information, visit: https://ollama.com
`.trim();
  }

  resetCache(): void {
    this.cachedStatus = null;
    this.statusCheckedAt = 0;
  }
}
