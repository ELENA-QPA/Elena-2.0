import { PedidoEstadoEntregaType, PedidoEstadoPagoType, PedidoEstadoType } from "@/utilities/enums/pedidos-estados-enum";
import { IUser } from "./user.interface";

/////////////////DASHBOARD//////////////////////////////////////////////
export interface IDireccionEnvio {
  idDireccion: number; // Int (autoincremental) - PK
  idUsuario: number; // FK (usuario relacionado)
  latitud: number; // Decimal(10,6) - Latitud
  longitud: number; // Decimal(10,6) - Longitud
  direccion: string; // Varchar(200) - Dirección
  ciudad: string; // Varchar(200) - Ciudad
  CodigoPostal: string; // Varchar(200) - Código postal
  etiqueta?: string; // Varchar(200) - Etiqueta opcional
  detalles1?: string; // Varchar(500) - Detalles 1 opcionales
  detalles2?: string; // Varchar(500) - Detalles 2 opcionales
  instruccionesEntrega?: string; // Texto - Instrucciones de entrega opcionales
  estado?: "recibir personalmente" | "dejar en porteria"; // Enum de estado de entrega opcional
}

export interface IHistorialPuntos {
  idHistorialPuntos: number; // Int (autoincremental) - PK
  idUsuario: number; // FK (usuario relacionado)
  idPedidoOrIdServicio: number; // Int - FK (idPedido o idServicio)
  puntosOtorgados: number; // Int - Puntos otorgados
  puntosRedimidos: number; // Int - Puntos redimidos
  fechaTransaccion: Date; // DateTime - Fecha de la transacción
  descripcion?: string; // Varchar(250) - Descripción opcional
}

export interface IPuntosUsuario {
  idFavorito: number; // Int (autoincremental) - PK
  idUsuario: number; // FK (usuario relacionado)
  puntosAcumulados: number; // Int - Puntos acumulados
  puntosRedimidos: number; // Int - Puntos redimidos
  fechaActualizacion: Date; // DateTime - Fecha de actualización
}

export interface IDistanciaUsuarioPetShop {
  idDistancia: number; // Int (autoincremental) - PK
  idUsuario: number; // FK (usuario relacionado)
  idDireccion: number; // FK (dirección relacionada)
  idPetShop: number; // FK (pet shop relacionado)
  distancia: number; // Decimal(10,6) - Distancia entre usuario y pet shop
  horarioCierre: Date; // DateTime - Horario de cierre del pet shop
}
export interface INotificacion {
  idNotificacion: number; // Int (autoincremental) - PK
  idUsuario: number; // FK (usuario relacionado)
  tipo: "promocion" | "reseña" | "etc"; // Enum de tipos de notificación
  mensaje: string; // Texto - Mensaje de la notificación
  fecha: Date; // DateTime - Fecha de la notificación
  leida: boolean; // Booleano - Estado de la notificación (leída o no)
}

export interface IMetodosPagoPetShop {
  idMetodoPagoPetShop: number; // Int (autoincremental) - PK
  idPetShop: number; // FK (pet shop relacionado)
  pagoEnLinea: boolean; // Booleano - Indica si el pago en línea está disponible
  contraEntrega: boolean; // Booleano - Indica si el pago contra entrega está disponible
  recogidaEnCasa: boolean; // Booleano - Indica si la recogida en casa está disponible
}

export interface IMetodosPagoUsuario {
  idMetodoPagoUsuario: number; // Int (autoincremental) - PK
  idUsuario: number; // FK (usuario relacionado)
  pagoEnLinea: boolean; // Booleano - Indica si el pago en línea está disponible
  contraEntrega: boolean; // Booleano - Indica si el pago contra entrega está disponible
  recogidaEnCasa: boolean; // Booleano
}

export interface IMetodoPago {
  idMetodoPago: number; // Int (autoincremental) - PK
  nombre: string; // Varchar(50) - Nombre del método de pago
  descripcion?: string; // Texto - Descripción del método de pago (opcional)
}

export interface IMetodoPagoDisponible {
  idMetodoPagoDisponible: number; // Int (autoincremental) - PK
  idPetShop: number; // FK (pet shop relacionado)
  idMetodoPago: number; // FK (método de pago relacionado)
}

