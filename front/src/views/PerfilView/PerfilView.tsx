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
import { User, Mail, Phone, MapPin, Calendar, Edit, Save, X, Loader2 } from 'lucide-react';
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

export default function PerfilView() {
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
        console.log('[PERFIL][DEBUG] Iniciando fetchProfile...');
        setLoading(true);
        const profileData = await profileRepository.getMe();
        console.log('[PERFIL][DEBUG] Datos de perfil obtenidos:', profileData);
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
        console.error('[PERFIL][ERROR] Error al cargar el perfil:', error);
        console.error('[PERFIL][ERROR] Status:', error.response?.status);
        console.error('[PERFIL][ERROR] Message:', error.response?.data?.message || error.message);
        
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
      console.log('[PERFIL][DEBUG] Reloading profile...');
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
      console.error('[PERFIL][ERROR] Error al recargar el perfil:', error);
      console.error('[PERFIL][ERROR] Status:', error.response?.status);
      
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
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Cargando información del perfil...</span>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">No se pudo cargar la información del perfil</p>
          <Button onClick={loadProfile} className="mt-4">
            Intentar de nuevo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Gestiona tu información personal y profesional</p>
        </div>
        
        {!editMode ? (
          <Button onClick={() => setEditMode(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button type="submit" form="perfil-form" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Información básica */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarImage src="" />
              <AvatarFallback className="text-lg">
                {getInitials(perfil.fullName, perfil.email)}
              </AvatarFallback>
            </Avatar>
            <CardTitle>{perfil.fullName || perfil.email || 'Usuario'}</CardTitle>
            <div className="mt-1">
              <Badge className={getRolColor(perfil.role || '')}>
                {perfil.role || 'Sin rol'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{perfil.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{perfil.isActive ? 'Activo' : 'Inactivo'}</span>
            </div>
            {perfil.team && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>Equipo: {perfil.team}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información detallada */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Información Detallada</CardTitle>
            <CardDescription>
              Actualiza tu información personal y profesional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="personal">Información Personal</TabsTrigger>
                <TabsTrigger value="profesional">Información Profesional</TabsTrigger>
              </TabsList>
              
              <form id="perfil-form" onSubmit={handleSubmit(onSubmit)}>
                <TabsContent value="personal" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      disabled={!editMode}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastname">Apellidos</Label>
                    <Input
                      id="lastname"
                      {...register('lastname')}
                      disabled={!editMode}
                    />
                    {errors.lastname && (
                      <p className="text-sm text-red-600">{errors.lastname.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      disabled={!editMode}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      disabled={!editMode}
                    />
                  </div>

                </TabsContent>

                <TabsContent value="profesional" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rol Actual</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <Badge className={getRolColor(perfil.role)}>
                        {perfil.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <Badge className={perfil.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {perfil.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>

                  {perfil.team && (
                    <div className="space-y-2">
                      <Label>Equipo</Label>
                      <div className="p-3 bg-gray-50 rounded-md">
                        {perfil.team}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
