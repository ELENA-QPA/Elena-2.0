import { StorageKeysEnum } from '@/utilities/enums';
import { GetStorage, SetStorage, DeleteStorage } from './cache_entities';
import { injectable } from 'inversify';


export abstract class LocalStorageProtocol implements SetStorage, GetStorage, DeleteStorage {
  abstract set(key: StorageKeysEnum, value: object | string): void;
  abstract setArray(key: StorageKeysEnum, value: object[]): void;
  abstract get(key: StorageKeysEnum ): any;
  abstract delete(key: StorageKeysEnum ): void ;
}

@injectable()
export class LocalStorageProtocolImpl implements LocalStorageProtocol {


  set(key: StorageKeysEnum, value: object | string): void {
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem(key, JSON.stringify(value))
      } else {
        localStorage.removeItem(key)
      }
    }

  }

  setArray(key: StorageKeysEnum, value: object[]): void {
    if (typeof window !== 'undefined') {
      if (value.length !== 0) {
        localStorage.setItem(key, JSON.stringify(value))
      } else {
        localStorage.removeItem(key)
      }
    }

  }

  get(key: StorageKeysEnum ): any {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(key);
      if (value === '' || value === null || value === undefined) return null;

      return JSON.parse(localStorage.getItem(key) ?? '');
    }
    else return null;
  }

  delete(key: StorageKeysEnum ): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }

  }
}