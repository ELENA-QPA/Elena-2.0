'use server'

import { IUser } from "@/data/interfaces/user.interface";
import { cookies } from "next/headers";

export const getUserCookiesServer =async () => {


    const cookieStore = cookies();
    const userCookie = (await cookieStore).get('user')?.value || null;

    let user: IUser | null = null;
    if (userCookie) {
        const decoded = Buffer.from(userCookie, 'base64').toString('utf-8'); // Decodificar de Base64
        user = JSON.parse(decoded); // Convertir de JSON a objeto
        // console.log('User Mid:',user);
        return user;
      }

}