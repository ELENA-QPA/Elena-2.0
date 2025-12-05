export const routes = {
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    confirmAccount: "/confirm-account",
    confirmPassword: "/confirm-password",
    inviteUser: "/invite-user",
    acceptInvitation: "/accept-invitation",
    sendActivationCode: "/send-activation-code",
    verifyCodeAndUpdatePassword: "/verify-code-and-update-password",
    registerByActivationCode: "/register-by-activation-code",
    registerByInvitation: "/register-by-invitation",
    
  },

  useTerms: "/terminos-de-uso",
  privacyPolicy: "/politica-de-privacidad",
  dashboard: "/dashboard",
  
  // Rutas específicas de QP Alliance
  expedientes: "/dashboard/expedientes",
  expedientesCrear: "/dashboard/expedientes/crear",
  expedientesEditar: "/dashboard/expedientes/editar",
  informacionCaso: "/dashboard/informacion-caso",
  configuracion: "/dashboard/configuracion",
  perfil: "/dashboard/perfil", 
  equipo: "/dashboard/equipo",
  estadisticas: "/dashboard/estadisticas",
  audiencias : "/dashboard/audiencias",

};
