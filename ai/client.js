export class AIClient {
  constructor(onProgress) {
    this.onProgress = onProgress;
    this.serial = 0;
    this.pending = new Map();
  }
  start() {
    if (this.worker) return;
    this.worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    this.worker.onmessage = ({ data }) => {
      const request = this.pending.get(data.id);
      if (!request) return;
      if (data.progress) {
        clearTimeout(request.timer);
        request.timer = setTimeout(
          () =>
            this.cancel(
              'Le moteur est resté sans progression pendant 5 minutes. Réessayez ou utilisez les outils manuels.',
            ),
          300000,
        );
        this.onProgress(data.progress);
        return;
      }
      clearTimeout(request.timer);
      this.pending.delete(data.id);
      data.error ? request.reject(new Error(data.error)) : request.resolve(data.result);
    };
    this.worker.onerror = () =>
      this.cancel('Le moteur IA n’a pas pu démarrer. Vérifiez la connexion et réessayez.');
  }
  run(task, payload) {
    this.start();
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => this.cancel('Le moteur a dépassé 5 minutes. Essayez une image plus petite.'),
        300000,
      );
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, task, ...payload });
    });
  }
  cancel(message = 'Analyse annulée. Votre image est conservée.') {
    this.worker?.terminate();
    this.worker = null;
    for (const item of this.pending.values()) {
      clearTimeout(item.timer);
      item.reject(new Error(message));
    }
    this.pending.clear();
  }
}
