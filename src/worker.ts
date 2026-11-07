import { NativeConnection, Worker } from '@temporalio/worker';
import { config } from './config/env';
import * as supplierActivities from './activities/supplier.activities';
import * as cacheActivities from './activities/cache.activities';

async function run() {
  const connection = await NativeConnection.connect({ address: config.temporalAddress });
  const worker = await Worker.create({
    connection,
    namespace: config.temporalNamespace,
    taskQueue: config.taskQueue,
    workflowsPath: require.resolve('./workflows/hotel.workflow'),
    activities: { ...supplierActivities, ...cacheActivities }
  });
  console.log(`Temporal worker listening on ${config.taskQueue}`);
  await worker.run();
}

run().catch(error => {
  console.error('Temporal worker failed:', error);
  process.exit(1);
});
