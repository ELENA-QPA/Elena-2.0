export const sleep = (seconds: number = 0): Promise<boolean> => {

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, seconds * 1000);
    });
  
  }