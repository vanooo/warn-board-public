const fetch = require("node-fetch");
const qs = require("querystring");

import * as functions from "firebase-functions";
import { Firestore, Timestamp } from "@google-cloud/firestore";
import {
  createUserIfNeeded,
  uploadFileToStorageHelper,
  downloadFile,
} from "./helpers";

import * as en from "../language_pack/resp_message_en.json";
import * as ua from "../language_pack/resp_message_ua.json";

const TELEGRAM_ADMIN = functions.config().service.telegram_admin_id;

const lg_messages_pack: Record<string, any> = {
  en,
  ua,
};

import { getButton, getReplyKeyboard, CALLBACK_ACTIONS } from "./keyboards";
import { User } from "./interfaces";
import admin = require("firebase-admin");

export default class Telegram {
  api_url = "https://api.telegram.org";
  tocken: string;
  private store: Firestore;
  private storage: admin.storage.Storage;

  constructor(
    tocken: string = "",
    store: Firestore,
    storage: admin.storage.Storage
  ) {
    if (!tocken) {
      throw new Error("tocken is empty");
    }
    this.tocken = `bot${tocken}`;
    this.store = store;
    this.storage = storage;
  }

  setHook(url: string) {
    const params = qs.stringify({
      url,
    });
    const str = `${this.api_url}/${this.tocken}/setWebhook?${params}`;

    fetch(str)
      .then((rez: any) => {
        //console.log(JSON.stringify(rez));
        this.sendMessage(TELEGRAM_ADMIN, "rebooted");
      })
      .catch((error: any) => {
        console.log(error.message);
      });
  }

  sendMessage(chat_id: string, text: string, reply_markup?: any) {
    const params: any = {
      chat_id,
      parse_mode: "HTML",
      reply_markup: reply_markup
        ? JSON.stringify(reply_markup)
        : JSON.stringify({ remove_keyboard: true }),
    };

    if (text) {
      params.text = text;
    }

    // if (!reply_markup) {
    //     params = {
    //         ...params,
    //         reply_markup: { remove_keyboard: True }
    //     };
    // }

    const reply = `${this.api_url}/${this.tocken}/sendmessage?${qs.stringify(
      params
    )}`;

    //console.log("reply", reply);

    fetch(reply, { method: "POST" })
      .then(
        (rez: any) =>
          //console.log("sendMessage - rez: ", JSON.stringify(rez))
          null
      )
      .catch((error: any) =>
        console.log("sendMessage - error: ", error.message)
      );
  }

  convertReplyMarkUP = (body: any) => {
    const reply_markup_exist = JSON.stringify(body).indexOf("reply_markup");

    if (reply_markup_exist !== -1) {
      switch (true) {
        case "callback_query" in body:
          body.callback_query.message.reply_markup = JSON.stringify(
            body.callback_query.message.reply_markup
          );
          break;
        case "message" in body:
          body.message.reply_markup = JSON.stringify(body.message.reply_markup);
          break;
        case "edited_message" in body:
          body.edited_message.reply_to_message.reply_markup = JSON.stringify(
            body.edited_message.reply_to_message.reply_markup
          );
          break;
        default:
          throw new Error(
            `convertReplyMarkUP - UNsupported case ${JSON.stringify(body)}`
          );
      }
    }
    return body;
  };

  getChatId(body: any) {
    let chatId;

    switch (true) {
      case "callback_query" in body:
        chatId = body.callback_query.message.chat.id;
        break;
      case "message" in body:
        chatId = body.message.chat.id;
        break;
      case "edited_message" in body:
        chatId = body.edited_message.message.chat.id;
        break;
      default:
        chatId = null;
        break;
    }

    if (!chatId) {
      throw new Error(
        `getChatId: can't get chatId out of ${JSON.stringify(body)}`
      );
    }

    return chatId;

    // const chat_id_array = Object.entries(body).map((item) => {
    //     if (typeof item[1] === 'object') {
    //         /**
    //          * detecting object and searching inside for chat object
    //          * */
    //         const object: any = item[1];
    //         if (object.chat && object.chat.id) {
    //             return object.chat.id
    //         } else {
    //             return null
    //         }
    //     } else {
    //         return null
    //     }
    // }).filter(Boolean);

    // if (!chat_id_array.length) {
    //     throw new Error(`getChatId: can't get chatId out of ${JSON.stringify(body)}`)
    // }

    // return chat_id_array[0];
  }

