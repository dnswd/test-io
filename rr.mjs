import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { create as createHttpClient } from 'ipfs-http-client'
import { hrtime } from 'process';
import fs from 'fs';
import readline from 'readline';

const n = 100
const mbSize = 1
const file = `cid-${mbSize}MB-20.txt`

// Sample data for the CSV table
const dataIpfsRead = [];
const csvWriterIpfsRead = createCsvWriter({
  path: `ipfs-read-${mbSize}MB-${Date.now()}.csv`, // Path to the output file
  header: [
    { id: 'start', title: 'Start (ns)' },
    { id: 'stop', title: 'Stop (ns)' },
    { id: 'duration', title: 'Duration (ns)' },
    { id: 'cid', title: 'CID' },
  ],
});

async function main() {
  console.log(`Starting ${n} test with ${mbSize} MiB data each.`)
  console.log('Connecting to local IPFS...')

  const ipfs = createHttpClient({
    host: '127.0.0.1',
    port: 5002,
    protocol: 'http'
  })

  console.log('Testing data remote read...')
  const fileStream = fs.createReadStream(file);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  })

  for await (const cid of rl) {
    console.log(`Reading ${cid}`)
    const start = hrtime.bigint()
    await ipfs.cat(cid)
    const stop = hrtime.bigint()
    dataIpfsRead.push({
      start: start,
      stop: stop,
      duration: stop - start,
      cid: cid
    })
    ipfs.repo.gc({quiet: true})
  }

  console.log('Data remote read ran successfully.');
  csvWriterIpfsRead
    .writeRecords(dataIpfsRead)
    .then(() => console.log('CSV table has been written successfully.'))
    .catch((error) => console.error('Error writing CSV table:', error));
}

main()