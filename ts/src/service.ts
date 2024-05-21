//import initHostBind, * as hostbind from "./wasmbind/hostbind.js";
import initBootstrap, * as bootstrap from "./bootstrap/bootstrap.js";
import initApplication, * as application from "./application/application.js";
import { verify_sign, LeHexBN } from "./sign.js";
import { Queue } from 'bullmq';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import express from 'express';

const connection = new IORedis(
    {
        host: 'localhost',  // Your Redis server host
        port: 6379,        // Your Redis server port
        maxRetriesPerRequest: null  // Important: set this to null
    }
);

const commands = new BigUint64Array();

async function main() {
  console.log("bootstraping ...");
  await (initBootstrap as any)();
  console.log(bootstrap);
  console.log("initialize wasm application ...");
  console.log(application);
  await (initApplication as any)(bootstrap);

  console.log("initialize sequener queue");
  const myQueue = new Queue('sequencer', {connection});

  // Automatically add a job to the queue every few seconds
  setInterval(async () => {
    try {
      const job = await myQueue.add('autoJob', {command:0});
    } catch (error) {
      console.error('Error adding automatic job to the queue:', error);
    }
  }, 5000); // Change the interval as needed (e.g., 5000ms for every 5 seconds)


  console.log("start worker ...");

  const worker = new Worker('sequencer', async job => {
    if (job.name == 'autoJob') {
      console.log("handle auto", job.data);
    } else if (job.name == 'transaction') {
      console.log("handle transaction");
    }
  }, {connection});


  console.log("start express server");
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.post('/send', async (req, res) => {
    const { value } = req.body;

    console.log("value is", value);

    if (!value) {
      return res.status(400).send('Value is required');
    }

    try {
      const msg = new LeHexBN(value.msg);
      const pkx = new LeHexBN(value.pkx);
      const pky = new LeHexBN(value.pky);
      const sigx = new LeHexBN(value.sigx);
      const sigy = new LeHexBN(value.sigy);
      const sigr = new LeHexBN(value.sigr);
      if (verify_sign(msg, pkx, pky, sigx, sigy, sigr) == false) {
        console.error('Invalid signature:');
        res.status(500).send('Invalid signature');
      } else {
        const job = await myQueue.add('transaction', { value });
        res.status(201).send(`Transaction ${value} added to the queue with job ${job.id}`);
      }
    } catch (error) {
      console.error('Error adding job to the queue:', error);
      res.status(500).send('Failed to add job to the queue');
    }
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
