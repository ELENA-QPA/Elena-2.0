"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AuthRepository } from '@/modules/auth/data/repositories/auth.repository';
import container from '@/lib/di/container';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { USER_ROLES, UserRole, getUserRoleLabel } from '@/utilities/enums';

const inviteSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  lastname: z.string().min(1, 'Apellido es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().min(1, 'Teléfono es requerido'),
  role: z.string().min(1, 'Rol es requerido'),
});

type InviteForm = z.infer<typeof inviteSchema>;

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const roles = USER_ROLES.map(role => ({
  value: role,
  label: getUserRoleLabel(role),
}));

export default function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'validating'>('idle');
  const [responseMessage, setResponseMessage] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
    statusCode?: number;
  }>({ type: null, message: '' });
  const [authRepository] = useState(() => container.get<AuthRepository>("AuthRepository"));

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: InviteForm) => {
    try {
      setIsSubmitting(true);
      setSubmitStatus('validating');
      setResponseMessage({ type: null, message: '' });
      
      const inviteData = {
        name: data.name,
        lastname: data.lastname,
        email: data.email,
        phone: data.phone,
        roles: [data.role]
      };

      setSubmitStatus('submitting');
      const result = await authRepository.inviteUser(inviteData);
      
      // Verificar si es una respuesta de error (contiene statusCode)
      if ('statusCode' in result) {
        // Es una respuesta de error
        const errorMessage = Array.isArray(result.message) 
          ? result.message.join(', ') 
          : result.message || 'Error al invitar usuario';
        
        setResponseMessage({
          type: 'error',
          message: errorMessage,
          statusCode: result.statusCode
        });
        
        // Personalizar mensajes según el código de estado
        if (result.statusCode === 400) {
          if (errorMessage.includes('ya existe')) {
            toast.error('Este usuario ya está registrado en el sistema');
          } else {
            toast.error(errorMessage);
          }
        } else if (result.statusCode === 401) {
          toast.error('No tienes permisos para invitar usuarios');
        } else if (result.statusCode === 403) {
          toast.error('Acceso denegado para esta operación');
        } else if (result.statusCode === 422) {
          toast.error('Datos de invitación inválidos. Verifica la información');
        } else if (result.statusCode === 500) {
          toast.error('Error interno del servidor. Intenta nuevamente');
        } else {
          toast.error(errorMessage);
        }
      } else {
        // Es una respuesta exitosa
        const successMessage = Array.isArray(result.message) 
          ? result.message.join(', ') 
          : result.message || 'Usuario invitado exitosamente';
        
        setResponseMessage({
          type: 'success',
          message: successMessage
        });
        
        toast.success(successMessage);
        
        // Esperar un momento para que el usuario vea el mensaje antes de cerrar
        setTimeout(() => {
          reset();
          onOpenChange(false);
          onSuccess?.();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error al invitar usuario:', error);
      
      let errorMessage = 'Error inesperado al invitar usuario';
      
      // Manejar errores de red o conexión
      if (error.name === 'NetworkError' || error.message.includes('fetch')) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet';
      }
      
      setResponseMessage({
        type: 'error',
        message: errorMessage
      });
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('idle');
    }
  };

  const handleClose = () => {
    reset();
    setSubmitStatus('idle');
    setResponseMessage({ type: null, message: '' });
    onOpenChange(false);
  };

  const getButtonText = () => {
    switch (submitStatus) {
      case 'validating':
        return 'Validando...';
      case 'submitting':
        return 'Enviando invitación...';
      default:
        return 'Invitar';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
          <DialogDescription>
            Agrega un nuevo miembro a tu equipo de trabajo
          </DialogDescription>
        </DialogHeader>
        
        {/* Mostrar mensaje de respuesta de la API */}
        {responseMessage.type && (
          <Alert className={`mb-4 ${
            responseMessage.type === 'success' 
              ? 'border-green-200 bg-green-50' 
              : responseMessage.type === 'error'
              ? 'border-red-200 bg-red-50'
              : 'border-blue-200 bg-blue-50'
          }`}>
            <div className="flex items-center">
              {responseMessage.type === 'success' && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              {responseMessage.type === 'error' && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              {responseMessage.type === 'info' && (
                <AlertCircle className="h-4 w-4 text-blue-600" />
              )}
              <AlertDescription className={`ml-2 ${
                responseMessage.type === 'success' 
                  ? 'text-green-800' 
                  : responseMessage.type === 'error'
                  ? 'text-red-800'
                  : 'text-blue-800'
              }`}>
                {responseMessage.message}
                {responseMessage.statusCode && (
                  <span className="text-xs ml-2 opacity-70">
                    (Código: {responseMessage.statusCode})
                  </span>
                )}
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Nombre"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastname">Apellido</Label>
              <Input
                id="lastname"
                placeholder="Apellido"
                {...register('lastname')}
              />
              {errors.lastname && (
                <p className="text-sm text-red-600">{errors.lastname.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+57 300 123 4567"
              {...register('phone')}
            />
            {errors.phone && (
              <p className="text-sm text-red-600">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select onValueChange={(value) => setValue('role', value)} value={selectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {responseMessage.type === 'success' ? 'Cerrar' : 'Cancelar'}
            </Button>
            {responseMessage.type !== 'success' && (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {getButtonText()}
                  </>
                ) : (
                  'Invitar'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
