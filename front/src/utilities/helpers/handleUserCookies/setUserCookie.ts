'use client'

import {setCookie} from "cookies-next";
import { CookiesKeysEnum } from "../../enums";

export const setUserCookies = (user:any) => {
  const userEncoded = Buffer.from(JSON.stringify(user)).toString('base64'); // Convertir a Base64
  setCookie(CookiesKeysEnum.user,userEncoded);
}