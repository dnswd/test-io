import { Storage } from "@google-cloud/storage";
import crypto from 'crypto';
import path from 'path'

const generateRandomKiloBytes = (kiloByteSize) => {
  const byteSize = kiloByteSize * 1024;
  return crypto.randomBytes(byteSize);
};

const logger = (message) => {
  console.log(`${Date.now()},${message}`)
}

async function wait(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000));
}

const serviceKey = path.join(process.cwd(), "keys.json");

const storage = new Storage({
  keyFilename: serviceKey,
  projectId: "rclone-tasla",
});

const bucket = storage.bucket("test-centralized-store");

const kbs = [4, 16, 64, 1000, 4000, 160000];

// const uploaded = {}

async function uploadGCP(unit) {
  // return new Promise((resolve, reject) => {
    const data = generateRandomKiloBytes(unit)
    const blobStream = bucket
      .file(`test1-${unit}KB`)
      .createWriteStream({ resumable: false });
    blobStream.on("finish", () => {
      logger(`Finished upload ${unit} kilobytes`)
      // resolve(data)
    }).on("error", (e) => {
      // reject(`Error: Unable to upload ${unit} kilobytes`)
      logger(`Unable to upload ${unit} kilobytes: \n${e}`)
    });
    logger(`Uploading ${unit} kilobytes`)
    blobStream.end(data)
    return data
  // })
}

async function main() {
  kbs.forEach(async (unit) => {
    const data = await uploadGCP(unit)
    // uploaded[unit] = data
    await wait(5)
  });
}

main().catch(e => logger(e))