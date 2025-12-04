export enum State {
    NO_SOLICITADO = 'NO SOLICITADO',
    SOLICITADO = 'SOLICITADO',
    GENERADO = 'GENERADO'

}

export class PlainFile {
    state: State = State.NO_SOLICITADO; // Asigna 'no' como valor por defecto para 'state'
    createdAt: Date;
}
