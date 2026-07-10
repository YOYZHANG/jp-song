const dbName = "sssong-web-audio";
const storeName = "audioFiles";

export async function saveLocalAudio(songID: string, file: File): Promise<void> {
  const db = await openAudioDB();
  await requestToPromise(
    db.transaction(storeName, "readwrite").objectStore(storeName).put(
      {
        songID,
        blob: file,
        fileName: file.name,
        mimeType: file.type || "audio/mpeg",
        updatedAt: new Date().toISOString()
      },
      songID
    )
  );
  db.close();
}

export async function readLocalAudio(songID: string): Promise<Blob | null> {
  const db = await openAudioDB();
  const record = await requestToPromise<LocalAudioRecord | undefined>(
    db.transaction(storeName, "readonly").objectStore(storeName).get(songID)
  );
  db.close();
  return record?.blob ?? null;
}

export async function removeLocalAudio(songID: string): Promise<void> {
  const db = await openAudioDB();
  await requestToPromise(db.transaction(storeName, "readwrite").objectStore(storeName).delete(songID));
  db.close();
}

export async function clearLocalAudioLibrary(): Promise<void> {
  const db = await openAudioDB();
  await requestToPromise(db.transaction(storeName, "readwrite").objectStore(storeName).clear());
  db.close();
}

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开本地音频数据库"));
  });
}

function requestToPromise<T = unknown>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("本地音频读写失败"));
  });
}

interface LocalAudioRecord {
  songID: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  updatedAt: string;
}
