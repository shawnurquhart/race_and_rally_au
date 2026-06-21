import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import SftpClient from 'ssh2-sftp-client';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const args = process.argv.slice(2);
const isAutoMode = args.includes('--auto');

const localDist = path.resolve(process.cwd(), 'dist');
const localBackend = path.resolve(process.cwd(), 'backend');

const env = {
  host: process.env.CPANEL_SFTP_HOST,
  port: Number(process.env.CPANEL_SFTP_PORT ?? '22'),
  username: process.env.CPANEL_SFTP_USERNAME,
  password: process.env.CPANEL_SFTP_PASSWORD,
  remoteRoot: process.env.CPANEL_REMOTE_ROOT ?? '/public_html',
  uploadBackend: String(process.env.CPANEL_UPLOAD_BACKEND ?? 'true') === 'true',
  pruneAssets: String(process.env.CPANEL_PRUNE_ASSETS ?? 'false') === 'true',
};

const hasCredentials = Boolean(env.host && env.username && env.password);

if (!hasCredentials) {
  const message =
    '[deploy:cpanel] Missing SFTP env vars. Set CPANEL_SFTP_HOST, CPANEL_SFTP_USERNAME, and CPANEL_SFTP_PASSWORD in .env.local.';

  if (isAutoMode) {
    console.log(`${message} Skipping auto-deploy.`);
    process.exit(0);
  }

  console.error(message);
  process.exit(1);
}

if (!fs.existsSync(localDist)) {
  console.error('[deploy:cpanel] dist folder not found. Run npm run build first.');
  process.exit(1);
}

const toPosix = (value) => value.replace(/\\/g, '/');

const DEPLOY_MANIFEST_NAME = '.rra-deploy-manifest.json';

const sha1File = (filePath) => {
  const hash = crypto.createHash('sha1');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
};

const parseManifestJson = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.files && typeof parsed.files === 'object') {
      return parsed;
    }
  } catch {
    // ignore invalid manifest
  }
  return { version: 1, files: {} };
};

const loadRemoteManifest = async (sftp, remoteRoot) => {
  const remoteManifestPath = toPosix(path.posix.join(remoteRoot, DEPLOY_MANIFEST_NAME));
  const exists = await sftp.exists(remoteManifestPath);
  if (!exists) {
    return { path: remoteManifestPath, manifest: { version: 1, files: {} } };
  }

  const data = await sftp.get(remoteManifestPath);
  const text = Buffer.isBuffer(data) ? data.toString('utf8') : String(data ?? '');
  return { path: remoteManifestPath, manifest: parseManifestJson(text) };
};

const saveRemoteManifest = async (sftp, remoteManifestPath, manifest) => {
  const tempFile = path.join(os.tmpdir(), `rra-${process.pid}-${DEPLOY_MANIFEST_NAME}`);
  fs.writeFileSync(tempFile, JSON.stringify(manifest, null, 2), 'utf8');
  await sftp.fastPut(tempFile, remoteManifestPath);
  fs.rmSync(tempFile, { force: true });
  console.log(`[deploy:cpanel] Uploaded ${remoteManifestPath}`);
};

const uploadSingleFileIfExists = async (sftp, localFile, remoteFile, state) => {
  if (!fs.existsSync(localFile)) return;

  const hash = sha1File(localFile);
  if (state.remoteManifest.files[remoteFile] === hash) {
    state.skippedCount += 1;
    console.log(`[deploy:cpanel] Skipped unchanged ${remoteFile}`);
    state.nextManifest.files[remoteFile] = hash;
    return;
  }

  await sftp.fastPut(localFile, remoteFile);
  console.log(`[deploy:cpanel] Uploaded ${remoteFile}`);
  state.uploadedCount += 1;
  state.nextManifest.files[remoteFile] = hash;
};

const uploadDirectory = async (sftp, localDir, remoteDir, state, ensureDir = true, shouldUpload = () => true) => {
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  if (ensureDir) {
    await sftp.mkdir(remoteDir, true);
  }

  for (const entry of entries) {
    const localPath = path.join(localDir, entry.name);
    const remotePath = toPosix(path.posix.join(remoteDir, entry.name));

    if (entry.isDirectory()) {
      await uploadDirectory(sftp, localPath, remotePath, state, true, shouldUpload);
    } else if (entry.isFile()) {
      if (!shouldUpload(localPath, remotePath)) {
        console.log(`[deploy:cpanel] Skipped ${remotePath}`);
        continue;
      }

      const hash = sha1File(localPath);
      if (state.remoteManifest.files[remotePath] === hash) {
        state.skippedCount += 1;
        state.nextManifest.files[remotePath] = hash;
        console.log(`[deploy:cpanel] Skipped unchanged ${remotePath}`);
        continue;
      }

      await sftp.fastPut(localPath, remotePath);
      console.log(`[deploy:cpanel] Uploaded ${remotePath}`);
      state.uploadedCount += 1;
      state.nextManifest.files[remotePath] = hash;
    }
  }
};

