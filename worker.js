const { parentPort } = require('worker_threads');

parentPort.on('message', (message) => {
  console.log(`Worker received message: ${message}`);
  parentPort.postMessage("Bot is Successfully Running");
});
