import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import crypto from 'crypto';
import { create as createHttpClient } from 'ipfs-http-client'
import { hrtime } from 'process';
import fs from 'fs';

const n = 100
const mbSize = 1

async function writeFile(filePath, lines) {
  const writeStream = fs.createWriteStream(filePath);

  for (const line of lines) {
    writeStream.write(line + '\n');
  }

  writeStream.end();

  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

// Sample data for the CSV table
const dataIpfsWrite = [];
const CID = [];

const csvWriterIpfsWrite = createCsvWriter({
  path: `write-${mbSize}MB-${Date.now()}.csv`, // Path to the output file
  header: [
    { id: 'start', title: 'Start (ns)' },
    { id: 'stop', title: 'Stop (ns)' },
    { id: 'duration', title: 'Duration (ns)' },
    { id: 'cid', title: 'CID' },
  ],
});

const generateMegaBytes = (megaByteSize) => {
  const byteSize = megaByteSize * 1024 * 1024;
  return crypto.randomBytes(byteSize);
};

await ipfs.add(testObjectString)
await ipfs.cat()

async function main() {
  console.log(`Starting ${n} test with ${mbSize} MiB data each.`)
  console.log('Connecting to local IPFS...')

  const ipfs = createHttpClient({
    host: 'localhost',
    port: 5002,
    protocol: 'http'
  })

  console.log('Testing data write...')
  // Insert each row of data
  for (let i = 0; i < n; i++) {
    console.log(`Inserting key${i+1}`)
    const value = generateMegaBytes(mbSize);
    const start = hrtime.bigint()
    const res = await ipfs.add(value)
    const stop = hrtime.bigint()
    dataIpfsWrite.push({
      start: start,
      stop: stop,
      duration: stop - start,
      cid: res.path
    })
    CID.push(res.path)
    console.log(`Successfully added ${res.path}`)
  }
  console.log('Data write ran successfully.');
  csvWriterIpfsWrite
    .writeRecords(dataWrite)
    .then(() => console.log('CSV table has been written successfully.'))
    .catch((error) => console.error('Error writing CSV table:', error));
  await writeFile('cid.txt', CID)
  console.log('All the CIDs are saved in cid.txt')
}

main()