const removeStaleHashedIndexAssets = async (sftp, remoteRoot, localDistRoot) => {
  const remoteAssets = toPosix(path.posix.join(remoteRoot, 'assets'));
  const exists = await sftp.exists(remoteAssets);
  if (!exists) {
    return;
  }

  const localAssetsDir = path.resolve(localDistRoot, 'assets');
  const localAssetNames = new Set(
    fs.existsSync(localAssetsDir)
      ? fs
          .readdirSync(localAssetsDir, { withFileTypes: true })
          .filter((entry) => entry.isFile())
          .map((entry) => entry.name)
      : [],
  );

  const entries = await sftp.list(remoteAssets);
  const staleIndexAssets = entries
    .filter(
      (entry) =>
        entry.type === '-' &&
        /^(index|index\.es)-.*\.(js|css)$/i.test(entry.name) &&
        !localAssetNames.has(entry.name),
    )
    .map((entry) => toPosix(path.posix.join(remoteAssets, entry.name)));

  for (const filePath of staleIndexAssets) {
    await sftp.delete(filePath);
    console.log(`[deploy:cpanel] Removed stale asset ${filePath}`);
  }
};

const removeLegacyRootBackendApiIfPresent = async (sftp, remoteRoot) => {
  const legacyApiDir = toPosix(path.posix.join(remoteRoot, 'backend', 'api'));
  const legacyBackendDir = toPosix(path.posix.join(remoteRoot, 'backend'));

  const legacyApiExists = await sftp.exists(legacyApiDir);
  if (legacyApiExists) {
    await sftp.rmdir(legacyApiDir, true);
    console.log(`[deploy:cpanel] Removed legacy backend api dir ${legacyApiDir}`);
  }

  const legacyBackendExists = await sftp.exists(legacyBackendDir);
  if (legacyBackendExists === 'd') {
    const remaining = await sftp.list(legacyBackendDir);
    if (remaining.length === 0) {
      await sftp.rmdir(legacyBackendDir, false);
      console.log(`[deploy:cpanel] Removed empty legacy backend dir ${legacyBackendDir}`);
    }
  }
};

const run = async () => {
  const sftp = new SftpClient();
  const remoteRoot = toPosix(env.remoteRoot);

  try {
    console.log(`[deploy:cpanel] Connecting to ${env.host}:${env.port} ...`);
    await sftp.connect({
      host: env.host,
      port: env.port,
      username: env.username,
      password: env.password,
    });

    const remoteManifestState = await loadRemoteManifest(sftp, remoteRoot);
    const state = {
      remoteManifest: remoteManifestState.manifest,
      nextManifest: { version: 1, files: {} },
      uploadedCount: 0,
      skippedCount: 0,
    };

    if (env.pruneAssets) {
      const remoteAssets = toPosix(path.posix.join(remoteRoot, 'assets'));
      const exists = await sftp.exists(remoteAssets);
      if (exists) {
        await sftp.rmdir(remoteAssets, true);
        console.log(`[deploy:cpanel] Pruned stale directory ${remoteAssets}`);
      }
    } else {
      // Keep asset folder, but remove stale hashed index bundles before upload so only current build index files remain.
      await removeStaleHashedIndexAssets(sftp, remoteRoot, localDist);
    }

    await uploadDirectory(sftp, localDist, remoteRoot, state, false);

    const rootHtaccess = path.resolve(process.cwd(), '.htaccess');
    const publicHtaccess = path.resolve(process.cwd(), 'public', '.htaccess');
    const localHtaccess = fs.existsSync(rootHtaccess) ? rootHtaccess : publicHtaccess;
    const remoteHtaccess = toPosix(path.posix.join(remoteRoot, '.htaccess'));
    await uploadSingleFileIfExists(sftp, localHtaccess, remoteHtaccess, state);

    const localRedirects = path.resolve(process.cwd(), 'public', '_redirects');
    const remoteRedirects = toPosix(path.posix.join(remoteRoot, '_redirects'));
    await uploadSingleFileIfExists(sftp, localRedirects, remoteRedirects, state);

    if (env.uploadBackend && fs.existsSync(localBackend)) {
      const remoteBackend = toPosix(path.posix.join(remoteRoot, 'assets', 'backend'));
      const shouldUploadBackendFile = (_localPath, remotePath) => {
        const normalizedRemote = toPosix(remotePath).toLowerCase();
        // Protect live server secrets/config from being overwritten by local placeholder files.
        if (normalizedRemote.endsWith('/api/config.php') || normalizedRemote.endsWith('/api/config.php.txt')) {
          return false;
        }
        return true;
      };

      await uploadDirectory(sftp, localBackend, remoteBackend, state, true, shouldUploadBackendFile);
      await removeLegacyRootBackendApiIfPresent(sftp, remoteRoot);

      // Keep protected config files out of manifest tracking (intentionally never uploaded).
      delete state.nextManifest.files[toPosix(path.posix.join(remoteBackend, 'api', 'config.php'))];
      delete state.nextManifest.files[toPosix(path.posix.join(remoteBackend, 'api', 'config.php.txt'))];
    }

    await saveRemoteManifest(sftp, remoteManifestState.path, state.nextManifest);
    console.log(`[deploy:cpanel] Upload summary: uploaded ${state.uploadedCount}, skipped unchanged ${state.skippedCount}`);

    console.log('[deploy:cpanel] Deploy complete.');
  } catch (error) {
    console.error('[deploy:cpanel] Deploy failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await sftp.end().catch(() => undefined);
  }
};

void run();
