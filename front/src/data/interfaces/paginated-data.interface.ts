export interface IPaginatedData<T> {
    totalPages: number;
    totalCount: number;
    data: T[];
}