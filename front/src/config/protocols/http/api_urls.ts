export const apiUrls = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    registerByActivationCode: "/api/auth/registerByActivationCode",
    registerByInvitation: "/api/auth/registerByInvitation",
    forgotPassword: "/api/auth/forgotPassword",
    verifyCodeAndUpdatePassword: "/api/auth/verifyCodeAndUpdatePassword",
    sendActivationCodeToEmail: "/api/auth/sendActivationCodeToEmail",
    inviteUser: "/api/auth/inviteUser",
    acceptInvitation: "/api/auth/acceptInvitation",
  },
  team: {
    getMyGroup: "/api/auth/my-group",
    updateMyGroup: "/api/auth/my-group",
    removeMember: "/api/auth/member",
    searchUserByTeam: "/api/auth/search",
  },
  profile: {
    getMe: "/api/auth/me",
    updateMe: "/api/auth/me",
    getUsersByRol: "/api/auth/byRol",
  },
  // Casos
  casos: {
    create: "/api/records/create",
    getAll: "/api/records/all",
    getOne: "/api/records/one",
    update: "/api/records",
    delete: "/api/records",
  },

  // Documentos
  document: {
    create: "/api/document/create",
    update: "/api/document",
    delete: "/api/document",
  },
  // Intervinientes
  intervener: {
    create: "/api/intervener/create",
    update: "/api/intervener",
    delete: "/api/intervener",
  },
  // Partes Procesales
  proceduralPart: {
    create: "/api/procedural-part/create",
    update: "/api/procedural-part",
    delete: "/api/procedural-part",
  },
  // Pagos
  payment: {
    create: "/api/payment",
    update: "/api/payment",
    delete: "/api/payment",
  },
  // Parámetros
  parameter: {
    create: "/api/parameter",
    search: "/api/parameter/search",
    delete: "/api/parameter",
  },
  // Archivos
  fileUpload: {
    single: "/api/file-upload/single",
    multiple: "/api/file-upload/multiple",
    delete: "/api/file-upload",
    info: "/api/file-upload/info",
  },
  // Actuaciones / Performances
  performance: {
    create: "/api/perfomance/create",
    delete: "/api/perfomance",
    update: '/api/perfomance',
  },
  // Estadísticas
  statistics: {
    activeInactiveByMonth: "/api/records/statistics/active-inactive-by-month",
    lawsuitsHearingsByMonth:
      "/api/records/statistics/lawsuits-hearings-by-month",
    processesByState: "/api/records/statistics/processes-by-state",
    processesByStateYear: "/api/records/statistics/processes-by-state-year",
    finishedProcessesByStateYear:
      "/api/records/statistics/finished-processes-by-state-year",
    departmentCityMetrics:
      "/api/records/statistics/processes/by-department-city",
    percentageByDepartment:
      "/api/records/statistics/processes-percentage-by-department",
    filedLawsuitsByUser: "/api/records/statistics/filed-lawsuits-by-user",
    documentation: "/api/records/statistics/documentation",
    documentationMonthly: "/api/records/statistics/documentation/monthly",
    processTracking: "/api/records/statistics/processes/tracking",
  },

  orchestrator: {
    getAll: "/api/orchestrator/audience/all",
    getByLawyer: "/api/orchestrator/audience",
    getRecordByInternal: "/api/orchestrator/record/internalCode",
    getAudience: "/api/orchestrator/audience/fix",
    archiveFile: "/api/orchestrator/filepay",
  },

  audiencias: {
    updateAudience: "/api/audiences/",
    deleteAudience: "/api/audiences/",
    updateAudienceWithValidation: "/api/audiences/validation/",
  },

  notifications: {
    getAll: "/api/notifications",
    delete: "/api/notifications",
    websocket: "/notifications",
  },

  // Monolegal
  monolegal: {
    actuaciones: "/api/monolegal/actuaciones-por-radicado",
  },
};