export interface IUsuario {
  idUsuario: number; // Int (autoincremental) - PK
  nombre: string; // Varchar(50) - Nombre del usuario
  apellido: string; // Varchar(50) - Apellido del usuario
  email: string; // Varchar(250) - Correo electrónico del usuario
  contraseña: string; // Varchar(250) - Contraseña del usuario
  telefono: string; // Varchar(250) - Teléfono del usuario
  tipoUsuario: "comprador" | "vendedor" | "repartidor" | "administrador"; // Enum para el tipo de usuario
  fechaRegistro: Date; // DateTime - Fecha de registro del usuario
}

export interface IPetShop {
  idPetShop: string; // Int (autoincremental) - PK
  idUsuario: string; // FK (usuario relacionado)
  nombre: string; // Varchar(50) - Nombre del pet shop
  descripcion: string; // Texto - Descripción del pet shop
  direccion: string; // Varchar(200) - Dirección del pet shop
  latitud: number; // Decimal(10,6) - Latitud del pet shop
  longitud: number; // Decimal(10,6) - Longitud del pet shop
  horarioApertura: Date; // Date - Hora de apertura
  horarioCierre: Date; // Date - Hora de cierre
  calificacionGoogle: number; // Decimal(10,6) - Calificación de Google
  imagen?: string; // Varchar(255) - Imagen del pet shop (opcional)
  envioGratis?: boolean; // Booleano - Indica si el envío es gratis (opcional)
  // Nuevos campos opcionales en español basados en la respuesta
  barrio?: string; // Varchar - Vecindario (neighborhood)
  codigoPostal?: string; // Varchar - Código postal (postalCode)
  telefono?: string; // Varchar - Teléfono (phone)
  rfc?: string; // Varchar - RFC (rfc)
  politicaEnvio?: string; // Texto - Política de envío (shippingPolicy)
  entregaEstimada?: string; // Varchar - Entrega estimada (estimatedDelivery)
  tiempoRespuesta?: string; // Varchar - Tiempo de respuesta (responseTime)
  tiendaEspecializada?: boolean; // Booleano - Tienda especializada (especializedShop)
  zonasEntrega?: string[]; // Array de strings - Zonas de entrega (deliveryZones)
  horariosNegocio?: any[]; // Array - Horarios de negocio (businessHours, tipo flexible por ahora)
  usuario?: IUser; // Objeto usuario relacionado (opcional)
}
export interface IRepartidorPetShop {
  idRepartidorPetShop: number; // Int (autoincremental) - PK
  idPetShop: number; // FK (pet shop relacionado)
  idRepartidor: number; // FK (repartidor relacionado)
}
export interface IMascota {
  idMascota: number; // Matches petId
  idUsuario?: number; // Optional, not in API response
  nombre: string; // Matches name
  especie?: "perro" | "gato" | "otro"; // Optional, can be derived from breed.specie if available
  raza?: string; // Matches breed.name if available
  fechaNacimiento: Date | string; // Matches birthDate, can be string from API
  peso?: number; // Optional, not in API response
  tamaño: "pequeño" | "mediano" | "grande"; // Matches size
  caracteristicas?: "caracteristica1" | "caracteristica2" | string; // Optional, not in API response
  nivelActividad?: "bajo" | "medio" | "alto"; // Optional, not in API response
  alergias?: string; // Optional, not in API response
  condicionesMedicas?: string; // Optional, not in API response
  tipoAlimento?: "seco" | "húmedo" | null; // Matches foodType
  imagen?: string | null; // Matches image
  esterilizado?: boolean; // Matches isSterilized
}

export interface Caracteristica {
  idCaracteristica: number; // Identificador único, autoincremental
  nombre: string; // Nombre de la característica
}
export interface IPedido {
  idPedido: number // Int (autoincremental) - PK
  idUsuario: number // FK (usuario relacionado)
  idComprador: number // FK (comprador relacionado)
  idPetShop: number // FK (pet shop relacionado)
  idRepartidor: number // FK (repartidor relacionado)
  fechaPedido: Date // DateTime - Fecha del pedido
  estado: PedidoEstadoType // Enum - Estado del pedido
  total: number // Decimal(10,6) - Total del pedido
  estadoPago: PedidoEstadoPagoType // Enum - Estado del pago
  estadoEntrega: PedidoEstadoEntregaType // Enum - Estado de la entrega
  deliveryAddress: number // Nuevo campo - Dirección de entrega
  subOrders: Array<{
    petShop: number
    orderDetail: Array<{
      productVariant: number
      quantity: number
      unitPrice: number
    }>
    deliveryCost: number
    total: number
    subOrderId: number // Añadido para la tabla desplegable
    subOrderPayments: Array<{
      subOrderPaymentId: number
      paymentMethod: string
      state: string
    }>
    subOrderDeliveries: Array<any>
  }> // Nuevo campo - Subórdenes

