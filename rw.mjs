import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import crypto from 'crypto';
import { create as createHttpClient } from 'ipfs-http-client'
import { hrtime } from 'process';
import fs from 'fs';

const n = 20
const mbSize = 4
const file = `cid-${mbSize}MB-1.txt`

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms*1000));
}

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
  path: `ipfs-write-${mbSize}MB-${Date.now()}.csv`, // Path to the output file
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

async function main() {
  console.log(`Starting ${n} test with ${mbSize} MiB data each.`)
  console.log('Connecting to local IPFS...')

  const ipfs = createHttpClient({
    host: '127.0.0.1',
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
    await delay(3)
  }
  console.log('Data write ran successfully.');
  csvWriterIpfsWrite
    .writeRecords(dataIpfsWrite)
    .then(() => console.log('CSV table has been written successfully.'))
    .catch((error) => console.error('Error writing CSV table:', error));
  await writeFile(file, CID)
  console.log(`All the CIDs are saved in ${file}`)
}

main()
