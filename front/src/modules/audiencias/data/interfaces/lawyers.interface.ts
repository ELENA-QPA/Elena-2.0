
export interface Lawyer {
    _id: string;
    name: string;
}
    
export interface Lawyers {
    [key: string]: Lawyer;
}