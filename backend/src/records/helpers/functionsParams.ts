// import { Record } from "../entities/record.entity";

// export interface IParamFunc {
//     requerimiento: any,
//     volumen: any,
//     conPurga?: any
// }
// export interface IParamNumeric {
//     requerimiento: number,
//     volumen: number,
// }

// // export const tipoPrescripcion:string='Por volúmenes';
// export const tipoPrescripcion: string = 'Por requerimientos';
// //////////////////////////////FORMULACIONES//////////////
// export const correccionPurga = (prescription: Record) => {

//     const volTotalNPT: number = prescription?.volumen;
//     const purga: number = prescription?.overfill;
//     const correccion: number = ((volTotalNPT + purga) / volTotalNPT) ? ((volTotalNPT + purga) / volTotalNPT) : 1

//     //   console.log('Overfill:', correccion)
//     return correccion;

// }

// export const getSodio = (prescription: Record) => {

//     const tp: string = prescription?.clientType!;
//     const sodio: number = parseFloat(prescription?.sodio_total!);
//     const peso: number = prescription?.peso!;

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     if (tp === tipoPrescripcion) {
//         params.volumen = sodio * peso / 2;
//         params.conPurga = params.volumen * correccionPurga(prescription);
//         params.requerimiento = sodio

//     } else {
//         params.volumen = sodio
//         params.conPurga = params.volumen * correccionPurga(prescription);
//         params.requerimiento = sodio * 2 / peso;
//     }


//     return params.conPurga;
// }

// export const getSodioTotal = (prescription: Record) => {

//     const peso: number = prescription?.peso!;

//     const sodioTotal: number = ((getFosfatoSodio(prescription).volumen * 2)
//         + (getSodio(prescription).volumen * 2)) / peso
//     return sodioTotal;
// }


// export const getPotacio = (prescription: Record) => {

//     const tp: string = prescription?.clientType!;
//     const potacio: number = parseFloat(prescription?.potasio_total!);
//     const peso: number = prescription?.peso!;

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     if (tp === tipoPrescripcion) {
//         params.volumen = potacio * peso / 2;
//         params.requerimiento = potacio
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     } else {
//         params.volumen = potacio
//         params.requerimiento = potacio * 2 / peso;
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     }

//     // console.log('Cloruro Potasio:',params,correccionPurga(prescription))
//     return params.conPurga;
// }

// export const getPotacioTotal = (prescription: Record) => {

//     const peso: number = prescription?.peso!;

//     const potasioTotal: number = ((getFosfatoPotacio(prescription).volumen * 3.8)
//         + (getPotacio(prescription).volumen * 2)) / peso

//     return potasioTotal;
// }

// export const getCalcio = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const tp: string = prescription?.clientType!;
//     const calcio: number = parseFloat(prescription?.req_calcio!);
//     const tCalcio: string = prescription?.calcio!;
//     const peso: number = prescription?.peso!;

//     if (tp === tipoPrescripcion) {
//         if (tCalcio === 'Gluconato de Calcio') {

//             params.volumen = calcio * peso * 0.01;
//             params.requerimiento = calcio
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         } else {
//             params.volumen = calcio * peso * 2.15;
//             params.requerimiento = calcio
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         }
//     } else {

//         if (tCalcio === 'Gluconato de Calcio') {
//             params.requerimiento = calcio * 100 / peso;
//             params.volumen = calcio
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         } else {
//             params.requerimiento = calcio * 0.465 / peso;
//             params.volumen = calcio
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         }
//     }

//     return params.conPurga;
// }

// export const getFosfatoSodio = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const tp: string = prescription?.clientType!;
//     const fosforo: number = parseFloat(prescription?.req_fosfato!);
//     const tipofosfato: string = prescription?.fosfato!;
//     const peso: number = prescription?.peso!;

//     if (tipofosfato === 'Fosfato de sodio')
//         if (tp === tipoPrescripcion) {
//             params.volumen = fosforo * 1 * peso;
//             params.requerimiento = fosforo;
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         } else {
//             params.requerimiento = fosforo * 1 / peso;
//             params.volumen = fosforo
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         }
//     return params.conPurga;
// }


// export const getFosfatoPotacio = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const tp: string = prescription?.clientType!;
//     const fosforo: number = parseFloat(prescription?.req_fosfato!);
//     const tipofosfato: string = prescription?.fosfato!;
//     const peso: number = prescription?.peso!;

//     if (tipofosfato === 'Fosfato de potasio')
//         if (tp === tipoPrescripcion) {
//             params.volumen = fosforo * peso / 2.6;
//             params.requerimiento = fosforo
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         } else {
//             params.requerimiento = fosforo * 2.6 / peso;
//             params.volumen = fosforo
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         }

//     return params.conPurga;
// }


// // export const getAportesFosfato = (prescription: Prescription) => {

// //     const tipofosfato: string = prescription?.fosfato!;
// //     const aportes: Aportes = aportesNew;

// //     if (tipofosfato === 'Fosfato de sodio') {
// //         aportes.a_sodio = getFosfatoSodio(prescription).requerimiento * 2 / 1
// //         aportes.a_potacio = 0
// //         aportes.a_magnesio = 0
// //         aportes.a_fosforo = 0
// //         aportes.a_cloruro = 0
// //     } else {
// //         aportes.a_sodio = 0
// //         aportes.a_potacio = getFosfatoPotacio(prescription).requerimiento * 3.8 / 1
// //         aportes.a_magnesio = 0
// //         aportes.a_fosforo = 0
// //         aportes.a_cloruro = 0
// //     }
// //     return aportes;
// // }