  getMessageType(body: any) {
    /**
     * todo:
     * list possible values:
     *
     * message
     * callback_query
     * edited_message
     * ....
     *
     */
    const message_type_array = Object.entries(body)
      .map((item) => {
        if (typeof item[1] === "object") {
          /**
           * detecting object and taking its name
           * */
          return item[0];
        } else {
          return null;
        }
      })
      .filter(Boolean);

    if (!message_type_array.length) {
      throw new Error(
        `getMessageType: can't get type out of ${JSON.stringify(body)}`
      );
    }

    return message_type_array[0];
  }

  getUserObject(body: any) {
    let userObject;

    switch (true) {
      case "callback_query" in body:
        userObject = body.callback_query.message.from;
        break;
      case "message" in body:
        userObject = body.message.from;
        break;
      case "edited_message" in body:
        userObject = body.edited_message.message.from;
        break;
      default:
        userObject = null;
        break;
    }

    if (!userObject) {
      throw new Error(
        `getUserObject: can't get userObject out of ${JSON.stringify(body)}`
      );
    }

    return userObject;
  }

  typing_resp(chat_id: number | string) {
    const params = {
      chat_id,
      action: "typing",
    };

    const reply = `${this.api_url}/${this.tocken}/sendChatAction?${qs.stringify(
      params
    )}`;

    fetch(reply, { method: "POST" })
      // .then((rez: any) => console.log('sendMessage - rez: ', JSON.stringify(rez)))
      .catch((error: any) =>
        console.log("typing_resp - error: ", error.message)
      );
  }

  async uploadFileToStorage(fileId: string) {
    try {
      const url = `${this.api_url}/${this.tocken}/getFile?file_id=${fileId}`;
      /**
       *
       */
      const telegramFileResp = await fetch(url);
      const { result } = await telegramFileResp.json();
      if (!result) {
        throw new Error(`uploadFileToStorage - can't get json`);
        /**
         * todo - check the file size
         */
        // file_size
      }

      const tempFilePath = await downloadFile(
        `https://api.telegram.org/file/${this.tocken}/${result.file_path}`
      );

      return await uploadFileToStorageHelper(tempFilePath, this.storage);
    } catch (error) {
      throw new Error(`uploadFileToStorage: ${error.message}`);
    }
  }

  async go(body: any) {
    // const chatId = this.getChatId(body)
    // const messageType = this.getMessageType(body);

    const userObject: User = this.getUserObject(body);

    // console.log('userObject', JSON.stringify(userObject));

    const user: User = await createUserIfNeeded(this.store, userObject);

    /**
     * detect state
     * read a message and respond with a state name
     * */
    await this.detectState(body, user);
    /**
     * process state
     * based on the state detection
     *
     */
  }

  async detectState(body: any, user: User) {
    try {
      const { state } = user;
      const messageType = this.getMessageType(body);

      if (!messageType) {
        throw new Error(`messageType @detectState is: ${messageType}`);
      }
      /**
       *
       * detecting whether we are in creation mode
       * baseed on USER STATE
       *
       */
      // console.log('user ', JSON.stringify(user));
      // console.log('state ', state);

      if (state.includes("state_create_warn")) {
        //console.log("state_create_warn");

        const warnId = state.split("|").pop();

        if (!warnId) {
          throw new Error("Cand find WARN ID in users State");
        }

        await this.detectStateCreateWarn(messageType, body, user, warnId);
      } else {
        //console.log("------ we are NOT in creation MODE -------");

        /**
         * if we are NOT in creation MODE
         */
        await this.detectStateIsNotWarnCreation(messageType, body, user);
      }
    } catch (error) {
      this.sendMessage(TELEGRAM_ADMIN, error.message);
    }
  }

