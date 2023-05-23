import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { create as createHttpClient } from 'ipfs-http-client'
import { hrtime } from 'process';
import fs from 'fs';
import readline from 'readline';

const mbSize = 16
const file = `cid-${mbSize}MB-3.txt`

// Sample data for the CSV table
const dataIpfsRead = [];
const csvWriterIpfsRead = createCsvWriter({
  path: `ipfs-read-${file}-${Date.now()}.csv`, // Path to the output file
  header: [
    { id: 'start', title: 'Start (ns)' },
    { id: 'stop', title: 'Stop (ns)' },
    { id: 'duration', title: 'Duration (ns)' },
    { id: 'cid', title: 'CID' },
  ],
});

async function main() {
  console.log(`Starting IPFS read test using ${file} file.`)
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
    const chunkLen = 0
    const dataLen = 0
    const start = hrtime.bigint()
    for await (const chunk of this.ipfs.cat(cid)) {
      chunkLen += 1
      dataLen += chunk.length
    }
    const stop = hrtime.bigint()
    console.log(`Got ${chunkLen} chunks with ${dataLen} of data.`)
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