// export const getFosforo = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.volumen = getFosfatoPotacio(prescription).volumen + getFosfatoSodio(prescription).volumen;
//     params.requerimiento = getFosfatoPotacio(prescription).requerimiento + getFosfatoSodio(prescription).requerimiento;
//     params.conPurga = getFosfatoPotacio(prescription).conPurga + getFosfatoSodio(prescription).conPurga;

//     return params;
// }

// export const getMagnesio = (prescription: Record) => {

//     const tp: string = prescription?.clientType!;
//     const magnesio: number = parseFloat(prescription?.req_magnesio!);
//     // const magnesio: number = parseInt(prescription?.req_magnesio!);
//     const peso: number = prescription?.peso!;

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     if (tp === tipoPrescripcion) {
//         params.volumen = magnesio * peso / 200;
//         params.requerimiento = magnesio
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     } else {
//         params.requerimiento = magnesio * 200 / peso;
//         params.volumen = magnesio
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     }
//     return params.conPurga;
// }


// export const getVit_C = (prescription: Record) => {

//     const vitC: string = prescription?.vit_C!;
//     const tp: string = prescription?.clientType!;

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };


//     if (tp === tipoPrescripcion) {
//         params.volumen = parseFloat(vitC) / 100
//         params.requerimiento = parseFloat(vitC);
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     } else {
//         params.volumen = parseFloat(vitC);
//         params.requerimiento = parseFloat(vitC) * 100
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     }
//     return params.conPurga;
// }

// export const getDextrosa = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const tp: string = prescription?.clientType!;
//     const dextrosa: number = parseFloat(prescription?.dextrosa!);
//     const flujoMetabolico: number = parseFloat(prescription?.flujo_metabolico!);
//     const peso: number = prescription?.peso!;
//     const tiempoInfusion: number = prescription?.tiempo_infusion!;

//     if (tp === tipoPrescripcion) {
//         params.requerimiento = dextrosa
//         params.volumen = flujoMetabolico * peso * tiempoInfusion * 0.12;
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     } else {
//         params.requerimiento = dextrosa / (peso * tiempoInfusion * 0.12);
//         params.volumen = dextrosa
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     }
//     // console.log('Flujo Metabolico Vol:', params.volumen,'Flujo Metabolico Req:',params.requerimiento)
//     // console.log('Dextrosa Vol:', params.volumen,'Dextrosa Req:',params.requerimiento)

//     return params.conPurga;
// }

// export const getFlujoMetabolico = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const tp: string = prescription?.clientType!;
//     const dextrosa: number = parseFloat(prescription?.dextrosa!);
//     const flujoMetabolico: number = parseFloat(prescription?.flujo_metabolico!);
//     const peso: number = prescription?.peso!;
//     const tiempoInfusion: number = prescription?.tiempo_infusion!;

//     if (tp === tipoPrescripcion) {
//         params.volumen = flujoMetabolico * peso * tiempoInfusion * 0.12;
//         params.requerimiento = flujoMetabolico
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     } else {
//         params.requerimiento = dextrosa / (peso * tiempoInfusion * 0.12);
//         params.volumen = dextrosa
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     }
//     // console.log('Flujo Metabolico Vol:', params.volumen,'Flujo Metabolico Req:',params.requerimiento)
//     // console.log('Dextrosa Vol:', params.volumen,'Dextrosa Req:',params.requerimiento)

//     return params;
// }


// export const concAminoacidos = (prescription: Record) => {

//     const tipoAminoacidos: string = prescription?.aminoacidos!;
//     let concSinAminoacidos: number = 0;
//     // const tipoPaciente: string = prescription?.tipo_paciente!;

//     if (tipoAminoacidos === 'Aminoven 15% SE') { concSinAminoacidos = 0.15 }
//     if (tipoAminoacidos === 'TravasolPlus 15% SE') { concSinAminoacidos = 0.15 }
//     if (tipoAminoacidos === 'Aminoplasmal 10% SE') { concSinAminoacidos = 0.1 }
//     if (tipoAminoacidos === 'Aminoplasmal 10% CE') { concSinAminoacidos = 0.1 }
//     if (tipoAminoacidos === 'Aminoven Inft 10% SE') { concSinAminoacidos = 0.1 }
//     if (tipoAminoacidos === 'Primene 10% SE') { concSinAminoacidos = 0.1 }
//     // if (tipoAminoacidos === 'Aminosteril') { concSinAminoacidos = 0.08 }
//     // if (tipoAminoacidos === 'Trophamine') { concSinAminoacidos = 1 }

//     return concSinAminoacidos;
// }

// export const getAminoacidos = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const tp: string = prescription?.clientType!;
//     const aminoacidos: number = parseFloat(prescription?.req_aminoacidos!);
//     const peso: number = prescription?.peso!;
//     const concSinAminoacidos = concAminoacidos(prescription);

//     if (tp === tipoPrescripcion) {
//         params.volumen = aminoacidos * peso / concSinAminoacidos;
//         params.requerimiento = aminoacidos
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     } else {
//         params.requerimiento = aminoacidos * concSinAminoacidos / peso;
//         params.volumen = aminoacidos
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     }


//     return params.conPurga;
// }

// // export const getAportesAminoacidos = (prescription: Prescription) => {

