export function areObjectsDifferent<T extends object, U extends object>(obj1: T, obj2: U): boolean {
    const obj1Keys = Object.keys(obj1) as Array<keyof T>;
    const obj2Keys = Object.keys(obj2) as Array<keyof U>;
  
    // Verificar si tienen diferente número de claves
    if (obj1Keys.length !== obj2Keys.length) {
      return true;
    }
  
    // Comparar cada clave y su valor
    for (const key of obj1Keys) {
      // Comprobar si obj2 tiene la misma clave (y verificar que la clave sea correcta)
      if (!(key in obj2)) {
        return true;
      }
  
      // Comparar los valores de las claves
      const value1 = obj1[key];
      const value2 = (obj2 as Record<keyof T, unknown>)[key];
  
      if (value1 !== value2) {
        return true;
      }
    }
  
    return false; // Si no se encontraron diferencias, los objetos son iguales
  }
  