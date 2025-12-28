import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { EmailToUserDto, UpdateUserDto } from './dto/';
import { MailerService } from '@nestjs-modules/mailer';
import {
  CreateUserDto,
  LoginUserDto,
  CreateUserByEmailDto,
  InviteUserDto,
  RegisterByInvitationDto,
  EmailDto,
  VerifyCodeAndUpdatePasswordDto,
} from './dto';
import { IUser } from 'src/records/interfaces/user.interface';
import { GroupDto } from './dto/groupDto';
import { ValidRoles } from './interfaces';
import mongoose, { Types } from 'mongoose';
import { RecordsService } from 'src/records/records.service';

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
@Injectable()
export class AuthService {
  // -----------------------------------------------------
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
    private readonly recordService: RecordsService,
  ) {}
  // -----------------------------------------------------
  // async updateFields() {
  //   const collection = this.userModel.collection;
  //   // await collection.dropIndex('nombre_apellidos_1');
  //   return await collection.createIndex({ nombre_apellidos: 1 }, { unique: true, sparse: true });

  // }
  // -----------------------------------------------------
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      const user = {
        password: bcrypt.hashSync(password, 10),
        isActive: true,
        // role: ['Administrador'],
        ...userData,
      };
      const userCreated = await this.userModel.create(user);
      delete userCreated.password;
      return {
        email: user.email,
        token: this.getJwtToken({ id: userCreated._id }) as string,
      };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async sendTestEmail() {
    try {
      const result = await this.mailerService.sendMail({
        to: 'jramos@qpalliance.co',
        subject: 'Test SMTP Brevo',
        html: '<h1>Si ves esto, SMTP funciona 🎉</h1>',
      });

      console.log('✅ Email enviado exitosamente:', result);
      return {
        success: true,
        message: 'Email enviado correctamente',
        messageId: result.messageId,
      };
    } catch (error) {
      console.error('❌ Error al enviar email:', error);
      return {
        success: false,
        message: 'Error al enviar email',
        error: error.message,
      };
    }
  }

  // -----------------------------------------------------

  async login(loginUserDto: LoginUserDto) {
    const { password, email, entidad } = loginUserDto;
    const user = await this.userModel.findOne(
      { email },
      {
        email: 1,
        password: 1,
        _id: 1,
        entidad: 1,
        roles: 1,
        name: 1,
        lastname: 1,
      },
    );
    if (!user)
      throw new UnauthorizedException('Credenciales no válidas (email)');
    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('Credenciales no válidas (contraseña)');
    if (entidad) {
      if (user.entidad.sort().toString() !== entidad.sort().toString()) {
        throw new UnauthorizedException('Credenciales no válidas (entidad)');
      }
    }
    return {
      email: user.email,
      token: this.getJwtToken({ id: user._id }),
      entidad: user.entidad,
      rol: user.roles,
      name: user.name,
      lastname: user.lastname,
    };
  }

  // -----------------------------------------------------
  private getJwtToken(payload: JwtPayload): string {
    const token = this.jwtService.sign(payload) as string;
    return token;
  }
  // -----------------------------------------------------
  async sendActivationCodeToEmail(emailDto: EmailDto) {
    const { email } = emailDto;
    let user = await this.userModel.findOne({ email });
    if (user) {
      throw new Error(
        `Usuario con el email ${email} ya existe en la base de datos`,
      );
    }
    try {
      const verificationCode: string = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      let dataToInsert = {
        email: email,
        verificationCode,
        isActive: false,
      };
      const userCreated = await this.userModel.create(dataToInsert);
      const emailToUserDto: EmailToUserDto = {
        email,
        subject: 'Registro en Karbono por correo',
        title:
          'Has solicitado registrarte por correo en Karbono. Si no fue así ignora este correo',
        message: verificationCode,
        response: `Se ha enviado un correo a su cuenta: ${email} con el código de activación`,
      };
      return await this.emailToUser(emailToUserDto);
    } catch (error) {
      console.log(error);
    }
  }
  // -----------------------------------------------------
  async registerByActivationCode(createUserByEmailDto: CreateUserByEmailDto) {
    const { activationCode, email, password, ...rest } = createUserByEmailDto;
    let user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException(
        `Usuario con el email ${email} no encontrado en la DB`,
      );
    }
    if (user.verificationCode !== activationCode) {
      throw new NotFoundException(
        'El código de activación proporcionado es incorrecto',
      );
    }
    try {
      let userToUpdate = {
        verificationCode: '',
        password: bcrypt.hashSync(password, 10),
        isActive: true,
        ...rest,
      };

      await user.updateOne(userToUpdate);
      return 'Se ha registrado exitosamente en Karbono';
    } catch (error) {
      console.log(error);
      throw new Error(
        `No se pudo registrar el usuario. Error interno del servidor`,
      );
    }
  }

  // -----------------------------------------------------
  async sendVerificationCode(emailDto: EmailDto) {
    const { email } = emailDto;
    let user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException(
        `Usuario con el email ${email} no encontrado en la DB`,
      );
    }
    try {
      const verificationCode: string = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      await user.updateOne({ verificationCode, isActive: false });
      const emailToUserDto: EmailToUserDto = {
        email,
        subject:
          'Olvidó contraseña de QPAlliance. Este es su código de verificación',
        title:
          'Has solicitado cambiar la contraseña de QPAlliance. Si no es así ignora este correo',
        message: verificationCode,
        response: `Se ha enviado un correo con el código de verificación a su cuenta de correo: ${email}`,
      };
      return await this.emailToUser(emailToUserDto);
    } catch (error) {
      console.log(error);
    }
  }
  // -----------------------------------------------------
  async verifyCodeAndUpdatePassword(
    verifyCodeAndUpdatePassword: VerifyCodeAndUpdatePasswordDto,
  ) {
    let { email, password, verificationCode } = verifyCodeAndUpdatePassword;
    let user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException(
        `Usuario con el email ${email} y código empleados no encontrado en la DB`,
      );
    }

    if (user.verificationCode !== verificationCode) {
      throw new NotFoundException('El código proporcionado es incorrecto');
    }
    try {
      let userToUpdate = {
        verificationCode: '',
        password: bcrypt.hashSync(password, 10),
        isActive: true,
      };

      await user.updateOne(userToUpdate);
      return {
        message: 'Su contraseña ha sido actualizada',
        rol: user.roles,
      };
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `No se puede actualizar la contraseña. Error interno del servidor`,
      );
    }
  }
  // -----------------------------------------------------
  private async emailToUser(emailToUserDto: EmailToUserDto) {
    try {
      const { email, subject, title, message, response } = emailToUserDto;
      await this.mailerService.sendMail({
        to: email,
        from: this.configService.get('EMAIL_USER'),
        subject: subject,
        template: './verified', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          title: title,
          code: message,
        },
      });
      return response;
    } catch (error) {
      console.log(error);
    }
  }
  // -----------------------------------------------------
  async inviteUser(user: IUser, inviteUserDto: InviteUserDto) {
    // const { central_de_mezclas } = await this.userModel.findById(user.id)
    const { roles } = inviteUserDto;
    let userToInvite: any = {
      isActive: false,
      group_admin: user.email,
      ...inviteUserDto,
    };
    // if (roles.includes('Control de Calidad') || roles.includes('Preparador NPT')) {
    //   // userToInvite.central_de_mezclas = central_de_mezclas
    //   console.log(userToInvite)
    // }
    try {
      const userInvited = await this.userModel.create(userToInvite);
      const q = this.getJwtToken({ id: userInvited.id });
      const invitationLink = `https://elena.qpalliance.co/aceptar_invitacion?token=${q}`;
      const emailToUserDto: EmailToUserDto = {
        email: userInvited.email,
        subject: `Invitación QPAlliance`,
        title: `Somos QPAlliance. Has sido invitado a ser
                  colaborador en su equipo como ${inviteUserDto.roles}. Para aceptar sigue este link:`,
        message: `${invitationLink}`,
        response: `Se ha enviado un correo con el link de invitación a la cuenta : ${userInvited.email}`,
      };
      const res = await this.emailToUser(emailToUserDto);
      if (!res)
        return {
          error: 'No responde servidor de correo',
          invitationLink,
          message: emailToUserDto,
        };
      return res;
    } catch (error: any) {
      console.log(error);
      this.handleExceptions(error);
      // throw new InternalServerErrorException(`No se puede crear ese uuario. Error interno del servidor ${error}`)
    }
  }
  // -----------------------------------------------------
  async acceptInvitation(token: string) {
    const { id } = this.jwtService.verify(token);
    let userInvited = await this.userModel.findById(id);
    if (!userInvited) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return userInvited;
  }
  // -----------------------------------------------------
  async registerByInvitation(registerByInvitationDto: RegisterByInvitationDto) {
    let { email, password, ...rest } = registerByInvitationDto;
    let user = await this.userModel.findById(registerByInvitationDto.id);
    if (!user) {
      throw new NotFoundException(
        `Usuario con el email ${email} no encontrado en la DB `,
      );
    }
    try {
      const userToUpdate = {
        isActive: true,
        password: bcrypt.hashSync(password, 10),
        ...rest,
      };
      await user.updateOne(userToUpdate);
      //Busco todas prescripciones
      // const prescriptions = await this.recordService.findAllbyLab();
      //Si rol es calidad busco la propiedad controla_calidad
      //Si esta vacia, guardo el id del user logueado
      // if (user.roles.includes('Control de Calidad')) {
      //   prescriptions.forEach(prescription => {
      //     if (prescription.controlador_de_calidad === null || prescription.controlador_de_calidad === undefined) {
      //       prescription.controlador_de_calidad = new mongoose.Schema.Types.ObjectId(user._id as string);
      //     }

      //   })

      // }
      //Si rol es preparador busco la propiedad preparador
      //Si esta vacia, guardo el id del user logueado
      // if (user.roles.includes('Preparador NPT')) {
      //   prescriptions.forEach(prescription => {
      //     if (prescription.preparador === null || prescription.preparador === undefined) {
      //       prescription.preparador = [new mongoose.Schema.Types.ObjectId(user._id as string)];
      //     }
      //   });
      // }
      return `Usuario ${email} ha sido registrado!!`;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `No se puede actualizar el usuario. Error interno del servidor ${error}`,
      );
    }
  }
  // -----------------------------------------------------
  async byRol(rol: string) {
    let usersByRol = await this.userModel.find(
      { roles: { $in: rol } },
      { _id: 1, name: 1, lastname: 1 },
    );
    return usersByRol;
  }
  // -----------------------------------------------------
  async getMe(user: IUser) {
    try {
      const me = await this.userModel.findById(user.id);
      return me;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
  // -----------------------------------------------------

  async update(user: IUser, updateUserDto: UpdateUserDto) {
    let userToUpdate = await this.userModel.findOne({
      _id: user.id,
      isActive: true,
    });

    if (!userToUpdate) {
      throw new NotFoundException(`Usuario no encontrado en la DB `);
    }
    try {
      // const { email, nombre_apellidos, telefono, registro_medico, ...rest } = userToUpdate;
      // if (nombre_apellidos !== updateUserDto.nombre_apellidos) {
      //   rest['nombre_apellidos'] = nombre_apellidos;
      // }

      await userToUpdate.updateOne(updateUserDto);
    } catch (error) {
      console.log(error);
      this.handleExceptions(error);
      // throw new InternalServerErrorException(`No se pudieron actualizar sus datos. error interno del servidor`)
    }
    return `Sus datos han sido actualizados`;
  }
  // -----------------------------------------------------
  async getMyGroup(user: IUser) {
    const myGroup = await this.userModel.find({
      group_admin: user.email,
      isActive: true,
    });
    return myGroup;
  }
  // -----------------------------------------------------
  async updateGroup(groupDto: GroupDto) {
    let userToUpdate = await this.userModel.findOne({
      email: groupDto.email,
    });
    if (!userToUpdate) {
      throw new NotFoundException(`Usuario no encontrado en la DB `);
    }
    try {
      await userToUpdate.updateOne(groupDto);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `No se pudo actualizar. Error interno del servidor`,
      );
    }
    return `La información ha sido actualizada`;
  }
  // -----------------------------------------------------
  async searchPreparadores(query: string, user: IUser) {
    const usuario = await this.userModel.findById(user.id);
    const preparadores = await this.userModel.find(
      {
        roles: ValidRoles.legal_analist_1,
        // central_de_mezclas: usuario.central_de_mezclas,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { lastname: { $regex: query, $options: 'i' } },
        ],
        isActive: true,
      },
      { _id: 1, name: 1, lastname: 1 },
    );
    return preparadores;
  }
  // -----------------------------------------------------

  async removeMember(email: string) {
    let userToUpdate = await this.userModel.findOne({ email });
    if (!userToUpdate) {
      throw new NotFoundException(`Usuario no encontrado en la DB `);
    }
    try {
      await userToUpdate.updateOne({ $unset: { group_admin: '' } });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `No se pudo remover el usuario de su equipo. Error interno del servidor`,
      );
    }
    return `El miembro con el email ${email} ha sido removido de su equipo`;
  }

  // -----------------------------------------------------
  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(
        `El usuario con ${JSON.stringify(
          error.keyValue,
        )} ya existe en la base de datos`,
      );
    }
    console.log(error);
    throw new InternalServerErrorException(
      `No se puede crear el usuario. Error interno del servidor`,
    );
  }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
