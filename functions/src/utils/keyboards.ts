import * as en from "../language_pack/keyboardbuttons_en.json";
import * as ua from "../language_pack/keyboardbuttons_ua.json";

const language_pack: Record<string, any> = {
  en,
  ua,
};

export const CALLBACK_ACTIONS = {
  SET_CATEGORY: "cbsc",
  SET_LANGUAGE: "cbsl",
};

export const getButton = (
  stateName: string,
  buttonName: string,
  lng: string
) => {
  const button = language_pack[lng][stateName][buttonName];

  if (!button) {
    throw new Error(
      `getButton: Wrong state or Button name [${stateName}, ${buttonName}]`
    );
  }

  return button;
};

export const getReplyKeyboard = (
  name: string,
  lng: string,
  someId?: string
) => {
  let reply_markup: any;
  const buttons = language_pack[lng];

  switch (name) {
    case "state_home":
      reply_markup = {
        keyboard: [
          [{ text: buttons.state_home.create_warn }],
          [{ text: buttons.state_home.my_warn_list }],
          [{ text: buttons.state_home.subscribe }],
          [{ text: buttons.state_home.change_language }],
        ],
      };
      break;
    case "state_create_warn":
      reply_markup = {
        force_reply: true,
        keyboard: [
          [
            {
              text: buttons.state_create_warn.combine_warn,
            },
          ],
        ],
      };
      break;
    case "state_classify_warn":
      reply_markup = {
        inline_keyboard: [
          [
            {
              text: buttons.state_classify_warn.car_road,
              callback_data: `${CALLBACK_ACTIONS.SET_CATEGORY}|car_road|${someId}`,
            },
          ],
          [
            {
              text: buttons.state_classify_warn.housing_municipal,
              callback_data: `${CALLBACK_ACTIONS.SET_CATEGORY}|housing_municipal|${someId}`,
            },
          ],
          [
            {
              text: buttons.state_classify_warn.emergency,
              callback_data: `${CALLBACK_ACTIONS.SET_CATEGORY}|emergency|${someId}`,
            },
          ],
          [
            {
              text: buttons.state_classify_warn.other,
              callback_data: `${CALLBACK_ACTIONS.SET_CATEGORY}|other|${someId}`,
            },
          ],
        ],
      };
      break;
    case "state_change_language":
      reply_markup = {
        inline_keyboard: Object.keys(buttons.state_change_language).map(
          (key) => {
            return [
              {
                text: buttons.state_change_language[key],
                callback_data: `${CALLBACK_ACTIONS.SET_LANGUAGE}|${key}|${someId}`,
              },
            ];
          }
        ),
      };
      break;
  }
  //console.log('reply_markup: ', JSON.stringify(reply_markup))

  return reply_markup;
};
