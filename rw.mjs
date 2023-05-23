import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import crypto from 'crypto';
import { create as createHttpClient } from 'ipfs-http-client'
import { hrtime } from 'process';
import { spawn } from 'child_process';
import { removeSync } from 'fs-extra/esm'
import fs from 'fs';

const n = 20
const mbSize = 16
const file = `cid-${mbSize}MB-3.txt`

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms*1000));
}

const deleteIPFSDirectory = async () => {
  const ipfsDirPath = path.join(process.env.HOME, '.ipfs');

  try {
    await removeSync(ipfsDirPath);
    console.log('IPFS directory deleted.');
  } catch (err) {
    console.error(`Failed to delete IPFS directory: ${err}`);
  }
};

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
  console.log('Starting IPFS Daemon...')
  const ipfsDaemon = spawn('ipfs', ['daemon']);
  const stopIPFSDaemon = async () => {
    ipfsDaemon.kill('SIGINT');
    await deleteIPFSDirectory();
  };

  // wait until daemon initialize
  delay(3)
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
  await stopIPFSDaemon()
}

main()
