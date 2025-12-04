'use client'

import { IUser } from "@/data/interfaces/user.interface";
import { getCookie } from "cookies-next";

export const getUserCookies = (size: 'client' | 'server') => {

    const userCookie = getCookie('user') || null


    let user: IUser | null = null;

    if (userCookie) {
        const decoded = Buffer.from(userCookie, 'base64').toString('utf-8'); // Decodificar de Base64
        return user = JSON.parse(decoded); // Convertir de JSON a objeto
    } else {
        return null;
    }

}