  async detectStateCreateWarn(
    messageType: string,
    body: any,
    user: User,
    warnId: string
  ) {
    const { language_code } = user;

    switch (messageType) {
      case "message":
        /**
         * it is a simple message,
         * not a reply or callback
         */
        switch (true) {
          case "text" in body.message:
            //console.log("text: ", JSON.stringify(body.message));

            const { text: textContent } = body.message;
            //console.log("textContent", textContent);

            /** some issue here!!!!!  */

            if (
              textContent === "/combine_warn" ||
              textContent ===
                getButton("state_create_warn", "combine_warn", language_code)
            ) {
              this.stateCombineWarn(body, user, language_code);
            } else {
              const descriptions = () => {
                const { message_id, text, date } = body.message;
                const obj = {
                  [message_id]: {
                    //name from message_id
                    message_id,
                    text,
                    date,
                  },
                };
                return obj;
              };

              this.addContentToWarn(body, warnId, language_code, {
                descriptions: descriptions(),
              });
            }

            break;
          case "photo" in body.message:
            //console.log("photo: ", JSON.stringify(body.message));

            this.addContentToWarn(body, warnId, language_code, {
              photos: await this.getPhotosTelegramArray(body),
            });
            break;

          case "location" in body.message:
            //console.log("location: ", JSON.stringify(body.location));
            const locations = () => {
              const { message_id, location, date } = body.message;
              const obj = {
                [message_id]: {
                  //name from message_id
                  message_id,
                  location,
                  date,
                },
              };
              return obj;
            };

            this.addContentToWarn(body, warnId, language_code, {
              locations: locations(),
            });
            break;
          default:
            this.errorMessage(body, language_code, "error_unsupported_content");
            //console.log("default: ", JSON.stringify(body));
            break;
        }

        break;
      default:
        //console.log("default: ", JSON.stringify(body));
        break;
    }
  }

  async detectStateIsNotWarnCreation(
    messageType: string,
    body: any,
    user: User
  ) {
    const { language_code } = user;
    const chatId = this.getChatId(body);

    switch (messageType) {
      case "message":
        const { text } = body.message;

        switch (text) {
          case getButton("state_home", "create_warn", language_code):
            /**
             * Create WARN state
             */

            this.stateCreateWarn(user, body, language_code);
            break;

          case getButton("state_home", "change_language", language_code):
            /**
             * Create WARN state
             */

            this.stateChangeLanguage(user, body, language_code);
            break;

          case "/start": // or other message?
            /**
             * HOME state
             */

            const reply_text = lg_messages_pack[language_code]["state_home"];
            const reply_markup = getReplyKeyboard("state_home", language_code);
            this.sendMessage(chatId, reply_text, reply_markup);
            break;
          default:
            this.sendMessage(
              chatId,
              lg_messages_pack[language_code]["error_state_not_recognised"],
              getReplyKeyboard("state_home", language_code)
            );
            break;
        }

        break;
      case "callback_query":
        //console.log("callback_query: ", JSON.stringify(body));

        const [action, ...params] = body.callback_query.data.split("|");

        if (!action || !params) {
          throw new Error(
            `cant get data from callback_query: action: ${action}, params: ${JSON.stringify(
              params
            )}`
          );
        }

        switch (true) {
          /**
           * here we can set up all CALLBACK functionality
           */

          case action === CALLBACK_ACTIONS.SET_CATEGORY:
            this.classifyWarn(body, params[0], params[1]);
            break;
          case action === CALLBACK_ACTIONS.SET_LANGUAGE:
            this.setUserLanguage(body, params[0], params[1]);
            break;
          default:
            throw new Error(
              `defauilt in callback_query ${JSON.stringify(body)}`
            );
        }
        break;

      default:
        this.sendMessage(chatId, `default ${language_code}`);
        break;
    }
  }

  async getPhotosTelegramArray(body: any) {
    const { message_id, photo, date } = body.message;

    /**
         * for each photo - run
         * await telegram.uploadFileToStorage();
         * and store url
         * 
             photo = [
                 {file_id}
             ]
         */

    const newPhotoArray = await Promise.all(
      photo.map(async (item: any) => {
        return {
          ...item,
          storage_url: await this.uploadFileToStorage(item.file_id),
        };
      })
    );

    const obj = {
      [message_id]: {
        //name from message_id
        message_id,
        photo: newPhotoArray,
        date,
      },
    };
    return obj;
  }

