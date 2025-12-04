'use client';

import { Button } from "@/components";
import { useLogout } from "@/hooks";
import { ShieldAlert, Home, LogOut, Undo2 } from "lucide-react"

export default function NotAuthorizedPage() {

    const { logout } = useLogout();

    const handleBack = () => {
        window.history.back();
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8">
                    <div className="flex justify-center mb-6">
                        <ShieldAlert className="h-24 w-24 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
                        Acceso Denegado
                    </h1>
                    <p className="text-center text-gray-600 mb-6">
                        Lo sentimos, tu rol actual no tiene permiso para acceder a esta área del sistema.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button
                            className="flex items-center justify-center"
                            variant="outline"
                            onClick={handleBack}
                        >
                            <Undo2 className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                        <Button
                            className="flex items-center justify-center"
                            variant="destructive"
                            onClick={logout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
    // return (
    //     <div className="flex items-center justify-center min-h-screen bg-gray-50">
    //         <Card className="p-6 max-w-sm mx-auto bg-white rounded-lg shadow-lg">
    //             <div className="flex flex-col items-center">
    //                 <Lock className="w-12 h-12 text-red-600 mb-4" />
    //                 <h1 className="text-xl font-bold text-gray-800">Acceso Denegado</h1>
    //                 <p className="mt-2 text-gray-600">
    //                     No tienes permiso para acceder a esta página. Si crees que esto es un error, contacta al administrador.
    //                 </p>
    //                 <Button
    //                     variant="outline"
    //                     className="mt-4"
    //                     onClick={() => window.history.back()}
    //                 >
    //                     Volver
    //                 </Button>
    //             </div>
    //         </Card>
    //     </div>
    // );
}