// //     const tipoAminoacidos: string = prescription?.aminoacidos!;
// //     const peso: number = prescription?.peso!;
// //     const aportes: Aportes = aportesNew;

// //     if (tipoAminoacidos === 'Aminoplasmal 10% CE') {
// //         aportes.a_sodio = getAminoacidos(prescription).volumen * 0.05 / peso
// //         aportes.a_potacio = getAminoacidos(prescription).volumen * 0.025 / peso
// //         aportes.a_magnesio = getAminoacidos(prescription).volumen * 0.0025 / peso
// //         aportes.a_fosforo = getAminoacidos(prescription).volumen * 0.01 / peso
// //         aportes.a_cloruro = getAminoacidos(prescription).volumen * 0.052 / peso
// //     } else {
// //         aportes.a_sodio = 0
// //         aportes.a_potacio = 0
// //         aportes.a_magnesio = 0
// //         aportes.a_fosforo = 0
// //         aportes.a_cloruro = 0
// //     }

// //     return aportes;
// // }

// export const getLipidos = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const tp: string = prescription?.clientType!;
//     const lipidos: number = parseFloat(prescription?.req_lipidos);
//     const tipo_lipidos: string = prescription?.lipidos;
//     const concSinLipidos: number = 0.2;
//     const peso: number = prescription?.peso!;
//     const tipo_paciente: string = prescription?.tipo_paciente!;


//     const vitaLipid: number = parseFloat(prescription?.req_vit_liposolubles!);

//     const vit_lipo = prescription?.soluvit_vitalip !== '0'
//         ? parseFloat(prescription?.soluvit_vitalip!) : 0;


//     if (tipo_lipidos === 'Smoflipid 20%') {

//         if (vit_lipo !== 0) {

//             if (tp === tipoPrescripcion) {
//                 params.volumen = ((lipidos * peso * 5) - (vit_lipo / 2) - vitaLipid / 2)
//                 params.requerimiento = lipidos
//                 params.conPurga = params.volumen * correccionPurga(prescription);
//             } else {
//                 params.requerimiento = lipidos * concSinLipidos / peso;
//                 params.volumen = (lipidos)
//                 params.conPurga = params.volumen * correccionPurga(prescription);
//             }

//         } else {

//             if (tp === tipoPrescripcion) {
//                 params.volumen = ((lipidos * peso * 5) - vitaLipid / 2)
//                 params.requerimiento = lipidos
//                 params.conPurga = params.volumen * correccionPurga(prescription);
//             } else {
//                 params.requerimiento = lipidos * concSinLipidos / peso;
//                 params.volumen = (lipidos)
//                 params.conPurga = params.volumen * correccionPurga(prescription);
//             }
//         }
//     } else {

//         if (tp === tipoPrescripcion) {
//             params.volumen = (lipidos * peso * 5)
//             params.requerimiento = lipidos
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         } else {
//             params.requerimiento = lipidos * concSinLipidos / peso;
//             params.volumen = (lipidos)
//             params.conPurga = params.volumen * correccionPurga(prescription);
//         }

//     }

//     return params.conPurga;
// }


// // export const getAportesLipidos = (prescription: Prescription) => {

// //     const tipoLipidos: string = prescription?.lipidos!;
// //     const peso: number = prescription?.peso!;
// //     const aportes: Aportes = aportesNew;

// //     if (tipoLipidos === 'Clinoleic 20%') {
// //         aportes.a_sodio = 0
// //         aportes.a_potacio = 0
// //         aportes.a_magnesio = 0
// //         aportes.a_fosforo = getLipidos(prescription).volumen * 0.015 / peso
// //         aportes.a_cloruro = 0

// //     } else if (tipoLipidos === 'Lipoplus 20%') {
// //         aportes.a_sodio = getLipidos(prescription).volumen * 0.0026 / peso
// //         aportes.a_potacio = 0
// //         aportes.a_magnesio = 0
// //         aportes.a_fosforo = getLipidos(prescription).volumen * 0.0145 / peso
// //         aportes.a_cloruro = 0

// //     } else if (tipoLipidos === 'Smoflipid 20%') {

// //         aportes.a_sodio = 0
// //         aportes.a_potacio = 0
// //         aportes.a_magnesio = 0
// //         aportes.a_fosforo = getLipidos(prescription).volumen * 0.015 / peso
// //         aportes.a_cloruro = 0

// //     } else if (tipoLipidos === 'Lipoplus 20%') {
// //         aportes.a_sodio = getLipidos(prescription).volumen * 0.001 / peso
// //         aportes.a_potacio = 0
// //         aportes.a_magnesio = 0
// //         aportes.a_fosforo = getLipidos(prescription).volumen * 0.0145 / peso
// //         aportes.a_cloruro = 0
// //     }

// //     return aportes;
// // }

// export const getOmegaven = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };
//     const tp: string = prescription?.clientType!;
//     const omegaven: number = parseFloat(prescription?.omegaven!);
//     const concSinOmegaven: number = 0.1;
//     const peso: number = prescription?.peso!;


//     if (tp === tipoPrescripcion) {
//         params.volumen = omegaven * peso / concSinOmegaven;
//         params.requerimiento = omegaven
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     } else {
//         params.requerimiento = omegaven * concSinOmegaven / peso;
//         params.volumen = omegaven
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     }
//     return params.conPurga;
// }

