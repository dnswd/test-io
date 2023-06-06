import { Storage } from "@google-cloud/storage";
import crypto from 'crypto';
import path from 'path'
import fs from 'fs'

const generateRandomKiloBytes = (kiloByteSize) => {
  const byteSize = kiloByteSize * 1024;
  return crypto.randomBytes(byteSize);
};

const logger = (message) => {
  console.log(`${Date.now()},${message}`)
}

async function wait(s) {
  return new Promise(resolve => setTimeout(resolve, s*1000));
}

const serviceKey = path.join(process.cwd(), "keys.json");

const storage = new Storage({
  keyFilename: serviceKey,
  projectId: "rclone-tasla",
});

const bucket = storage.bucket("test-centralized-store");

const kbs = [4, 16, 64, 1*1024, 4*1024, 16*1024];

const uploaded = {}

function uploadGCP(unit) {
  return new Promise((resolve, reject) => {
    const filename = `test1-${unit}KB`
    const blobStream = bucket
      .file(filename)
      .createWriteStream({ resumable: false });
    blobStream.on("finish", () => {
      logger(`Finished upload ${unit} kilobytes`)
      resolve(filename)
    }).on("error", (e) => {
      logger(`Unable to upload ${unit} kilobytes: \n${e}`)
      reject(e)
    });
    logger(`Uploading ${unit} kilobytes`)
    blobStream.end(generateRandomKiloBytes(unit))
    // return filename
  })
}

async function downloadGCP(filename) {
  const file = bucket.file(filename)
  const readStream = file.createReadStream();
  const writeStream = fs.createWriteStream(filename);

  readStream.pipe(writeStream);
  return new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

async function cleanup(filename) {
  await bucket.file(filename).delete()
  await fs.unlink(filename, (err) => {
    if (err) {
      logger(err)
    }
  })
}

async function main() {
  logger("Uploading files")

  for (const unit of kbs) {
    const filename = await uploadGCP(unit)
    uploaded[unit] = filename
    logger("Waiting for ambient traffic")
    await wait(5)
  }

  logger("Mark download traffic, waiting for 10 seconds")
    await wait(10)

  logger("Downloading files")
  for (const unit in uploaded) {
    const filename = uploaded[unit];
    await downloadGCP(filename)
    logger("Waiting for ambient traffic")
    await wait(5)
  }

  logger("Cleaning local and GCS")
  for (const unit in uploaded) {
    const filename = uploaded[unit];
    await cleanup(filename)
  }
}

main().catch(e => logger(e))