// docker run -p 5432:5432 --name postgres-test -e POSTGRES_PASSWORD=password -d postgres 

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const crypto = require('crypto');
const { hrtime } = require('node:process');

// Sample data for the CSV table
const dataRead = [];
const dataWrite = [];

const n = 100
const mbSize = 1
const sqlCreateTable = `
CREATE TABLE key_byte_storage (
  key VARCHAR(255) PRIMARY KEY,
  value BYTEA
);
`
const sqlInsert = `
INSERT INTO key_byte_storage (key, value) VALUES ($1, $2);
`
const sqlSelect = `
SELECT value FROM key_byte_storage WHERE key = $1;
`
const sqlCleanUp = `
DROP TABLE IF EXISTS key_byte_storage;
`

// Define the CSV writer
const csvWriterWrite = createCsvWriter({
  path: `write-${mbSize}MB-${Date.now()}.csv`, // Path to the output file
  header: [
    { id: 'start', title: 'Start (ns)' },
    { id: 'stop', title: 'Stop (ns)' },
    { id: 'duration', title: 'Duration (ns)' },
  ],
});

const csvWriterRead = createCsvWriter({
  path: `read-${mbSize}MB-${Date.now()}.csv`, // Path to the output file
  header: [
    { id: 'start', title: 'Start (ns)' },
    { id: 'stop', title: 'Stop (ns)' },
    { id: 'duration', title: 'Duration (ns)' },
  ],
});

const generateMegaBytes = (megaByteSize) => {
  const byteSize = megaByteSize * 1024 * 1024;
  return crypto.randomBytes(byteSize);
};

async function main() {  
  console.log(`Starting ${n} test with ${mbSize} MiB data each.`)
  console.log('Connecting to postgres...')

  const { Client } = require('pg')
  const client = new Client({
    host: '34.101.101.167',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'password',
  })
  client.connect()

  console.log('Creating a table')
  await client.query(sqlCreateTable);

  console.log('Testing data write...')
  try {
    // Insert each row of data
    for (let i = 0; i < n; i++) {
      const key = `key${i + 1}`;
      const value = generateMegaBytes(mbSize);
      console.log(`Inserting ${key}`)
      const start = hrtime.bigint()
      await client.query(sqlInsert, [key, value]);
      const stop = hrtime.bigint()
      dataWrite.push({
        start: start,
        stop: stop,
        duration: stop-start
      })
    }
    console.log('Data write ran successfully.');
    csvWriterWrite
      .writeRecords(dataWrite)
      .then(() => console.log('CSV table has been written successfully.'))
      .catch((error) => console.error('Error writing CSV table:', error));
  } catch (error) {
    console.error('Error inserting data:', error);
    client.end()
    process.exit(1)
  }

  console.log('Testing data read...')
  try {
    // Insert each row of data
    for (let i = 0; i < n; i++) {
      const key = `key${i + 1}`;
      console.log(`Reading ${key}`)
      const start = hrtime.bigint()
      await client.query(sqlSelect, [key]);
      const stop = hrtime.bigint()
      dataRead.push({
        start: start,
        stop: stop,
        duration: stop-start
      })
    }
    console.log('Data read ran successfully.');
    csvWriterRead
      .writeRecords(dataRead)
      .then(() => console.log('CSV table has been written successfully.'))
      .catch((error) => console.error('Error writing CSV table:', error));
  } catch (error) {
    console.error('Error selecting data:', error);
    client.end()
    process.exit(1)
  }

  console.log('Cleaning postgres...')
  try {
    await client.query(sqlCleanUp);
    console.log('Table dropped successfully.');
  } catch (error) {
    console.error('Error selecting data:', error);
    client.end()
    process.exit(1)
  } finally {
    client.end()
  }

  console.log('Benchmark completed, read-write result can be accessed corresponsing csv file.')
}

main()
