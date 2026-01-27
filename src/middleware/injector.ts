import type { Request, Response, NextFunction } from 'express';
import type { ClientConfig } from '../types/index.js';

export function createInjector(basePath: string, clientConfig: ClientConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip API and static asset requests
    if (req.path.startsWith(basePath)) {
      next();
      return;
    }

    // Store original methods
    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    let chunks: Buffer[] = [];
    let isHtml = false;

    // Override write to capture chunks
    res.write = function (
      chunk: unknown,
      encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void),
      callback?: (error: Error | null | undefined) => void
    ): boolean {
      const encoding = typeof encodingOrCallback === 'function' ? undefined : encodingOrCallback;
      const cb = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback;

      if (chunk) {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk, encoding || 'utf-8'));
        }
      }

      // Check content type on first write
      if (chunks.length === 1) {
        const contentType = res.getHeader('content-type');
        isHtml = typeof contentType === 'string' && contentType.includes('text/html');
      }

      if (cb) {
        cb(null);
      }
      return true;
    };

    // Override end to inject script
    res.end = function (
      chunk?: unknown,
      encodingOrCallback?: BufferEncoding | (() => void),
      callback?: () => void
    ): Response {
      const encoding = typeof encodingOrCallback === 'function' ? undefined : encodingOrCallback;
      const cb = typeof encodingOrCallback === 'function' ? encodingOrCallback : callback;

      if (chunk) {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk, encoding || 'utf-8'));
        }
      }

      // Check content type
      const contentType = res.getHeader('content-type');
      isHtml = typeof contentType === 'string' && contentType.includes('text/html');

      if (isHtml && chunks.length > 0) {
        let html = Buffer.concat(chunks).toString('utf-8');

        // Only inject if not already present
        if (html.includes('</body>') && !html.includes('prototype-annotator-root')) {
          const configScript = `<script>window.__PROTOTYPE_ANNOTATOR_CONFIG__=${JSON.stringify(clientConfig)};</script>`;
          const overlayScript = `<script src="${basePath}/overlay.js"></script>`;
          html = html.replace('</body>', `${configScript}${overlayScript}</body>`);

          // Update content length
          res.setHeader('content-length', Buffer.byteLength(html));
        }

        // Restore and call original methods
        res.write = originalWrite;
        res.end = originalEnd;

        return res.end(html, 'utf-8', cb);
      }

      // Not HTML, restore and send original chunks
      res.write = originalWrite;
      res.end = originalEnd;

      if (chunks.length > 0) {
        const body = Buffer.concat(chunks);
        return res.end(body, cb);
      }

      return res.end(cb);
    };

    next();
  };
}
