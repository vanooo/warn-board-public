import { Firestore, QuerySnapshot } from "@google-cloud/firestore";
import { User } from "./interfaces";
import admin = require("firebase-admin");
const os = require("os");
const fs = require("fs");
const fetch = require("node-fetch");

export const createUserIfNeeded = (store: Firestore, userObject: any) => {
  return store
    .collection("users")
    .where("id", "==", Number(userObject.id))
    .where("messenger", "==", "telegram")
    .get()
    .then(async (usersSnapshot: QuerySnapshot) => {
      if (usersSnapshot.empty) {
        const userData: User = {
          language_code: "ua", // default will be overwritten if userObject contains this value
          ...userObject,
          state: "free",
          messenger: "telegram",
        };

        return store
          .collection("users")
          .add(userData)
          .then((resp) => {
            //console.log("new user: ", resp.id);
            return {
              ...userData,
              language_code: "ua",
              document_id: resp.id,
            };
          })
          .catch((error) => {
            console.log("createUserIfNeeded user add error");
            throw new Error("createUserIfNeeded: user add error");
          });
      } else {
        const userData = usersSnapshot.docs[0].data() as User;
        // const userData: User = name
        //console.log("userData", userData);
        return {
          ...userData,
          document_id: usersSnapshot.docs[0].id,
        };
      }
    })
    .catch((error) => {
      console.log("createUserIfNeeded: ", error.message);
      throw new Error("createUserIfNeeded: user add error");
    });
};

export const resultHandler = (err: any) => {
  if (err) {
    console.log("unlink failed", err);
  } else {
    console.log("file deleted");
  }
};

export const uploadFileToStorageHelper = async (
  tempFilePath: string,
  storage: admin.storage.Storage
): Promise<any> => {
  const bucket = storage.bucket();
  const filename: string = tempFilePath.split("/").pop() as string;

  if (!filename) {
    throw new Error(
      `uploadFileToStorage can't create a filename from url: ${tempFilePath}`
    );
  }

  // const filePath = `images/${filename}`;
  const filePath = `images/${Date.now()}-${filename}`;

  try {
    await bucket.upload(tempFilePath, {
      destination: filePath,
    }); // uploading tempFilePath

    await fs.unlink(tempFilePath, resultHandler);
    return filePath;
  } catch (error) {
    console.log(`bucket.upload: ${error}`);
    await fs.unlink(tempFilePath, resultHandler);
  }
};

export const downloadFile = async (url: string) => {
  const tempFilePath: string = `${os.tmpdir()}/${url.split("/").pop()}`;

  //console.log("tempFilePath: ", tempFilePath);

  const res = await fetch(url);
  if (!res) {
    throw new Error("downloadFile - res is empty");
  }

  const fileStream = fs.createWriteStream(tempFilePath);

  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", (err: any) => {
      //console.log("downloadFile - error: ", err);
      reject(err);
    });
    fileStream.on("finish", function () {
      resolve();
    });
  });

  return tempFilePath;
};
