import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SetMetadata, UseFilters } from '@nestjs/common/decorators';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger/dist';
import { AuthService } from './auth.service';
import { Auth } from './decorators';
import { GetUser } from './decorators/get-user.decorator';
import { RoleProtected } from './decorators/role-protected.decorator';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { ValidRoles } from './interfaces/valid-roles';
import {
  CreateUserDto,
  LoginUserDto,
  CreateUserByEmailDto,
  InviteUserDto,
  RegisterByInvitationDto,
  EmailDto,
  VerifyCodeAndUpdatePasswordDto,
  UpdateUserDto,
  GroupDto,
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { IUser } from 'src/records/interfaces/user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // -----------------------------------------------------
  // @ApiExcludeEndpoint()
  // @Post('updateFields')
  // updateFields() {
  //   return this.authService.updateFields();
  // }

  // -----------------------------------------------------
  @ApiOperation({ summary: 'Registro' })
  @ApiResponse({
    status: 201,
    example: {
      message: 'Usuario registrado exitosamente',
      user: {
        id: 'uuid-123',
        email: 'usuario@example.com',
        fullName: 'Juan Pérez',
        isActive: true,
        roles: ['user'],
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiResponse({
    status: 400,
    example: {
      statusCode: 400,
      message: [
        'email must be an email',
        'password must be longer than 6 characters',
      ],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 409,
    example: {
      statusCode: 409,
      message: 'El usuario ya existe',
      error: 'Conflict',
    },
  })
  @Post('register')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    example: {
      message: 'Login exitoso',
      user: {
        id: 'uuid-123',
        email: 'usuario@example.com',
        fullName: 'Juan Pérez',
        roles: ['user'],
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Credenciales inválidas',
      error: 'Unauthorized',
    },
  })
  @Post('login')
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Olvidó contraseña' })
  @ApiResponse({
    status: 200,
    example: {
      message: 'Código de verificación enviado al email',
      email: 'usuario@example.com',
    },
  })
  @ApiResponse({
    status: 404,
    example: {
      statusCode: 404,
      message: 'Usuario no encontrado',
      error: 'Not Found',
    },
  })
  @Post('forgotPassword')
  sendCodeToEmail(@Body() emailDto: EmailDto) {
    return this.authService.sendVerificationCode(emailDto);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Verificar código y actualizar contraseña' })
  @ApiResponse({
    status: 200,
    example: {
      message: 'Contraseña actualizada exitosamente',
      success: true,
    },
  })
  @ApiResponse({
    status: 400,
    example: {
      statusCode: 400,
      message: 'Código inválido o expirado',
      error: 'Bad Request',
    },
  })
  @Post('verifyCodeAndUpdatePassword')
  verifyCodeAndUpdatePassword(
    @Body() verifyCodeAndUpdatePassword: VerifyCodeAndUpdatePasswordDto,
  ) {
    return this.authService.verifyCodeAndUpdatePassword(
      verifyCodeAndUpdatePassword,
    );
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Enviar código de activación por email' })
  @ApiResponse({
    status: 200,
    example: {
      message: 'Código de activación enviado al email',
      email: 'usuario@example.com',
    },
  })
  @ApiResponse({
    status: 409,
    example: {
      statusCode: 409,
      message: 'El usuario ya está activado',
      error: 'Conflict',
    },
  })
  @Post('sendActivationCodeToEmail')
  sendActivationCodeToEmail(@Body() emailDto: EmailDto) {
    return this.authService.sendActivationCodeToEmail(emailDto);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Registro por código de activación' })
  @ApiResponse({
    status: 201,
    example: {
      message: 'Usuario registrado exitosamente',
      user: {
        id: 'uuid-123',
        email: 'usuario@example.com',
        fullName: 'Juan Pérez',
        isActive: true,
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiResponse({
    status: 400,
    example: {
      statusCode: 400,
      message: 'Código inválido o expirado',
      error: 'Bad Request',
    },
  })
  @Post('registerByActivationCode')
  registerByActivationCode(@Body() createUserByEmailDto: CreateUserByEmailDto) {
    return this.authService.registerByActivationCode(createUserByEmailDto);
  }
  // -----------------------------------------------------
  @ApiOperation({
    summary: 'Invitar usuario a equipo. Rol Válido:Administrador',
  })
  @ApiBearerAuth()
  @Auth(ValidRoles.admin)
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    example: {
      message: 'Invitación enviada exitosamente',
      invitation: {
        email: 'nuevo@example.com',
        role: 'user',
        invitedBy: 'admin@example.com',
      },
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Post('inviteUser')
  inviteUser(@GetUser() user: IUser, @Body() inviteUser: InviteUserDto) {
    return this.authService.inviteUser(user, inviteUser);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Aceptar invitación con token de autenticación' })
  @ApiResponse({
    status: 200,
    example: {
      message: 'Invitación aceptada exitosamente',
      invitation: {
        email: 'usuario@example.com',
        role: 'user',
        team: 'QP Alliance Team',
      },
    },
  })
  @ApiResponse({
    status: 400,
    example: {
      statusCode: 400,
      message: 'Token de invitación inválido o expirado',
      error: 'Bad Request',
    },
  })
  @Get('acceptInvitation/:token')
  acceptInvitation(@Param('token') token: string) {
    return this.authService.acceptInvitation(token);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Registro por invitación' })
  @ApiResponse({
    status: 201,
    example: {
      message: 'Usuario registrado por invitación exitosamente',
      user: {
        id: 'uuid-123',
        email: 'usuario@example.com',
        fullName: 'Juan Pérez',
        role: 'user',
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    },
  })
  @ApiResponse({
    status: 400,
    example: {
      statusCode: 400,
      message: 'Datos de entrada inválidos',
      error: 'Bad Request',
    },
  })
  @Post('registerByInvitation')
  registerByInvitation(
    @Body() registerByInvitationDto: RegisterByInvitationDto,
  ) {
    return this.authService.registerByInvitation(registerByInvitationDto);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Get Users por rol. Rol Válido:Administrador' })
  @ApiBearerAuth()
  @Auth(ValidRoles.admin)
  @ApiResponse({
    status: 200,
    example: {
      users: [
        {
          id: 'uuid-123',
          email: 'preparador1@example.com',
          fullName: 'Juan Preparador',
          role: 'preparador',
          isActive: true,
        },
      ],
      total: 1,
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  // @UseGuards(JwtAuthGuard)
  @Get('byRol/:rol')
  getPreparadores(@Param('rol') rol: string) {
    return this.authService.byRol(rol);
  }
  //-------------------------------------------------------
  @ApiOperation({ summary: 'Buscar datos del usuario logueado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    example: {
      user: {
        id: 'uuid-123',
        email: 'usuario@example.com',
        fullName: 'Juan Pérez',
        role: 'admin',
        isActive: true,
        team: 'QP Alliance Team',
      },
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Get('me')
  getMe(@GetUser() user: IUser): Promise<any> {
    return this.authService.getMe(user);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Actualizar usuario logueado' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    example: {
      message: 'Usuario actualizado exitosamente',
      user: {
        id: 'uuid-123',
        email: 'usuario@example.com',
        fullName: 'Juan Pérez Actualizado',
        role: 'admin',
      },
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Patch('me')
  update(@GetUser() user: IUser, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.update(user, updateUserDto);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Buscar mi equipo. Rol Válido:Administrador' })
  @ApiBearerAuth()
  @Auth(ValidRoles.admin)
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    example: {
      team: {
        id: 'team-123',
        name: 'QP Alliance Team',
        members: [
          {
            id: 'uuid-456',
            email: 'member1@example.com',
            fullName: 'Miembro 1',
            role: 'preparador',
          },
        ],
        totalMembers: 1,
      },
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Get('my-group')
  getMyGroup(@GetUser() user: IUser) {
    return this.authService.getMyGroup(user);
  }
  // -----------------------------------------------------
  @ApiOperation({
    summary: 'Actualizar miembro de mi equipo. Rol Válido:Administrador',
  })
  @ApiBearerAuth()
  @Auth(ValidRoles.admin)
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    example: {
      message: 'Miembro del equipo actualizado exitosamente',
      member: {
        id: 'uuid-456',
        email: 'member@example.com',
        fullName: 'Miembro Actualizado',
        role: 'preparador',
      },
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Patch('my-group')
  updateUser(@Body() groupDto: GroupDto) {
    return this.authService.updateGroup(groupDto);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Remover miembro de mi equipo' })
  @ApiBearerAuth()
  @Auth(ValidRoles.admin)
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    example: {
      message: 'Miembro removido del equipo exitosamente',
      removedMember: {
        email: 'member@example.com',
        fullName: 'Miembro Removido',
      },
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Patch('member')
  removeMember(@Body() emailDto: EmailDto) {
    return this.authService.removeMember(emailDto.email);
  }
  // -----------------------------------------------------
  @ApiOperation({
    summary: 'Buscar usuario por rol de mi equipo. Rol válido admin',
  })
  @ApiBearerAuth()
  @Auth(ValidRoles.admin)
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    example: {
      results: [
        {
          id: 'uuid-123',
          email: 'preparador@example.com',
          fullName: 'Juan Preparador',
          role: 'preparador',
          isActive: true,
        },
      ],
      query: 'preparador',
      total: 1,
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Get('search/:query')
  searchPreparadores(@Param('query') query: string, @GetUser() user: IUser) {
    return this.authService.searchPreparadores(query, user);
  }
}
