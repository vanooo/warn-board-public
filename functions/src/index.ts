import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp(functions.config().firebase);

/**
 * config bot
 */

import TelegramBot from "./utils/TelegramBot";

const telegram = new TelegramBot(
  functions.config().service.telegram_token,
  admin.firestore(),
  admin.storage()
);

/**
 * saving all messages here
 */
export const warnBoardTelegramBotMessages = functions.https.onRequest(
  async (req: any, res: any) => {
    try {
      const body = req.body;

      /**
       * sending typing_resp to the user
       */
      telegram.typing_resp(telegram.getChatId(body));

      // console.log('appMessagesWatcher - base64Image: ', base64Image);
      /**
       * filter query messages
       * for inline bot
       */
      if (
        body &&
        body.inline_query &&
        body.inline_query.query &&
        body.inline_query.query.length > 2
      ) {
        /**
         * make request to the db
         */
        // const results = await search_plate_by_text(store, body.inline_query.query, body.inline_query.location);
        // console.log('results: ', results);
        // if (results) {
        // await answerInlineQuery(body.inline_query.id, results);
        // }
      }

      /**
       * run bot instanlty
       */

      /**
       * it is not an inline query - save message
       */

      const bodyToSave: any = telegram.convertReplyMarkUP(body);
      // /**
      //  * save message to the DB
      //  */

      await telegram.go(bodyToSave);

      // await admin.firestore()
      //     .collection("telegram_messages")
      //     .add(bodyToSave);

      return res.status(200).send("ok");
    } catch (err) {
      console.log("ERROR - warnBoardTelegramBotMessages: ", err);
      // await notifyTelegramChannel(ADMIN_USER_ID, err.message);

      return res.status(200).send("ok");
    }
  }
);

/**
 * reacting to the saved messages
 * */
// export const appMessagesWatcher = functions.firestore
//     .document("telegram_messages/{collectionID}")
//     .onCreate(async (snap: { data: () => any }, context: any) => {
//         try {
//             // const body = await snap.data();
//             // await telegram.go(body)

//             // Instantiates a client. If you don't specify credentials when constructing
//             // the client, the client library will look for credentials in the
//             // environment.
//             // const storage = new Storage();

//             // storage.
//             // Makes an authenticated API request.
//             // async function listBuckets() {
//             //     try {
//             //         const results = await storage.getBuckets();

//             //         const [buckets] = results;

//             //         console.log('Buckets:');
//             //         buckets.forEach((bucket: any) => {
//             //             console.log(bucket.name);
//             //         });
//             //     } catch (err) {
//             //         console.error('ERROR:', err);
//             //     }
//             // }
//             // await listBuckets();
//             await telegram.getBase64File('AgACAgIAAxkBAAICMl8J7tCJfweB0XFMsqHq_1OPD1-rAALarjEbtQJRSBStXzQQ4eYROPDpki4AAwEAAwIAA3kAAzmoAwABGgQ');
//             // console.log('appMessagesWatcher - base64Image: ', base64Image);
//         } catch (err) {
//             console.error("ERROR - appMessagesWatcher: ", err);
//         }
//     });
