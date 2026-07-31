const DB_NAME = "ai-learning-dashboard";
const DB_VERSION = 2;
const STORE_NAME = "certification-files";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: "certificationId",
        });
      }
    };

    request.onsuccess = () => resolve(request.result);

    request.onerror = () =>
      reject(request.error || new Error("Failed to open IndexedDB."));
  });
}

async function getStore(mode = "readonly") {
  const db = await openDatabase();

  const transaction = db.transaction(STORE_NAME, mode);

  return {
    db,
    store: transaction.objectStore(STORE_NAME),
  };
}

export async function saveCertificationFile(certificationId, file) {
  const { db, store } = await getStore("readwrite");

  return new Promise((resolve, reject) => {
    const request = store.put({
      certificationId: String(certificationId),
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file,
      updatedAt: new Date().toISOString(),
    });

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getCertificationFile(certificationId) {
  const { db, store } = await getStore();

  return new Promise((resolve, reject) => {
    const request = store.get(String(certificationId));

    request.onsuccess = () => {
      db.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function getAllCertificationFiles() {
  const { db, store } = await getStore();

  return new Promise((resolve, reject) => {
    const request = store.getAll();

    request.onsuccess = () => {
      db.close();

      const result = {};

      request.result.forEach((item) => {
        result[item.certificationId] = item;
      });

      resolve(result);
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteCertificationFile(certificationId) {
  const { db, store } = await getStore("readwrite");

  return new Promise((resolve, reject) => {
    const request = store.delete(String(certificationId));

    request.onsuccess = () => {
      db.close();
      resolve();
    };

    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export function downloadCertificationFile(file) {
  if (!file?.blob) return;

  const url = URL.createObjectURL(file.blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = file.name || "certificate";

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}