// export const getDipeptiven = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const tp: string = prescription?.clientType!;
//     const dipeptiven: number = parseFloat(prescription?.dipeptiven!);
//     const concSinDipeptiven: number = 0.20;
//     const peso: number = prescription?.peso!;

//     if (tp === tipoPrescripcion) {
//         params.volumen = dipeptiven * peso / concSinDipeptiven;
//         params.requerimiento = dipeptiven
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     } else {
//         params.requerimiento = dipeptiven * concSinDipeptiven / peso;
//         params.volumen = dipeptiven
//         params.conPurga = params.volumen * correccionPurga(prescription);
//     }
//     // console.log('Dipep:',params)
//     return params.conPurga;
// }


// export const getAportesDipeptiven = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const dipeptiven: number = parseFloat(prescription?.dipeptiven!);
//     const concSinDipeptiven: number = 0.20;
//     const peso: number = prescription?.peso!;

//     params.volumen = dipeptiven * concSinDipeptiven / peso;
//     params.requerimiento = dipeptiven * 13.46 / 20

//     return params;
// }


// export const getVitHidroSolubles = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.requerimiento = parseFloat(prescription?.req_vit_hidrosolubles!)
//     params.volumen = parseFloat(prescription?.req_vit_hidrosolubles!)
//     params.conPurga = parseFloat(prescription?.req_vit_hidrosolubles!) * correccionPurga(prescription)

//     return params.conPurga;
// }

// export const getVitLiposSolubles = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.requerimiento = parseFloat(prescription?.req_vit_liposolubles)
//     params.volumen = parseFloat(prescription?.req_vit_liposolubles)
//     params.conPurga = parseFloat(prescription?.req_vit_liposolubles) * correccionPurga(prescription)

//     return params.conPurga;
// }

// export const getSoluv_Vit = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };


//     const sol_vit = (prescription?.soluvit_vitalip === '' || prescription?.soluvit_vitalip === undefined) ? 0 : parseFloat(prescription?.soluvit_vitalip!)

//     // console.log('PPPPP:', prescription?.soluvit_vitalip)
//     params.requerimiento = sol_vit
//     params.volumen = sol_vit
//     params.conPurga = sol_vit * correccionPurga(prescription)

//     return params;
// }

// export const getOligoelementos = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.requerimiento = parseFloat(prescription?.req_elementos_traza)
//     params.volumen = parseFloat(prescription?.req_elementos_traza)
//     params.conPurga = parseFloat(prescription?.req_elementos_traza) * correccionPurga(prescription)

//     return params.conPurga;
// }




// export const getAgua = (prescription: Record) => {

//     const volTotalNPT: number = prescription?.volumen!
//     const vitaminas: number = getVitHidroSolubles(prescription!).volumen
//         + getVitLiposSolubles(prescription!).volumen + getSoluv_Vit(prescription!).volumen

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };


//     params.volumen = volTotalNPT - (
//         getDextrosa(prescription!).volumen + getLipidos(prescription!).volumen
//         + getAminoacidos(prescription!).volumen + getDipeptiven(prescription!).volumen
//         + getOmegaven(prescription!).volumen + getSodio(prescription!).volumen
//         + getPotacio(prescription!).volumen + getFosforo(prescription!).volumen
//         + getMagnesio(prescription!).volumen + getCalcio(prescription!).volumen
//         + getOligoelementos(prescription).volumen + vitaminas
//         + getVit_C(prescription!).volumen + parseFloat(prescription?.acido_folico!)
//     );

//     params.conPurga = params.volumen * correccionPurga(prescription);
//     // }

//     // console.log('COSAS:',
//     //     getDextrosa(prescription!).volumen, getLipidos(prescription!).volumen
//     //     , getAminoacidos(prescription!).volumen, getDipeptiven(prescription!).volumen
//     //     , getOmegaven(prescription!).volumen, getSodio(prescription!).volumen
//     //     , getPotacio(prescription!).volumen, getFosforo(prescription!).volumen
//     //     , getMagnesio(prescription!).volumen, getCalcio(prescription!).volumen
//     //     , getOligoelementos(prescription).volumen, vitaminas
//     //     , getVit_C(prescription!).volumen, parseFloat(prescription?.acido_folico!));
//     console.log(params.volumen);

//     console.log(params.conPurga);

//     return params.conPurga;

// }


// export const getVolTotal = (prescription: Record) => {

//     const volAgua: number = getAgua(prescription).volumen
//     const vitaminas: number = getVitHidroSolubles(prescription!).volumen
//         + getVitLiposSolubles(prescription!).volumen + getSoluv_Vit(prescription!).volumen
//     let volTotal: number = 0;


//     console.log('SSSS:', vitaminas)

//     volTotal = volAgua
//         + getDextrosa(prescription!).volumen + getLipidos(prescription!).volumen
//         + getAminoacidos(prescription!).volumen + getDipeptiven(prescription!).volumen
//         + getOmegaven(prescription!).volumen + getSodio(prescription!).volumen
//         + getPotacio(prescription!).volumen + getFosforo(prescription!).volumen
//         + getMagnesio(prescription!).volumen + getCalcio(prescription!).volumen
//         + getOligoelementos(prescription).volumen + vitaminas
//         + getVit_C(prescription!).volumen
//         + parseFloat(prescription?.acido_folico!)

//     // console.log('Volumen Total:', volTotal)

//     return volTotal;
// }

// export const getVolTotalConPurga = (prescription: Record) => {

