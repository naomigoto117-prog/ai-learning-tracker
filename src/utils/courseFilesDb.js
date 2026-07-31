const DB_NAME = "ai-learning-dashboard-files";
const DB_VERSION = 1;
const STORE_NAME = "course-files";

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DB_NAME,
      DB_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          STORE_NAME
        )
      ) {
        const store =
          database.createObjectStore(
            STORE_NAME,
            {
              keyPath: "id",
            }
          );

        store.createIndex(
          "courseId",
          "courseId",
          {
            unique: false,
          }
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error(
            "The file database could not be opened."
          )
      );
    };
  });
}

function getFileMimeType(fileRecord) {
  if (
    fileRecord?.type &&
    fileRecord.type !==
      "application/octet-stream"
  ) {
    return fileRecord.type;
  }

  const extension = fileRecord?.name
    ?.split(".")
    .pop()
    ?.toLowerCase();

  const mimeTypes = {
    pdf: "application/pdf",
    txt: "text/plain",
    csv: "text/csv",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  };

  return (
    mimeTypes[extension] ||
    "application/octet-stream"
  );
}

export async function getCourseFiles(
  courseId
) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction =
      database.transaction(
        STORE_NAME,
        "readonly"
      );

    const store =
      transaction.objectStore(STORE_NAME);

    const request = store
      .index("courseId")
      .getAll(courseId);

    request.onsuccess = () => {
      const storedFiles = Array.isArray(
        request.result
      )
        ? request.result
        : [];

      const sortedFiles = storedFiles.sort(
        (firstFile, secondFile) =>
          new Date(
            secondFile.uploadedAt
          ).getTime() -
          new Date(
            firstFile.uploadedAt
          ).getTime()
      );

      resolve(sortedFiles);
    };

    request.onerror = () => {
      reject(
        request.error ||
          new Error(
            "The course files could not be loaded."
          )
      );
    };

    transaction.oncomplete = () => {
      database.close();
    };

    transaction.onerror = () => {
      database.close();

      reject(
        transaction.error ||
          new Error(
            "The course files could not be loaded."
          )
      );
    };
  });
}

export async function saveCourseFiles(
  courseId,
  fileList
) {
  const files = Array.from(
    fileList || []
  );

  if (files.length === 0) {
    return [];
  }

  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction =
      database.transaction(
        STORE_NAME,
        "readwrite"
      );

    const store =
      transaction.objectStore(STORE_NAME);

    const savedFiles = [];

    files.forEach((file) => {
      const mimeType =
        file.type ||
        getFileMimeType({
          name: file.name,
        });

      const blob = file.slice(
        0,
        file.size,
        mimeType
      );

      const record = {
        id: crypto.randomUUID(),
        courseId,
        name: file.name,
        type: mimeType,
        size: file.size,
        uploadedAt:
          new Date().toISOString(),
        blob,
      };

      store.add(record);
      savedFiles.push(record);
    });

    transaction.oncomplete = () => {
      database.close();
      resolve(savedFiles);
    };

    transaction.onerror = () => {
      database.close();

      reject(
        transaction.error ||
          new Error(
            "The files could not be saved."
          )
      );
    };

    transaction.onabort = () => {
      database.close();

      reject(
        transaction.error ||
          new Error(
            "The file upload was cancelled."
          )
      );
    };
  });
}

export async function deleteCourseFile(
  fileId
) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction =
      database.transaction(
        STORE_NAME,
        "readwrite"
      );

    transaction
      .objectStore(STORE_NAME)
      .delete(fileId);

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      database.close();

      reject(
        transaction.error ||
          new Error(
            "The file could not be deleted."
          )
      );
    };

    transaction.onabort = () => {
      database.close();

      reject(
        transaction.error ||
          new Error(
            "The file deletion was cancelled."
          )
      );
    };
  });
}

export function downloadStoredFile(
  fileRecord
) {
  if (!fileRecord?.blob) {
    throw new Error(
      "The uploaded file data is missing."
    );
  }

  const mimeType =
    getFileMimeType(fileRecord);

  const fileBlob =
    fileRecord.blob instanceof Blob
      ? fileRecord.blob.slice(
          0,
          fileRecord.blob.size,
          mimeType
        )
      : new Blob([fileRecord.blob], {
          type: mimeType,
        });

  const downloadUrl =
    URL.createObjectURL(fileBlob);

  const link =
    document.createElement("a");

  link.href = downloadUrl;
  link.download =
    fileRecord.name || "download";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);
}