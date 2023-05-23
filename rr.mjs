import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { create as createHttpClient } from 'ipfs-http-client'
import { hrtime } from 'process';
import { spawn } from 'child_process';
import { removeSync } from 'fs-extra/esm'
import fs from 'fs';
import path from 'path'
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

function delay(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
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

async function main() {
  console.log(`Starting IPFS read test using ${file} file.`)
  console.log('Starting IPFS Daemon...')
  const ipfsDaemon = spawn('jsipfs', ['daemon'], {
    stdio: ['ignore', fs.openSync('ipfs.log', 'a'), fs.openSync('ipfs.err', 'a')],
    detached: true,
  });
  ipfsDaemon.unref()

  console.log(`Daemon PID is ${ipfsDaemon.pid}`)
  const stopIPFSDaemon = async () => {
    console.log('Shutting down Daemon')
    ipfsDaemon.kill('SIGINT');
    await deleteIPFSDirectory();
  };

  // wait until daemon initialize
  await delay(3)
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
  try {
    for await (const cid of rl) {
      console.log(`Reading ${cid}`)
      const chunkLen = 0
      const dataLen = 0
      const start = hrtime.bigint()
      for await (const chunk of ipfs.cat(cid)) {
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
      ipfs.repo.gc({ quiet: true })
    }

    console.log('Data remote read ran successfully.');
    await csvWriterIpfsRead
      .writeRecords(dataIpfsRead)
    console.log('CSV table has been written successfully.')
  } catch (error) {
    console.log(error)
  } finally {
    await stopIPFSDaemon()
  }
}

main()