//     const volAgua: number = getAgua(prescription).conPurga
//     const vitaminas: number = getVitHidroSolubles(prescription!).conPurga
//         + getVitLiposSolubles(prescription!).conPurga + getSoluv_Vit(prescription!).conPurga
//     let volTotal: number = 0;


//     console.log('SSSS:', vitaminas)

//     volTotal = volAgua
//         + getDextrosa(prescription!).conPurga + getLipidos(prescription!).conPurga
//         + getAminoacidos(prescription!).conPurga + getDipeptiven(prescription!).conPurga
//         + getOmegaven(prescription!).conPurga + getSodio(prescription!).conPurga
//         + getPotacio(prescription!).conPurga + getFosforo(prescription!).conPurga
//         + getMagnesio(prescription!).conPurga + getCalcio(prescription!).conPurga
//         + getOligoelementos(prescription).conPurga + vitaminas
//         + getVit_C(prescription!).conPurga
//         + parseFloat(prescription?.acido_folico!)

//     // console.log('Volumen Total:', volTotal)

//     return volTotal;
// }

// export const getVelinfusion = (prescription: Record) => {

//     const volTotal: number = getVolTotal(prescription);
//     const tiempoInfusion: number = prescription?.tiempo_infusion!

//     let velinfusion: number = volTotal / tiempoInfusion
//     return velinfusion;
// }


// export const getOsmolaridad = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const volTotalNPT: number = prescription?.volumen!;
//     const volAgua: number = getAgua(prescription!).volumen;
//     const tipo_paciente: string = prescription?.tipo_paciente!;

//     const vit_hidrosoluble: string = prescription?.vit_hidrosolubles!;
//     const aminoacidos: string = prescription?.aminoacidos
//     const lipidos: string = prescription?.lipidos

//     // console.log('Amino:', aminoacidos)

//     const aminovenSE: number = (aminoacidos === 'Aminoven 15% SE')
//         ? getAminoacidos(prescription!).volumen : 0;
//     const travasol: number = (aminoacidos === 'TravasolPlus 15% SE')
//         ? getAminoacidos(prescription!).volumen : 0;
//     const aminoPlasmalCE: number = (aminoacidos === 'Aminoplasmal 10% CE')
//         ? getAminoacidos(prescription!).volumen : 0;
//     const aminoPlasmalSE: number = (aminoacidos === 'Aminoplasmal 10% SE')
//         ? getAminoacidos(prescription!).volumen : 0;

//     const aminovenInfantils: number = (aminoacidos === 'Aminoven Inft 10% SE')
//         ? getAminoacidos(prescription!).volumen : 0;
//     const primene: number = (aminoacidos === 'Primene 10% SE')
//         ? getAminoacidos(prescription!).volumen : 0;

//     const cernevit: number = (vit_hidrosoluble === 'Cernevit')
//         ? parseFloat(prescription?.req_vit_hidrosolubles!) : 0;

//     const soluvit: number = (vit_hidrosoluble === 'Soluvit')
//         ? parseFloat(prescription?.req_vit_hidrosolubles!) : 0;

//     const soluvit_vit: number = prescription?.soluvit_vitalip === '' ? 0 : parseFloat(prescription?.soluvit_vitalip!);

//     const multi12K: number = (vit_hidrosoluble === 'Multi12Potasio')
//         ? parseFloat(prescription?.req_vit_hidrosolubles!) : 0;

//     const vitaLipidInfantil: number = (tipo_paciente === 'Pediatrico')
//         ? parseFloat(prescription?.req_vit_liposolubles!) : 0;

//     const vitaLipidAd: number = (tipo_paciente === 'Adulto')
//         ? parseFloat(prescription?.req_vit_liposolubles!) : 0;

//     const elementos_traza: string = prescription?.elementos_traza!

//     const volOligoNulanza: number = (elementos_traza === 'Nulanza')
//         ? parseFloat(prescription?.req_elementos_traza!) : 0;

//     const volOligoSensitrace: number = (elementos_traza === 'Sencitrace')
//         ? parseFloat(prescription?.req_vit_hidrosolubles!) : 0;
//     ////////////////////////////////////////////////////////////////////////////////
//     const smoflipid: number = (lipidos === 'Smoflipid 20%')
//         ? getLipidos(prescription).volumen : 0;

//     const clinoleic: number = (lipidos === 'Clinoleic 20%')
//         ? getLipidos(prescription).volumen : 0;

//     const lipoplus: number = (lipidos === 'Lipoplus 20%')
//         ? getLipidos(prescription).volumen : 0;

//     // let osmolaridad: number = 0;

//     // console.log('DDDDD:',prescription?.req_vit_hidrosolubles)

