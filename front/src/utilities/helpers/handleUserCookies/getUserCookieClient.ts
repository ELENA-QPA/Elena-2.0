'use client'

import { IUser } from "@/data/interfaces/user.interface";
import { getCookie } from "cookies-next";

export const getUserCookiesClient =()=> {

  const userCookie = getCookie('user') || null;
  console.log('Rol User:',userCookie)

  let user: IUser | null = null;
  if (userCookie) {
    const decoded = Buffer.from(userCookie, 'base64').toString('utf-8'); // Decodificar de Base64
    return user = JSON.parse(decoded); // Convertir de JSON a objeto
  }

}