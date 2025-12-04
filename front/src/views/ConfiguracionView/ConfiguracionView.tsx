"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Loader2, Settings } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ProfileRepository } from '@/modules/perfil/data/repositories/profile.repository';
import { Profile, UpdateProfileBody } from '@/modules/perfil/data/interface/profile.interface';
import container from '@/lib/di/container';

const perfilSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  lastname: z.string().min(1, 'Apellidos son requeridos'),
  email: z.string().email('Correo electrónico inválido'),
  phone: z.string().optional(),
  roles: z.array(z.string()).optional(),
  he_leido: z.boolean().optional()
});

type PerfilForm = z.infer<typeof perfilSchema>;

export default function ConfiguracionView() {
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [profileRepository] = useState(() => container.get<ProfileRepository>("ProfileRepository"));

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PerfilForm>({
    resolver: zodResolver(perfilSchema),
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        console.log('[CONFIGURACION][DEBUG] Iniciando fetchProfile...');
        setLoading(true);
        const profileData = await profileRepository.getMe();
        console.log('[CONFIGURACION][DEBUG] Datos de perfil obtenidos:', profileData);
        if (profileData) {
          setPerfil(profileData);
          reset({
            name: profileData.name || '',
            lastname: profileData.lastname || '',
            email: profileData.email || '',
            phone: profileData.phone || '',
            roles: profileData.role ? [profileData.role] : [],
            he_leido: true
          });
        }
      } catch (error: any) {
        console.error('[CONFIGURACION][ERROR] Error al cargar el perfil:', error);
        console.error('[CONFIGURACION][ERROR] Status:', error.response?.status);
        console.error('[CONFIGURACION][ERROR] Message:', error.response?.data?.message || error.message);
        
        // No mostrar toast si es error de autenticación (se maneja automáticamente)
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          toast.error('Error al cargar la información del perfil');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileRepository, reset]);

  const loadProfile = async () => {
    try {
      console.log('[CONFIGURACION][DEBUG] Reloading profile...');
      setLoading(true);
      const profileData = await profileRepository.getMe();
      if (profileData) {
        setPerfil(profileData);
        reset({
          name: profileData.name || '',
          lastname: profileData.lastname || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          roles: profileData.role ? [profileData.role] : [],
          he_leido: true
        });
      }
    } catch (error: any) {
      console.error('[CONFIGURACION][ERROR] Error al recargar el perfil:', error);
      console.error('[CONFIGURACION][ERROR] Status:', error.response?.status);
      
      // No mostrar toast si es error de autenticación
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error('Error al cargar la información del perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PerfilForm) => {
    try {
      const updateData: UpdateProfileBody = {
        email: data.email,
        phone: data.phone,
        roles: data.roles,
        name: data.name,
        lastname: data.lastname,
        he_leido: data.he_leido
      };

      await profileRepository.updateMe(updateData);
      await loadProfile(); // Recargar el perfil actualizado
      setEditMode(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handleCancel = () => {
    if (perfil) {
      reset({
        name: perfil.name || '',
        lastname: perfil.lastname || '',
        email: perfil.email || '',
        phone: perfil.phone || '',
        roles: [perfil.role || ''],
        he_leido: true
      });
    }
    setEditMode(false);
  };

  const getInitials = (fullName?: string, email?: string) => {
    const nameToUse = typeof fullName === 'string' && fullName.trim() !== '' ? fullName : (typeof email === 'string' && email.trim() !== '' ? email : 'U');
    const names = nameToUse.split(' ');
    if (names.length >= 2 && names[0] && names[1]) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return nameToUse.charAt(0).toUpperCase();
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'Abogado litigante':
        return 'bg-blue-100 text-blue-800';
      case 'Legal Analyst I':
        return 'bg-green-100 text-green-800';
      case 'Legal Analyst II':
        return 'bg-purple-100 text-purple-800';
      case 'Legal Assistant':
        return 'bg-orange-100 text-orange-800';
      case 'Chief Executive Officer':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-2 sm:p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
          <span className="text-xs sm:text-sm">Cargando información del perfil...</span>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="container mx-auto p-2 sm:p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 text-xs sm:text-sm">No se pudo cargar la información del perfil</p>
          <Button onClick={loadProfile} className="mt-4 text-xs sm:text-sm">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 truncate">
            <Settings className="h-5 w-5 sm:hidden md:h-6 md:w-6 text-pink-600 flex-shrink-0" />
            <Settings className="hidden sm:block h-6 w-6 md:h-8 md:w-8 text-pink-600 flex-shrink-0" />
            <span className="min-w-0 truncate">Configuración de Perfil</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-1">Gestiona y actualiza tu información personal y profesional</p>
        </div>
        
        <div className="flex-shrink-0">
          {!editMode ? (
            <Button onClick={() => setEditMode(true)} className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto text-xs sm:text-sm">
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Editar Perfil
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button type="submit" form="perfil-form" disabled={isSubmitting} className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto text-xs sm:text-sm">
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
                <span className="xs:hidden">{isSubmitting ? '...' : 'Guard'}</span>
              </Button>
              <Button variant="outline" onClick={handleCancel} className="w-full sm:w-auto text-xs sm:text-sm">
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Cancelar</span>
                <span className="xs:hidden">Cancel</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {/* Información básica */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center p-3 sm:p-4 md:p-6">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4">
              <AvatarImage src="" />
              <AvatarFallback className="text-sm sm:text-base md:text-lg bg-pink-100 text-pink-600">
                {getInitials(perfil.fullName, perfil.email)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg text-pink-800 truncate">
              {perfil.fullName || perfil.email || 'Usuario'}
            </CardTitle>
            <div className="mt-1 sm:mt-2">
              <Badge className={`text-xs ${getRolColor(perfil.role || '')}`}>
                {perfil.role || 'Sin rol'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6 pt-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 flex-shrink-0" />
              <span className="truncate">{perfil.email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <User className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 flex-shrink-0" />
              <span>{perfil.isActive ? 'Activo' : 'Inactivo'}</span>
            </div>
            {perfil.team && (
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600 flex-shrink-0" />
                <span className="truncate">Equipo: {perfil.team}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información detallada */}
        <Card className="md:col-span-2">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="text-pink-800 flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Editar Información Personal
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm md:text-base">
              Actualiza tu información personal y profesional. Los cambios serán reflejados inmediatamente en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8 sm:h-10">
                <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal</TabsTrigger>
                <TabsTrigger value="profesional" className="text-xs sm:text-sm">Profesional</TabsTrigger>
              </TabsList>
              
              <form id="perfil-form" onSubmit={handleSubmit(onSubmit)}>
                <TabsContent value="personal" className="space-y-3 sm:space-y-4">
                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Nombre</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      disabled={!editMode}
                      className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-xs sm:text-sm h-8 sm:h-10"
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="lastname" className="text-xs sm:text-sm font-medium">Apellidos</Label>
                    <Input
                      id="lastname"
                      {...register('lastname')}
                      disabled={!editMode}
                      className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-xs sm:text-sm h-8 sm:h-10"
                    />
                    {errors.lastname && (
                      <p className="text-xs text-red-600">{errors.lastname.message}</p>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      disabled={!editMode}
                      className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-xs sm:text-sm h-8 sm:h-10"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">Teléfono</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      disabled={!editMode}
                      className="border-gray-300 focus:border-pink-500 focus:ring-pink-500 text-xs sm:text-sm h-8 sm:h-10"
                    />
                  </div>

                </TabsContent>

                <TabsContent value="profesional" className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center mb-4 sm:mb-6">
                    <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 sm:p-4 w-full">
                      <div className="text-center">
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-pink-800 mb-1 sm:mb-2">Información Profesional</h3>
                        <p className="text-xs sm:text-sm text-pink-600">Estos datos son gestionados por el administrador del sistema</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Rol Actual</Label>
                    <div className="p-2 sm:p-3 bg-gray-50 rounded-md">
                      <Badge className={`text-xs ${getRolColor(perfil.role || '')}`}>
                        {perfil.role || 'Sin rol asignado'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-medium">Estado de la Cuenta</Label>
                    <div className="p-2 sm:p-3 bg-gray-50 rounded-md">
                      <Badge className={perfil.isActive ? 'bg-green-100 text-green-800 text-xs' : 'bg-red-100 text-red-800 text-xs'}>
                        {perfil.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  {perfil.team && (
                    <div className="space-y-1 sm:space-y-2">
                      <Label className="text-xs sm:text-sm font-medium">Equipo</Label>
                      <div className="p-2 sm:p-3 bg-gray-50 rounded-md">
                        <span className="text-xs sm:text-sm text-gray-700">{perfil.team}</span>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3 sm:pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <div className="text-blue-600 flex-shrink-0">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-blue-900">Información Importante</h4>
                          <p className="text-xs sm:text-sm text-blue-700 mt-1">
                            Para modificar información profesional como tu rol o equipo de trabajo, 
                            contacta directamente al administrador del sistema.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}