//     params.volumen =
//         ((getDextrosa(prescription!).volumen * 2780)
//             // + (getAminoacidos(prescription!).volumen * 1505)
//             + (smoflipid * 290)
//             + (clinoleic * 270)
//             + (lipoplus * 310)
//             + (getOmegaven(prescription!).volumen * 273)
//             + (getDipeptiven(prescription!).volumen * 921)
//             + (getSodio(prescription!).volumen * 4001)
//             + (getPotacio(prescription!).volumen * 4000)
//             + (getFosfatoSodio(prescription!).volumen * 2570)
//             + (getFosfatoPotacio(prescription!).volumen * 6380)
//             + (getCalcio(prescription!).volumen * 626)
//             + (getMagnesio(prescription!).volumen * 1623)
//             + (travasol * 1357)
//             + (primene * 780)
//             + (aminovenInfantils * 885)
//             + (aminovenSE * 1505)
//             + (aminoPlasmalCE * 1030)
//             + (aminoPlasmalSE * 864)
//             + (volOligoNulanza * 2500)
//             + (volOligoSensitrace * 100)
//             + (cernevit * 4820)
//             + (multi12K * 298.5)
//             + (vitaLipidInfantil * 260)
//             + (vitaLipidAd * 260)
//             + (soluvit * 490)
//             + (soluvit_vit * 770)
//             + (getVit_C(prescription!).volumen * 1740)
//             + (parseFloat(prescription?.acido_folico!) * 227)
//             + (volAgua * 1))
//         / (volTotalNPT)



//     // console.log(
//     //     '////////////////OSMOLARIDAD/////////////////////',
//     //     'Dextrosa:', (getDextrosa(prescription!).volumen),
//     //     // + (getAminoacidos(prescription!).volumen * 1505)
//     //     'Lipidos:', (getLipidos(prescription!).volumen),
//     //     'Omegaven:', (getOmegaven(prescription!).volumen),
//     //     'Dipeptiven:', (getDipeptiven(prescription!).volumen),
//     //     'Sodio:', (getSodio(prescription!).volumen),
//     //     'Potacio:', (getPotacio(prescription!).volumen),
//     //     'Fosforo:', (getFosforo(prescription!).volumen),
//     //     'Calcio:', (getCalcio(prescription!).volumen),
//     //     'Magnesio:', (getMagnesio(prescription!).volumen),
//     //     'travasol:', (travasol),
//     //     'primene:', (primene),
//     //     'aminovenInfantils:', (aminovenInfantils),
//     //     'aminovenSE:', (aminovenSE),
//     //     'aminoPlasmalCE:', (aminoPlasmalCE),
//     //     'aminoPlasmalSE:', (aminoPlasmalSE),
//     //     'volOligoNulanza:', (volOligoNulanza),
//     //     'volOligoSensitrace:', (volOligoSensitrace),
//     //     'cernevit:', (cernevit),
//     //     'multi12K:', (multi12K),
//     //     'vitaLipidInfantil:', (vitaLipidInfantil),
//     //     'vitaLipidAd:', (vitaLipidAd),
//     //     'soluvit:', (soluvit),
//     //     'Vit_C:', (getVit_C(prescription!).volumen),
//     //     'acido_folico:', (parseFloat(prescription?.acido_folico!)),
//     //     'Vol_Agua:', (volAgua * 1)
//     // )
//     // // }

//     params.conPurga =
//         ((getDextrosa(prescription!).conPurga * 2780)
//             + (getAminoacidos(prescription!).conPurga * 1505)
//             + (getLipidos(prescription!).conPurga * 290)
//             + (getOmegaven(prescription!).conPurga * 273)
//             + (getDipeptiven(prescription!).conPurga * 921)
//             + (getSodio(prescription!).conPurga * 4001)
//             + (getPotacio(prescription!).conPurga * 4000)
//             + (getFosforo(prescription!).conPurga * 2570)
//             + (getCalcio(prescription!).conPurga * 626)
//             + (getMagnesio(prescription!).conPurga * 1623)
//             + (volOligoNulanza * 2500)
//             + (volOligoSensitrace * 100)
//             + (cernevit * 4820)
//             + (multi12K * 298.5)
//             + (vitaLipidInfantil * 260)
//             + (vitaLipidAd * 260)
//             + (soluvit * 490)
//             + (parseFloat(prescription?.soluvit_vitalip!) * 770)
//             + (getVit_C(prescription!).conPurga * 1740)
//             + (parseFloat(prescription?.acido_folico!) * 227)
//             + (volAgua * 1))
//         / (volTotalNPT)

//     return params;
// }


// export const getCalTotales = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.volumen = getCaloriasTotalesProteicas(prescription!).volumen + getCaloriasNoProteicasCHOS(prescription!).volumen + getCaloriasNoProteicasLIPIDOS(prescription!).volumen
//     params.conPurga = getCaloriasTotalesProteicas(prescription!).conPurga + getCaloriasNoProteicasCHOS(prescription!).conPurga + getCaloriasNoProteicasLIPIDOS(prescription!).conPurga

//     return params;
// }

// export const getCalTotalesKgDia = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };
//     const peso: number = prescription?.peso!;

//     params.volumen = getCalTotales(prescription).volumen / peso
//     params.conPurga = getCalTotales(prescription).conPurga / peso

//     return params;
// }

// export const getGramosTotalesNitro = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     const concSinAminoacidos = concAminoacidos(prescription);

//     params.volumen = (getAminoacidos(prescription!).volumen * concSinAminoacidos * 0.16) + (getDipeptiven(prescription!).volumen * 0.032)
//     params.conPurga = (getAminoacidos(prescription!).conPurga * concSinAminoacidos * 0.16) + (getDipeptiven(prescription!).conPurga * 0.032)

//     return params;
// }



// export const getCaloriasTotalesProteicas = (prescription: Record) => {


//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };
//     const concSinAminoacidos = concAminoacidos(prescription);

//     params.volumen = (getAminoacidos(prescription!).volumen * concSinAminoacidos * 4) + (getDipeptiven(prescription!).volumen * 0.8)
//     params.conPurga = (getAminoacidos(prescription!).conPurga * concSinAminoacidos * 4) + (getDipeptiven(prescription!).conPurga * 0.8)