  // Campos adicionales para la vista
  codigoPedido?: string // Código de pedido para mostrar (ej: #12512B)
  nombreTienda?: string // Nombre de la tienda
  cliente?: string // Nombre del cliente (calculado o mapeado)
}

export interface ISolicitudesSurtidos {
  idPedido: number // Int (autoincremental) - PK
  idUsuario: number // FK (usuario relacionado)
  idComprador: number // FK (comprador relacionado)
  idPetShop: number // FK (pet shop relacionado)
  idRepartidor: number // FK (repartidor relacionado)
  fechaPedido: Date // DateTime - Fecha del pedido
  estado: PedidoEstadoType // Enum - Estado del pedido
  total: number // Decimal(10,6) - Total del pedido
  estadoPago: PedidoEstadoPagoType // Enum - Estado del pago
  estadoEntrega: PedidoEstadoEntregaType // Enum - Estado de la entrega

  // Campos adicionales para la vista
  codigoPedido?: string // Código de pedido para mostrar (ej: #12512B)
  nombreTienda?: string // Nombre de la tienda
}

export interface IInventario {
  idInventario: number; // Int (autoincremental) - PK
  idPetShop: number; // FK (pet shop relacionado)
  idProducto: number; // FK (producto relacionado)
  precio: number; // Decimal(10,6) - Precio final de venta al público
  stock: number; // Int - Cantidad en stock
  destacado: boolean; // Booleano - Indica si el producto es destacado
}

export interface IVentaPetShop {
  idVentaPetShop: number; // Int (autoincremental) - PK
  idPetShop: number; // FK (pet shop relacionado)
  idPedido: number; // FK (pedido relacionado)
  fechaVenta: Date; // DateTime - Fecha de la venta
  monto: number; // Decimal(10,6) - Monto total de la venta
}

export interface IPagoPetShop {
  idPagoPetShop: number; // Int (autoincremental) - PK
  idPetShop: number; // FK (pet shop relacionado)
  fechaPago: Date; // DateTime - Fecha del pago
  monto: number; // Decimal(10,6) - Monto del pago
  periodo: Date; // Date - Fecha de inicio del periodo de pago (semanal)
}
export interface IRaza {
  idRaza: number; // Autoincremental, clave primaria
  nombre: string | null;
  descripcion: string | null;
  foto: string | null;
  idEspecie?: number | null;
  especie?: string;
}

export interface IEspecie {
  idEspecie: number; // Autoincremental, clave primaria
  nombre: string | null;
  foto?: string | null;
}


// Update the ICategoria interface

// Update the ICategoria interface
export interface ICategoria {
  idCategoria: number
  idCategoriaPadre?: number | null
  nombre: string
  descripcion?: string
  imagen?: string | null
  slug?: string
  subcategorias?: ICategoria[] // Explicitly define subcategorias here
  parentCategory?: {
    categoryId?: number
    name?: string
    description?: string
    image?: string
    slug?: string
  } | null
  productos?: any[]
  depth?: number // Añadir la propiedad depth como opcional
}

export interface IMarca {
  idMarca: number; // Int (autoincremental) - PK
  nombre: string; // Varchar(100) - Nombre de la marca
  descripcion?: string; // Text - Descripción de la marca (opcional)
  imagen?: string;
  activo?: string;
  // categorias?: string[]; // Array de categorías asociadas a la marca (opcional)
}

export interface IDetallePedido {
  idDetallePedido: number; // Int (autoincremental) - PK
  idPedido: number; // FK (pedido relacionado)
  idProducto: number; // FK (producto relacionado)
  cantidad: number; // Int - Cantidad de productos en el detalle del pedido
  precioUnitario: number; // Decimal(10,2) - Precio unitario del producto
  idMascota?: number; // Int - (opcional) Identificador de la mascota asociada al pedido
}

export interface IRecomendacion {
  idRecomendacion: number; // Int (autoincremental) - PK
  idMascota: number; // FK (mascota relacionada)
  idProducto: number; // FK (producto relacionado)
  habitualmenteComprado: boolean; // Boolean - Indica si el producto es habitualmente comprado
  fechaRecomendacion: Date; // DateTime - Fecha en que se hizo la recomendación
}

