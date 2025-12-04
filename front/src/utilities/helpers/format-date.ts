export const formatDate = (dataISO: string): string => {
    const mesesPortugues = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const data = new Date(dataISO);

    const dia = data.getDate();
    const mes = mesesPortugues[data.getMonth()];
    const ano = data.getFullYear();

    let horas = data.getHours();
    const minutos = data.getMinutes().toString().padStart(2, '0');
    const ampm = horas >= 12 ? 'PM' : 'AM';

    horas = horas % 12;
    horas = horas ? horas : 12; // convierte 0 en 12

    return `${dia} de ${mes}, ${ano}, ${horas}:${minutos} ${ampm}`;
}


export const formatDate2 = (dataISO: string): string => {
    const data = new Date(dataISO);

    const dia = (data.getDate()+ 1).toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0'); // Los meses van de 0 a 11
    const ano = data.getFullYear();

    return `${dia}/${mes}/${ano}`;
}


// utils/formatDate.ts
export function formatDateDB(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Mes comienza desde 0, así que se suma 1
    const day = date.getDate().toString().padStart(2, '0');
  
    return `${year}-${month}-${day}`;
  }
  