//     return params;
// }


// export const getCaloriasTotalesProteicasKg = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };
//     const peso: number = prescription?.peso!

//     params.volumen = getCaloriasTotalesProteicas(prescription!).volumen / peso
//     params.conPurga = getCaloriasTotalesProteicas(prescription!).conPurga / peso

//     return params;
// }

// export const getCaloriasNoProteicasCHOS = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.volumen = getDextrosa(prescription!).volumen * 1.7
//     params.conPurga = getDextrosa(prescription!).conPurga * 1.7

//     return params;
// }

// export const getCaloriasNoProteicasLIPIDOS = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.volumen = (getLipidos(prescription!).volumen * 2) + (getOmegaven(prescription!).volumen * 1.12)
//     params.conPurga = (getLipidos(prescription!).conPurga * 2) + (getOmegaven(prescription!).conPurga * 1.12)

//     return params;
// }

// export const getCaloriasNoProteicasKg = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };
//     const peso: number = prescription?.peso!

//     params.volumen = (getCaloriasNoProteicasCHOS(prescription!).volumen + getCaloriasNoProteicasLIPIDOS(prescription!).volumen) / peso
//     params.conPurga = (getCaloriasNoProteicasCHOS(prescription!).conPurga + getCaloriasNoProteicasLIPIDOS(prescription!).conPurga) / peso

//     return params;
// }

// export const getRelacionCalNoProteicasN = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.volumen = (getCaloriasNoProteicasCHOS(prescription!).volumen + getCaloriasNoProteicasLIPIDOS(prescription!).volumen) / getGramosTotalesNitro(prescription!).volumen
//     params.conPurga = (getCaloriasNoProteicasCHOS(prescription!).conPurga + getCaloriasNoProteicasLIPIDOS(prescription!).conPurga) / getGramosTotalesNitro(prescription!).conPurga

//     return params;
// }

// export const getRelacionCalNoProteicasAminoacidos = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };

//     params.volumen = (getCaloriasNoProteicasCHOS(prescription!).volumen + getCaloriasNoProteicasLIPIDOS(prescription!).volumen) / (getGramosTotalesNitro(prescription!).volumen * 6.25)
//     params.conPurga = (getCaloriasNoProteicasCHOS(prescription!).conPurga + getCaloriasNoProteicasLIPIDOS(prescription!).conPurga) / (getGramosTotalesNitro(prescription!).conPurga * 6.25)

//     return params;
// }


// export const getConcentracionDeCHOS = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };
//     const volTotalNPT: number = prescription?.volumen!;

//     params.volumen = (getDextrosa(prescription!).volumen * 0.5 / volTotalNPT) * 100
//     params.conPurga = (getDextrosa(prescription!).conPurga * 0.5 / volTotalNPT) * 100

//     return params;
// }

// export const getConcentracionDeProteinas = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };
//     const concSinAminoacidos = concAminoacidos(prescription);
//     const volTotalNPT: number = prescription?.volumen!;

//     params.volumen = ((getAminoacidos(prescription!).volumen * concSinAminoacidos + getDipeptiven(prescription!).volumen * 0.2) / volTotalNPT) * 100
//     params.conPurga = ((getAminoacidos(prescription!).conPurga * concSinAminoacidos + getDipeptiven(prescription!).conPurga * 0.2) / volTotalNPT) * 100

//     return params;
// }

// export const getConcentracionDeLipidos = (prescription: Record) => {

//     const params: IParamFunc = { requerimiento: 0, volumen: 0, conPurga: 0 };
//     const volTotalNPT: number = prescription?.volumen!;

//     params.volumen = ((getLipidos(prescription!).volumen * 20 + getOmegaven(prescription!).volumen * 10 + getSoluv_Vit(prescription!).volumen * 10 + getVitLiposSolubles(prescription!).volumen * 10) / volTotalNPT)
//     params.conPurga = ((getLipidos(prescription!).conPurga * 20 + getOmegaven(prescription!).conPurga * 10 + getSoluv_Vit(prescription!).conPurga * 10 + getVitLiposSolubles(prescription!).conPurga * 10) / volTotalNPT)

//     return params;
// }

// export const tipo_bolsa = (volTotal: number) => {

//     if ((volTotal >= 0) && (150 >= volTotal)) {
//         return 'FREKA x 150 mL'
//     } else if ((volTotal >= 150) && (250 >= volTotal)) {
//         return 'FREKA x 250 mL'
//     } else if ((volTotal >= 250) && (500 >= volTotal)) {
//         return 'FREKA x 500 mL'
//     } else if ((volTotal >= 500) && (1000 >= volTotal)) {
//         return 'FREKA x 1000 mL'
//     } else if ((volTotal >= 1000) && (1800 >= volTotal)) {
//         return 'FREKA x 2000 mL'
//     } else if ((volTotal >= 1800) && (2800 >= volTotal)) {
//         return 'FREKA x 3000 mL'
//     } else if ((volTotal >= 2800) && (5000 >= volTotal)) {
//         return 'PISA x 3000 mL'
//     } else {
//         return '-'
//     }

// }

// export const peso_teorico = (prescription: Record) => {


