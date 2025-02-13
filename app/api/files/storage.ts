import { NoSuchKey } from '@aws-sdk/client-s3';
import { config } from 'api/config';
import { errorLog } from 'api/log';
import { tenants } from 'api/tenants';
// eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
// eslint-disable-next-line node/no-restricted-import
import { access, readFile } from 'fs/promises';
import path from 'path';
import { FileType } from 'shared/types/fileType';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import {
  activityLogPath,
  attachmentsPath,
  customUploadsPath,
  deleteFile,
  uploadsPath,
} from './filesystem';
import { S3Storage } from './S3Storage';

type FileTypes = NonNullable<FileType['type']> | 'activitylog' | 'segmentation';

let s3Instance: S3Storage;
const s3 = () => {
  if (config.s3.endpoint && !s3Instance) {
    s3Instance = new S3Storage();
  }
  return s3Instance;
};

const paths: { [k in FileTypes]: (filename: string) => string } = {
  custom: customUploadsPath,
  document: uploadsPath,
  segmentation: filename => uploadsPath(`segmentation/${filename}`),
  thumbnail: uploadsPath,
  attachment: attachmentsPath,
  activitylog: activityLogPath,
};

const streamToBuffer = async (stream: Readable): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const _buf: Buffer[] = [];
    stream.on('data', (chunk: any) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err: unknown) => reject(err));
  });

const s3KeyWithPath = (filename: string, type: FileTypes) => {
  const sliceValue = type === 'segmentation' ? -3 : -2;
  return path.join(
    tenants.current().name,
    paths[type](filename).split('/').slice(sliceValue).join('/')
  );
};

const readFromS3 = async (filename: string, type: FileTypes): Promise<Readable> => {
  try {
    const response = await s3().get(s3KeyWithPath(filename, type));
    return response.Body as Readable;
  } catch (e: unknown) {
    const onlyS3 = tenants.current().featureFlags?.onlyS3 || false;
    if (e instanceof NoSuchKey && !onlyS3) {
      const start = Date.now();
      s3()
        .upload(s3KeyWithPath(filename, type), await readFile(paths[type](filename)))
        .then(() => {
          const finish = Date.now();
          errorLog.debug(
            `File "${filename}" uploaded to S3 in ${(finish - start) / 1000} for tenant ${
              tenants.current().name
            }`
          );
        })
        .catch(error => {
          errorLog.error(
            `File "${filename}" Failed to be uploaded to S3 with error: ${
              error.message
            } for tenant ${tenants.current().name}`
          );
        });

      return createReadStream(paths[type](filename));
    }
    throw e;
  }
};

export const storage = {
  async readableFile(filename: string, type: FileTypes) {
    if (tenants.current().featureFlags?.s3Storage) {
      return readFromS3(filename, type);
    }
    return createReadStream(paths[type](filename));
  },
  async fileContents(filename: string, type: FileTypes) {
    return streamToBuffer(await this.readableFile(filename, type));
  },
  async removeFile(filename: string, type: FileTypes) {
    if (!tenants.current().featureFlags?.onlyS3) {
      await deleteFile(paths[type](filename));
    }
    if (tenants.current().featureFlags?.s3Storage) {
      await s3().delete(s3KeyWithPath(filename, type));
    }
  },
  async storeFile(filename: string, file: Readable, type: FileTypes) {
    if (tenants.current().featureFlags?.s3Storage && tenants.current().featureFlags?.onlyS3) {
      await s3().upload(s3KeyWithPath(filename, type), await streamToBuffer(file));
      return;
    }

    await pipeline(file, createWriteStream(paths[type](filename)));

    if (tenants.current().featureFlags?.s3Storage) {
      await s3().upload(
        s3KeyWithPath(filename, type),
        await streamToBuffer(createReadStream(paths[type](filename)))
      );
    }
  },
  async fileExists(filename: string, type: FileTypes): Promise<boolean> {
    if (tenants.current().featureFlags?.s3Storage && tenants.current().featureFlags?.onlyS3) {
      try {
        await readFromS3(filename, type);
      } catch (err) {
        if (err instanceof NoSuchKey) {
          return false;
        }
        if (err) {
          throw err;
        }
      }
      return true;
    }

    try {
      await access(paths[type](filename));
    } catch (err) {
      if (err?.code === 'ENOENT') {
        return false;
      }
      if (err) {
        throw err;
      }
    }
    return true;
  },
};
