import "reflect-metadata";
import { Container } from 'inversify';
import { AxiosHttpClient, HttpClient } from "@/config/protocols/http";
import { AuthRepository, AuthRepositoryImpl } from "@/modules/auth/data/repositories/auth.repository";
import { TeamRepository, TeamRepositoryImpl } from '@/modules/equipo/data/repositories/team.repository';
import { ProfileRepository, ProfileRepositoryImpl } from '@/modules/perfil/data/repositories/profile.repository';
import { CasoRepository, CasoRepositoryImpl } from '@/modules/informacion-caso/data/repositories/caso.repository';
import { EstadisticasRepository, EstadisticasRepositoryImpl } from '@/modules/estadisticas/data/repositories/estadisticas.repository';
import { LocalStorageProtocol, LocalStorageProtocolImpl } from "@/config/protocols/cache/local_cache";

const container = new Container();

// Configuración básica del contenedor para Elena
container.bind(HttpClient).to(AxiosHttpClient).inSingletonScope();
container.bind<AuthRepository>("AuthRepository").to(AuthRepositoryImpl).inSingletonScope();
container.bind<TeamRepository>("TeamRepository").to(TeamRepositoryImpl).inSingletonScope();
container.bind<ProfileRepository>("ProfileRepository").to(ProfileRepositoryImpl).inSingletonScope();
container.bind(LocalStorageProtocol).to(LocalStorageProtocolImpl).inSingletonScope();
container.bind(AuthRepositoryImpl).toSelf();
container.bind(TeamRepositoryImpl).toSelf();
container.bind(ProfileRepositoryImpl).toSelf();
container.bind(CasoRepository).to(CasoRepositoryImpl).inSingletonScope();
container.bind(EstadisticasRepository).to(EstadisticasRepositoryImpl).inSingletonScope();

export default container;