  classifyWarn(body: any, category: string, warnId: string) {
    this.store
      .collection("warns")
      .doc(String(warnId))
      .set(
        {
          category: category,
        },
        { merge: true }
      )
      .then(() => {
        /**
         * update message content:
         * remove buttons and add category
         */
        this.sendMessage(this.getChatId(body), `category: ${category}`);
      })
      .catch((error: any) => {
        throw new Error(`classifyWarn: ${error.message}`);
      });
  }

  stateCombineWarn(body: any, user: User, language_code: string) {
    /**
     * logic to combine - create warn
     *
     * change user state "free"
     * send a message, - link?
     * send it with inline keyboard - classify:
     * []
     * send it with an empty keyboard?
     */
    const { state, document_id } = user;
    const warnId = state.split("|").pop();
    //console.log("warnId: ", warnId);
    this.store
      .collection("users")
      .doc(document_id)
      .set(
        {
          state: "free",
        },
        { merge: true }
      )
      .then(() => {
        this.sendMessage(
          this.getChatId(body),
          `created \nWARN_ID \n${warnId}`,
          getReplyKeyboard("state_classify_warn", language_code, warnId)
        );
      })
      .catch((error: any) => {
        throw new Error(`stateCombineWarn: ${error.message}`);
      });
  }

  addContentToWarn(
    body: any,
    warnId: string,
    language_code: string,
    objectToAdd: any
  ) {
    //console.log("objectToAdd: ", JSON.stringify(objectToAdd));

    this.store
      .collection("warns")
      .doc(warnId)
      .set(
        {
          language_code,
          ...objectToAdd,
        },
        { merge: true }
      )
      .then((res) => {
        //console.log("content was added ", JSON.stringify(res));
        this.sendMessage(
          this.getChatId(body),
          "",
          getReplyKeyboard("state_create_warn", language_code)
        );
      })
      .catch((error: any) => {
        throw new Error(`addContentToWarn, ${error.message}`);
      });
  }

  errorMessage(body: any, language_code: string, name: string) {
    const text = lg_messages_pack[language_code][name];
    const chatId = this.getChatId(body);
    this.sendMessage(chatId, text);
  }

  stateCreateWarn(user: User, body: any, language_code: string) {
    /**
     * create WARN
     * get WARN id
     * set user to state create_warn|WARN_id
     * send classification in message
     * send location in keyboard
     */

    const { state, ...userInfo } = user;
    const chatId = this.getChatId(body);

    this.store
      .collection("warns")
      .add({
        created: Timestamp.now(),
        user: userInfo,
      })
      .then((resp) => {
        this.store
          .collection("users")
          .doc(String(user.document_id))
          .set(
            {
              state: `state_create_warn|${resp.id}`,
            },
            { merge: true }
          )
          .then(() => {
            const text = `${resp.id} - ${lg_messages_pack[language_code].state_create_warn}`;
            const reply_markup = getReplyKeyboard(
              "state_create_warn",
              language_code
            );

            this.sendMessage(chatId, text, reply_markup);
          })
          .catch((error: any) => {
            throw new Error(error.message);
          });
      })
      .catch((error: any) => {
        throw new error(error.message);
      });
  }

  stateChangeLanguage(user: User, body: any, language_code: string) {
    /**
     * create WARN
     * get WARN id
     * set user to state create_warn|WARN_id
     * send classification in message
     * send location in keyboard
     */
    const { document_id } = user;
    const chatId = this.getChatId(body);

    const reply_markup = getReplyKeyboard(
      "state_change_language",
      language_code,
      document_id
    );
    const text = lg_messages_pack[language_code].state_change_language;
    this.sendMessage(chatId, text, reply_markup);
  }
  setUserLanguage(body: any, language_code: string, userDocumentId: string) {
    const chatId = this.getChatId(body);
    this.store
      .collection("users")
      .doc(userDocumentId)
      .set(
        {
          language_code,
        },
        { merge: true }
      )
      .then(() => {
        this.sendMessage(
          chatId,
          lg_messages_pack[language_code].state_language_was_changed,
          getReplyKeyboard("state_home", language_code)
        );
      })
      .catch((error: any) => {
        throw new error(error.message);
      });
  }
}