export interface ITarifasEnvio {
  idTarifaEnvio: number; // Int (autoincremental) - PK
  rangoMaximoKm: number; // Int - Rango máximo en kilómetros para la entrega
  descripcion: string | null; // Texto opcional con descripción de la tarifa
  precio: number; // Decimal - Precio del envío para ese rango de distancia
}
export interface IProducto {
  idProducto?: number
  idMarca: number | { brandId: number; name: string; description?: string; image?: string; isActive?: boolean }; // Allow both number and object
  productType?: "Producto" | "Servicio"
  // serviceType?: string
  variableProduct?: boolean
  idCategoria?: number
  idSubCategoria?: number | null
  name?: string
  description?: string | null
  files?: string[]
  breedIds?: string[] | null
  ages?: string[] | null
  forSterilizedPets?: boolean
  gender?: ("macho" | "hembra" | "unisex")[]
  impuesto?: number
  distributedByZonaPet?: boolean
  tipo_alimento?: string | null
  specializedProduct?: boolean
  specieIds?: string[] | null
  characteristicIds?: string[] | null
  conditionIds?: string[] | null
  tags?: string[] | null

  productVariants?: {
    productVariantId?: number
    file?: string
    barcode: string
    suggestedPrice: number
    internalCode: string
    optionAttribute1: {
      attributeOptionId: number
      name: string
      description?: string
      image?: string | null
      attribute: {
        attributeId: number
        name: string
        type: string
        description?: string
      }
    } | null
    optionAttribute2: {
      attributeOptionId: number
      name: string
      description?: string
      image?: string | null
      attribute: {
        attributeId: number
        name: string
        type: string
        description?: string
      }
    } | null
    optionAttribute3: {
      attributeOptionId: number
      name: string
      description?: string
      image?: string | null
      attribute: {
        attributeId: number
        name: string
        type: string
        description?: string
      }
    } | null
    tax: number
    sku: string
    supplierPrice: number
    
  }[]
}
export interface ITarifaEnvio {
  idTarifaEnvio: number; // Int (autoincremental) - PK
  rangoMaximoKm: number; // Int - Rango máximo en kilómetros para la entrega
  precio: number; // Decimal - Precio del envío para ese rango
}

export interface IConfiguracionServicio {
  idDetallesServicio: number; // Int (autoincremental) - PK
  maxServicioSlot: number; // Int - Máximo número de slots de servicio
  dias: string | null; // Texto (nullable) - Días disponibles para el servicio
  horas: string | null; // Texto (nullable) - Horas disponibles para el servicio
}

export interface IPrecioOpcionAtributo {
  idPrecioOpcionAtributo: number; // Int (autoincremental) - PK
  idAtributo: number; // FK (Atributo relacionado)
  idOpcionAtributo: number; // FK (Opción de atributo relacionada)
  idProducto: number; // FK (Producto relacionado)
  precioProveedor: number; // Precio proporcionado por el proveedor
  precioSugerido: number; // Precio sugerido para la opción del atributo
}

export interface IMascotaDetallePedido {
  idMascotaDetallePedido: number; // Int (autoincremental) - PK
  idDetallePedido: number; // FK (Detalle de pedido relacionado)
  idMascota: number; // FK (Mascota relacionada)
}
// Actualizar la interfaz IAtributo para incluir las opciones
export interface IAtributo {
  idAtributo: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  opcionId?: string; // ID de la opción seleccionada (ahora es una sola)
  opciones?: IOpcionAtributo[]; // Lista de opciones disponibles
}

export interface IOpcionAtributo {
  idOpcionAtributo: number; // Int (autoincremental) - PK
  idAtributo: number; // FK (Atributo relacionado)
  nombre: string; // Nombre asociado a la opción de atributo
  descripcion?: string;
  tipo?: string;
  imagen?: string; // URL o base64 de la imagen
}

///////////////PEDIDOS///////////////////////////////////

export interface Order {
  id: string;
  date: string;
  customer: string;
  paymentStatus: "paid" | "pending";
  orderStatus: "ready" | "shipped" | "received";
  total: number;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ICaracteristicaMascota {
  idCaracteristicaMascota: number;
  idCaracteristica: number;
  idMascota: number;
}

export interface ICondicionesMascota {
  idCondicionMascota: number;
  idCondicion: number;
  idMascota: number;
}

export interface ICondicion {
  idCondicion: number;
  nombre: string;
  descripcion?: string; // Puede ser null
}

export interface ICaracteristica {
  idCaracteristica: number;
  nombre: string;
}
