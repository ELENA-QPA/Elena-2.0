"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, MoreHorizontal, Mail, Phone, User, Loader2, Eye, Edit, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { TeamRepository } from "@/modules/equipo/data/repositories/team.repository"
import { Team } from "@/modules/equipo/data/interface/team.interface"
import container from "@/lib/di/container"
import { toast } from "sonner"
import InviteUserModal from "@/components/InviteUserModal"
import { getUserRoleLabel, USER_ROLES } from "@/utilities/enums"

export default function EquipoView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [teamRepository] = useState(() => container.get<TeamRepository>("TeamRepository"))
  
  // Estados para el modal de miembro
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    lastname: '',
    email: '',
    phone: '',
    roles: [] as string[],
    isActive: true
  })

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true)
        const teamData = await teamRepository.getMyGroup()
        setTeam(teamData)
      } catch (error) {
        console.error('Error al cargar el equipo:', error)
        toast.error('Error al cargar la información del equipo')
      } finally {
        setLoading(false)
      }
    }
    
    fetchTeam()
  }, [teamRepository])

  const loadTeam = async () => {
    try {
      setLoading(true)
      const teamData = await teamRepository.getMyGroup()
      setTeam(teamData)
    } catch (error) {
      console.error('Error al cargar el equipo:', error)
      toast.error('Error al cargar la información del equipo')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      // ✅ CORREGIDO: Usar _id en lugar de id
      const member = team?.members.find(m => m._id === memberId);
      if (!member?.email) {
        toast.error('No se puede remover el miembro: email no encontrado');
        return;
      }
      
      console.log('[EQUIPO_VIEW] Removing member:', member.email);
      await teamRepository.removeMember({ email: member.email });
      toast.success('Miembro removido del equipo');
      await loadTeam(); // Recargar la lista
    } catch (error) {
      console.error('Error al remover miembro:', error);
      toast.error('Error al remover miembro del equipo');
    }
  }

  // Funciones para el modal de miembro
  const handleViewMember = (member: any) => {
    setSelectedMember(member);
    setIsEditMode(false);
    setEditForm({
      name: member.name || '',
      lastname: member.lastname || '',
      email: member.email || '',
      phone: member.phone || '',
      roles: member.roles || [],
      isActive: member.isActive ?? true
    });
    setShowMemberModal(true);
  }

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setIsEditMode(true);
    setEditForm({
      name: member.name || '',
      lastname: member.lastname || '',
      email: member.email || '',
      phone: member.phone || '',
      roles: member.roles || [],
      isActive: member.isActive ?? true
    });
    setShowMemberModal(true);
  }

  const handleSaveMember = async () => {
    if (!selectedMember) return;

    try {
      // ✅ CORREGIDO: Solo enviar los campos que acepta la API
      const updateData = {
        email: selectedMember.email,
        roles: editForm.roles,
        group_admin: selectedMember.group_admin
      };

      console.log('[EQUIPO_VIEW] Updating member:', updateData);
      const response = await teamRepository.updateMyGroup(updateData);
      console.log('[EQUIPO_VIEW] Update response:', response);
      
      toast.success('Miembro actualizado exitosamente');
      setShowMemberModal(false);
      await loadTeam(); // Recargar la lista
    } catch (error) {
      console.error('Error al actualizar miembro:', error);
      toast.error('Error al actualizar miembro del equipo');
    }
  }

  const handleCloseModal = () => {
    setShowMemberModal(false);
    setSelectedMember(null);
    setIsEditMode(false);
    setEditForm({
      name: '',
      lastname: '',
      email: '',
      phone: '',
      roles: [],
      isActive: true
    });
  }

  const getStatusBadge = (isActive: boolean = false) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactivo</Badge>
    }
  }

  const getMemberRole = (roles?: string[]) => {
    const role = roles && roles.length > 0 ? roles[0] : 'Sin rol asignado';
    return getUserRoleLabel(role);
  }

  const getMemberFullName = (name?: string, lastname?: string) => {
    const fullName = `${name || ''} ${lastname || ''}`.trim();
    return fullName || 'Sin nombre';
  }

  const getInitials = (name?: string, lastname?: string) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : '';
    const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : '';
    return `${firstInitial}${lastInitial}` || 'U';
  }

  const filteredMembers = team?.members.filter(member =>
    `${member.name || ''} ${member.lastname || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (member.roles && member.roles.some(role => role.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || []

  if (loading) {
    return (
      <div className="p-2 sm:p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm sm:text-base">Cargando información del equipo...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">Gestión del Equipo</h1>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm">Administra el equipo de trabajo y colaboradores</p>
        </div>
        <Button 
          className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg w-full sm:w-auto text-xs sm:text-sm flex-shrink-0"
          onClick={() => setShowInviteModal(true)}
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Nuevo Miembro</span>
          <span className="xs:hidden">Nuevo</span>
        </Button>
      </div>

      <Card>
        <CardHeader className="p-3 sm:p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 sm:h-4 sm:w-4" />
              <Input
                placeholder="Buscar miembros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 sm:pl-10 text-xs sm:text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="bg-white p-3 sm:p-4 md:p-6">
          {/* Vista de escritorio - Tabla completa */}
          <div className="hidden lg:block rounded-md border bg-white">
            <Table className="bg-white">
              <TableHeader className="bg-gray-50">
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="text-gray-700">Miembro</TableHead>
                  <TableHead className="text-gray-700">Rol</TableHead>
                  <TableHead className="text-gray-700">Contacto</TableHead>
                  <TableHead className="text-gray-700">Estado</TableHead>
                  <TableHead className="text-right text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {team?.members.length === 0 ? 'No hay miembros en el equipo' : 'No se encontraron miembros que coincidan con la búsqueda'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member._id} className="bg-white hover:bg-gray-50">
                      <TableCell className="bg-white">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src="" alt={getMemberFullName(member.name, member.lastname)} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{getMemberFullName(member.name, member.lastname)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="bg-white">{getMemberRole(member.roles)}</TableCell>
                      <TableCell className="bg-white">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-3 w-3 mr-1" />
                            {member.email || 'Sin email'}
                          </div>
                          {member.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="bg-white">{getStatusBadge(true)}</TableCell>
                      <TableCell className="text-right bg-white">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewMember(member)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Ver información"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditMember(member)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                            title="Editar miembro"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(member._id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Remover del equipo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Vista móvil - Cards */}
          <div className="lg:hidden space-y-3">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {team?.members.length === 0 ? 'No hay miembros en el equipo' : 'No se encontraron miembros que coincidan con la búsqueda'}
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div key={member._id} className="bg-white border rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src="" alt={getMemberFullName(member.name, member.lastname)} />
                        <AvatarFallback>
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{getMemberFullName(member.name, member.lastname)}</div>
                        <div className="text-xs text-gray-600">{getMemberRole(member.roles)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {getStatusBadge(true)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMember(member)}
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        title="Ver información"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMember(member)}
                        className="h-7 w-7 p-0 text-green-600 hover:text-green-800 hover:bg-green-50"
                        title="Editar miembro"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member._id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        title="Remover del equipo"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center text-xs text-gray-600">
                      <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{member.email || 'Sin email'}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center text-xs text-gray-600">
                        <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{member.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <InviteUserModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        onSuccess={loadTeam}
      />

      {/* Modal para ver/editar miembro */}
      <Dialog open={showMemberModal} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Miembro del Equipo' : 'Información del Miembro'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Modifica la información del miembro del equipo.' 
                : 'Información detallada del miembro del equipo.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información del miembro */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src="" alt={getMemberFullName(editForm.name, editForm.lastname)} />
                <AvatarFallback className="bg-pink-100 text-pink-600">
                  {getInitials(editForm.name, editForm.lastname)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {getMemberFullName(editForm.name, editForm.lastname)}
                </h3>
                <p className="text-sm text-gray-600">{editForm.email}</p>
                <div className="mt-1">
                  {getStatusBadge(editForm.isActive)}
                </div>
              </div>
            </div>

            {/* Formulario de edición */}
            {isEditMode && (
              <div className="space-y-4">
                {/* ✅ CORREGIDO: Solo mostrar campos que se pueden actualizar según la API */}
                <div>
                  <Label htmlFor="email">Email (solo lectura)</Label>
                  <Input
                    id="email"
                    value={editForm.email}
                    placeholder="Email"
                    disabled // Email no se puede cambiar
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
                </div>

                <div>
                  <Label htmlFor="roles">Rol *</Label>
                  <Select
                    value={editForm.roles[0] || ''}
                    onValueChange={(value) => setEditForm({...editForm, roles: [value]})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* ✅ CORREGIDO: Usar los roles disponibles del enum */}
                      {USER_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {getUserRoleLabel(role)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Información adicional (solo lectura) */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Información adicional (solo lectura)</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Nombre:</span>
                      <p className="text-gray-500">{editForm.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Apellido:</span>
                      <p className="text-gray-500">{editForm.lastname}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Teléfono:</span>
                      <p className="text-gray-500">{editForm.phone || 'No especificado'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Estado:</span>
                      <div className="mt-1">{getStatusBadge(editForm.isActive)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información de solo lectura */}
            {!isEditMode && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Nombre:</span>
                    <p className="text-gray-600">{editForm.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Apellido:</span>
                    <p className="text-gray-600">{editForm.lastname}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-600">{editForm.email}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Teléfono:</span>
                  <p className="text-gray-600">{editForm.phone || 'No especificado'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Rol:</span>
                  <p className="text-gray-600">{getMemberRole(editForm.roles)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Estado:</span>
                  <div className="mt-1">{getStatusBadge(editForm.isActive)}</div>
                </div>
                {selectedMember?.createdAt && (
                  <div>
                    <span className="font-medium text-gray-700">Fecha de registro:</span>
                    <p className="text-gray-600">
                      {new Date(selectedMember.createdAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveMember}>
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseModal}>
                  Cerrar
                </Button>
                <Button onClick={() => setIsEditMode(true)}>
                  Editar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