//     const tipo_paciente: string = prescription?.tipo_paciente!;
//     const volAgua: number = getAgua(prescription!).volumen;
//     const vit_hidrosoluble: string = prescription?.vit_hidrosolubles!;
//     const aminoacidos: string = prescription?.aminoacidos
//     const lipidos: string = prescription?.lipidos
//     const calcio: string = prescription?.calcio
//     const magnesio: string = prescription?.magnesio

//     const aminovenSE: number = (aminoacidos === 'Aminoven 15% SE')
//         ? getAminoacidos(prescription!).volumen : 0;
//     const travasol: number = (aminoacidos === 'TravasolPlus 15% SE')
//         ? getAminoacidos(prescription!).volumen : 0;
//     const aminoPlasmalCE: number = (aminoacidos === 'Aminoplasmal 10% CE')
//         ? getAminoacidos(prescription!).volumen : 0;
//     const aminoPlasmalSE: number = (aminoacidos === 'Aminoplasmal 10% SE')
//         ? getAminoacidos(prescription!).volumen : 0;

//     const aminovenInfantils: number = (aminoacidos === 'Aminoven Inft 10% SE')
//         ? getAminoacidos(prescription!).volumen : 0;
//     const primene: number = (aminoacidos === 'Primene 10% SE')
//         ? getAminoacidos(prescription!).volumen : 0;

//     const cernevit: number = (vit_hidrosoluble === 'Cernevit')
//         ? parseFloat(prescription?.req_vit_hidrosolubles!) : 0;

//     const soluvit: number = (vit_hidrosoluble === 'Soluvit')
//         ? parseFloat(prescription?.req_vit_hidrosolubles!) : 0;

//     const soluvit_vit: number = prescription?.soluvit_vitalip === '' ? 0 : parseFloat(prescription?.soluvit_vitalip!);

//     const multi12K: number = (vit_hidrosoluble === 'Multi12Potasio')
//         ? parseFloat(prescription?.req_vit_hidrosolubles!) : 0;

//     const vitaLipidInfantil: number = (tipo_paciente === 'Pediatrico')
//         ? parseFloat(prescription?.req_vit_liposolubles!) : 0;

//     const vitaLipidAd: number = (tipo_paciente === 'Adulto')
//         ? parseFloat(prescription?.req_vit_liposolubles!) : 0;

//     const elementos_traza: string = prescription?.elementos_traza!

//     const volOligoNulanza: number = (elementos_traza === 'Nulanza')
//         ? parseFloat(prescription?.req_elementos_traza!) : 0;

//     const volOligoSensitrace: number = (elementos_traza === 'Sencitrace')
//         ? parseFloat(prescription?.req_vit_hidrosolubles!) : 0;
//     ////////////////////////////////////////////////////////////////////////////////
//     const smoflipid: number = (lipidos === 'Smoflipid 20%')
//         ? getLipidos(prescription).volumen : 0;
//     const lipofundin: number = (lipidos === 'Lipoplus 20%')
//         ? getLipidos(prescription).volumen : 0;

//     const clinoleic: number = (lipidos === 'Clinoleic 20%')
//         ? getLipidos(prescription).volumen : 0;

//     const lipoplus: number = (lipidos === 'Lipoplus 20%')
//         ? getLipidos(prescription).volumen : 0;

//     const calcio_elemental: number = (calcio === 'Calcio Elemental')
//         ? getCalcio(prescription!).volumen : 0;

//     const gluconato_calcio: number = (calcio === 'Gluconato de Calcio')
//         ? getCalcio(prescription!).volumen : 0;

//     const magnesio_elemental: number = (magnesio === 'Magnesio Elemental')
//         ? getMagnesio(prescription!).volumen : 0;

//     const sulfato_magnesio: number = (magnesio === 'Sulfato de Magnesio')
//         ? getMagnesio(prescription!).volumen : 0;

//     const peso_teorico = (
//         ((getDextrosa(prescription!).volumen * 1.185)
//             // + (getAminoacidos(prescription!).volumen * 1505)
//             + (aminovenSE * 1.048)
//             + (travasol * 1.05)
//             + (primene * 1.03)
//             + (aminovenInfantils * 1.029)
//             + (aminoPlasmalCE * 1.03)
//             + (aminoPlasmalSE * 1.03)
//             + (clinoleic * 0.986)
//             + (smoflipid * 0.988)
//             + (lipofundin * 0.98)
//             + (lipoplus * 0.98)
//             + (getOmegaven(prescription!).volumen * 0.996)
//             + (getDipeptiven(prescription!).volumen * 1.069)
//             + (getSodio(prescription!).volumen * 1.075)
//             + (getPotacio(prescription!).volumen * 1.09)
//             + (getFosfatoPotacio(prescription!).volumen * 1.32)
//             + (getFosfatoSodio(prescription!).volumen * 1.147)
//             + (calcio_elemental * 1.05)
//             + (gluconato_calcio * 1.05)
//             + (magnesio_elemental * 1.21)
//             + (sulfato_magnesio * 1.21)
//             + (volOligoNulanza * 1.099)
//             + (volOligoSensitrace * 1)
//             + (cernevit * 1)
//             + (multi12K * 1)
//             + (vitaLipidInfantil * 1)
//             + (vitaLipidAd * 1)
//             + (soluvit * 1)
//             + (soluvit_vit * 1.015)
//             + (getVit_C(prescription!).volumen * 1)
//             + (parseFloat(prescription?.acido_folico!) * 1)
//             + (volAgua * 1))
//     )

//     return peso_teorico;
// }




