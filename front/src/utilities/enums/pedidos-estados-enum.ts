/**
 * Enum para los estados generales de un pedido
 */
export enum PedidoEstadoEnum {
  PENDIENTE = "Pendiente",
  ACEPTADO = "Aceptado",
  EN_CAMINO = "En camino",
  ENTREGADO = "Entregado",
  CANCELADO = "Cancelado",
}

/**
 * Enum para los estados de pago de un pedido
 */
export enum PedidoEstadoPagoEnum {
  PENDIENTE = "Pendiente",
  PAGADO = "Pagado",
  CANCELADO = "Cancelado",
}

/**
 * Enum para los estados de entrega de un pedido
 */
export enum PedidoEstadoEntregaEnum {
  PENDIENTE = "Pendiente",
  EN_CAMINO = "En camino",
  EN_PREPARACION = "En preparación",
  ENTREGADO = "Entregado",
  CANCELADO = "Cancelado",
  ACEPTADO = "Aceptado",
}

/**
 * Tipo para los valores del enum de estado general
 */
export type PedidoEstadoType = `${PedidoEstadoEnum}`

/**
 * Tipo para los valores del enum de estado de pago
 */
export type PedidoEstadoPagoType = `${PedidoEstadoPagoEnum}`

/**
 * Tipo para los valores del enum de estado de entrega
 */
export type PedidoEstadoEntregaType = `${PedidoEstadoEntregaEnum}`

/**
 * Mapeo de estados de API a estados generales
 */
export const apiToEstadoMap: Record<string, PedidoEstadoType> = {
  PENDING: PedidoEstadoEnum.PENDIENTE,
  ACCEPTED: PedidoEstadoEnum.ACEPTADO,
  ON_WAY: PedidoEstadoEnum.EN_CAMINO,
  DELIVERED: PedidoEstadoEnum.ENTREGADO,
  CANCELED: PedidoEstadoEnum.CANCELADO,
}

/**
 * Mapeo de estados generales a estados de API
 */
export const estadoToApiMap: Record<PedidoEstadoType, string> = {
  [PedidoEstadoEnum.PENDIENTE]: "PENDING",
  [PedidoEstadoEnum.ACEPTADO]: "ACCEPTED",
  [PedidoEstadoEnum.EN_CAMINO]: "ON_WAY",
  [PedidoEstadoEnum.ENTREGADO]: "DELIVERED",
  [PedidoEstadoEnum.CANCELADO]: "CANCELED",
}

/**
 * Mapeo de estados de API a estados de pago
 */
export const apiToEstadoPagoMap: Record<string, PedidoEstadoPagoType> = {
  PENDING: PedidoEstadoPagoEnum.PENDIENTE,
  PAID: PedidoEstadoPagoEnum.PAGADO,
  CANCELED: PedidoEstadoPagoEnum.CANCELADO,
}

/**
 * Mapeo de estados de pago a estados de API
 */
export const estadoPagoToApiMap: Record<PedidoEstadoPagoType, string> = {
  [PedidoEstadoPagoEnum.PENDIENTE]: "PENDING",
  [PedidoEstadoPagoEnum.PAGADO]: "PAID",
  [PedidoEstadoPagoEnum.CANCELADO]: "CANCELED",
}

/**
 * Mapeo de estados de API a estados de entrega
 */
export const apiToEstadoEntregaMap: Record<string, PedidoEstadoEntregaType> = {
  pending: PedidoEstadoEntregaEnum.PENDIENTE,
  on_the_way: PedidoEstadoEntregaEnum.EN_CAMINO,
  preparing: PedidoEstadoEntregaEnum.EN_PREPARACION,
  delivered: PedidoEstadoEntregaEnum.ENTREGADO,
  canceled: PedidoEstadoEntregaEnum.CANCELADO,
  accepted: PedidoEstadoEntregaEnum.ACEPTADO,
}

/**
 * Mapeo de estados de entrega a estados de API
 */
export const estadoEntregaToApiMap: Record<PedidoEstadoEntregaType, string> = {
  [PedidoEstadoEntregaEnum.PENDIENTE]: "pending",
  [PedidoEstadoEntregaEnum.EN_CAMINO]: "on_the_way",
  [PedidoEstadoEntregaEnum.EN_PREPARACION]: "preparing",
  [PedidoEstadoEntregaEnum.ENTREGADO]: "delivered",
  [PedidoEstadoEntregaEnum.CANCELADO]: "canceled",
  [PedidoEstadoEntregaEnum.ACEPTADO]: "accepted",
}

/**
 * Mapeo de estados generales a colores para badges
 */
export const estadoColorMap: Record<PedidoEstadoType, string> = {
  [PedidoEstadoEnum.PENDIENTE]: "bg-blue-600 text-white",
  [PedidoEstadoEnum.ACEPTADO]: "bg-purple-600 text-white",
  [PedidoEstadoEnum.EN_CAMINO]: "bg-slate-600 text-white",
  [PedidoEstadoEnum.ENTREGADO]: "bg-green-600 text-white",
  [PedidoEstadoEnum.CANCELADO]: "bg-red-600 text-white",
}

/**
 * Mapeo de estados de pago a colores para badges
 */
export const estadoPagoColorMap: Record<PedidoEstadoPagoType, string> = {
  [PedidoEstadoPagoEnum.PAGADO]: "bg-green-100 text-green-800",
  [PedidoEstadoPagoEnum.PENDIENTE]: "bg-slate-100 text-slate-800",
  [PedidoEstadoPagoEnum.CANCELADO]: "bg-red-100 text-red-800",
}

/**
 * Mapeo de estados de entrega a colores para badges
 */
export const estadoEntregaColorMap: Record<PedidoEstadoEntregaType, string> = {
  [PedidoEstadoEntregaEnum.ENTREGADO]: "bg-green-600 text-white",
  [PedidoEstadoEntregaEnum.EN_CAMINO]: "bg-slate-600 text-white",
  [PedidoEstadoEntregaEnum.PENDIENTE]: "bg-blue-600 text-white",
  [PedidoEstadoEntregaEnum.CANCELADO]: "bg-red-600 text-white",
  [PedidoEstadoEntregaEnum.EN_PREPARACION]: "bg-yellow-600 text-white",
  [PedidoEstadoEntregaEnum.ACEPTADO]: "bg-purple-600 text-white",
}