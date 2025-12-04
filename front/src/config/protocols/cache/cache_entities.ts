import { StorageKeysEnum } from "@/utilities/enums"

export interface GetStorage {
    get: (key: StorageKeysEnum) => any
}


export interface SetStorage {
    set: (key: StorageKeysEnum, value: object) => void
}


export interface DeleteStorage {
    delete: (key: StorageKeysEnum) => void
}