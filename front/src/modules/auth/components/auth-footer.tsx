"use client";

import { routes } from "@/config";
import clsx from "clsx";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const AuthFooter = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <footer className="bg-white w-full">
        <div
          className={clsx(
            "py-8 mx-auto flex justify-center items-center gap-2 mb-2",
            "text-primary font-sans"
          )}
        >
          <button
            onClick={() => setShowTermsModal(true)}
            className="hover:underline cursor-pointer"
          >
            Términos de uso
          </button>
          {" | "}
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="hover:underline cursor-pointer"
          >
            Política de privacidad
          </button>
        </div>
      </footer>

      {/* Modal de Términos y Condiciones */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-pink-600">
              Términos y Condiciones de Uso del Sistema
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Titular y desarrollador:
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance S.A.S., sociedad por acciones simplificada,
                legalmente constituida conforme a las leyes de la República de
                Colombia, identificada con NIT 901.405.080-7, con domicilio
                principal en la ciudad de Bogotá D.C., en adelante
                &quot;QPAlliance&quot;, en su calidad de titular, creador,
                desarrollador, administrador y responsable del sistema
                informático denominado &quot;elena&quot;, pone a disposición de
                sus usuarios los presentes Términos y Condiciones de Uso, los
                cuales regulan el acceso, uso, operación y tratamiento funcional
                del referido sistema.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">1. OBJETO</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                El presente documento tiene por objeto establecer las
                condiciones jurídicas y operativas bajo las cuales los usuarios
                autorizados por QPAlliance podrán acceder al sistema informático
                interno elena, el cual ha sido diseñado, desarrollado y puesto
                en operación como una herramienta de apoyo para la gestión
                integral, centralizada, sistemática y organizada de procesos
                judiciales y litigiosos llevados por la firma QPAlliance o sus
                aliados, en el marco de su operación jurídica especializada. De
                igual manera, hace las veces de software de gestión empresarial
                de QPAlliance en cada una de sus verticales de negocio.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                El uso del sistema implica la aceptación plena, tácita,
                inequívoca e incondicional por parte del usuario de todos y cada
                uno de los términos aquí consignados, los cuales son vinculantes
                desde el primer momento de acceso al sistema, sin perjuicio de
                las normas internas adicionales o instrucciones complementarias
                que imparta la administración de QPAlliance en desarrollo de su
                facultad de gobierno corporativo y administración operativa.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                2. PROPIEDAD INTELECTUAL Y DERECHOS RESERVADOS
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Todos los componentes funcionales, visuales, estructurales,
                lógicos, algorítmicos, de base de datos, diseño, código fuente,
                interfaces de usuario, arquitectura de software, manuales de
                uso, material documental y demás elementos relacionados con el
                sistema elena son de titularidad exclusiva de QPAlliance, quien
                detenta todos los derechos morales y patrimoniales de propiedad
                intelectual sobre los mismos, en calidad de titular originario
                conforme a la legislación colombiana sobre derechos de autor,
                propiedad industrial y protección legal del software.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                En tal sentido, el usuario reconoce que el uso del sistema elena
                no le concede derecho alguno de propiedad, tenencia, posesión,
                uso comercial, licenciamiento, sublicenciamiento, cesión,
                reproducción, adaptación, distribución o explotación sobre
                ninguno de sus componentes, más allá de una licencia limitada,
                revocable, no exclusiva, no transferible y de uso interno,
                otorgada exclusivamente para el cumplimiento de las funciones
                laborales o contractuales del usuario dentro del marco de
                operaciones de QPAlliance.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                3. LICENCIA DE USO Y CONDICIONES DE ACCESO
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance otorga a sus usuarios autorizados, en calidad de
                empleados, contratistas, aliados o terceros habilitados por la
                dirección, una licencia de uso limitada, no exclusiva,
                revocable, no sublicenciable, exclusivamente para acceder al
                sistema elena con el fin de realizar actividades de consulta,
                gestión, actualización, seguimiento, control y reporte de
                procesos judiciales o trámites jurídicos en los cuales participe
                la firma.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                El acceso al sistema se realizará a través de credenciales
                individuales, asignadas previa verificación y habilitación por
                parte del área correspondiente. El usuario será el único
                responsable por la custodia, confidencialidad, integridad y uso
                adecuado de sus credenciales de acceso. Cualquier uso indebido,
                negligente, fraudulento, no autorizado o contrario a los fines
                establecidos, será considerado como una infracción contractual,
                legal y ética, y podrá dar lugar a la desactivación inmediata de
                la cuenta, sin perjuicio de las acciones disciplinarias, legales
                o contractuales a que haya lugar.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                4. CONFIDENCIALIDAD Y PROTECCIÓN DE LA INFORMACIÓN
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Toda la información a la que se acceda, registre, almacene,
                procese o gestione a través del sistema elena tiene el carácter
                de información confidencial, reservada y protegida por la
                legislación vigente, incluyendo pero sin limitarse a información
                judicial, procesal, personal, estratégica, sensible o propia del
                know-how de QPAlliance.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                Los usuarios se obligan expresamente a mantener la
                confidencialidad de toda la información tratada en el sistema,
                absteniéndose de divulgar, copiar, extraer, modificar,
                transmitir o reproducir dicha información sin la debida
                autorización previa, expresa y por escrito de QPAlliance. La
                violación de esta obligación dará lugar a las acciones legales
                correspondientes, incluyendo las previstas en materia civil,
                penal, laboral y administrativa.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                5. DISPONIBILIDAD, SOPORTE Y MANTENIMIENTO
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance realizará esfuerzos técnicos razonables para asegurar
                la disponibilidad, continuidad y correcto funcionamiento del
                sistema elena. No obstante, el usuario acepta que pueden
                presentarse interrupciones temporales por causas técnicas,
                operativas, de mantenimiento, actualizaciones de sistema,
                migración de datos, mejoras funcionales o fuerza mayor, sin que
                ello implique responsabilidad alguna por parte de QPAlliance.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                La firma podrá modificar, actualizar, descontinuar, ampliar o
                limitar funcionalidades del sistema en cualquier momento, sin
                necesidad de previo aviso, cuando lo considere necesario para
                mejorar el servicio, garantizar la seguridad, ajustarse a
                cambios normativos o responder a necesidades internas.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                6. LIMITACIÓN DE RESPONSABILIDAD
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance no será responsable, directa o indirectamente, por
                perjuicios, pérdidas, errores, daños, fallas de conectividad,
                interrupciones del servicio, acceso no autorizado, pérdida de
                información, o cualquier otra afectación derivada del uso del
                sistema elena, salvo que se demuestre dolo o culpa grave
                atribuible a la firma.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                Asimismo, no se asume responsabilidad por decisiones, errores de
                juicio o actos jurídicos realizados con base en la información
                consultada o almacenada en el sistema, siendo este un
                instrumento de apoyo y no de decisión autónoma.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">7. MODIFICACIONES</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance se reserva el derecho de modificar, actualizar o
                complementar los presentes Términos y Condiciones en cualquier
                momento. Dichas modificaciones entrarán en vigor desde su
                publicación en el sistema, en medios internos o mediante
                comunicación oficial por parte de la administración. El uso
                continuado del sistema posterior a la publicación de los cambios
                se entenderá como aceptación tácita e irrevocable de los nuevos
                términos.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                8. LEGISLACIÓN APLICABLE Y JURISDICCIÓN
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                El presente documento se regirá e interpretará conforme a las
                leyes de la República de Colombia. Cualquier controversia
                relacionada con el acceso, uso o interpretación de estos
                Términos y Condiciones será resuelta por los jueces competentes
                de la ciudad de Bogotá D.C., renunciando expresamente las partes
                a cualquier otro fuero.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => setShowTermsModal(false)}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Política de Privacidad */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-pink-600">
              Política de Privacidad
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] pr-4 space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                1. ALCANCE Y FINALIDAD
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                La presente Política de Privacidad regula el tratamiento de los
                datos personales y procesales gestionados dentro del sistema
                informático elena, desarrollado y administrado por QPAlliance
                S.A.S., en el marco de su actividad como firma de consultoría
                jurídica especializada. Esta política es aplicable a todos los
                usuarios internos autorizados y colaboradores que acceden,
                registran, consultan o procesan información a través del
                sistema.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                elena tiene como finalidad servir de plataforma de gestión
                interna para el seguimiento, control, organización y
                administración sistemática de procesos judiciales, trámites
                legales, actuaciones jurídicas y actividades conexas
                desarrolladas por QPAlliance, con el fin de garantizar
                trazabilidad, eficiencia y orden en la operación jurídica de la
                firma.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                2. DATOS PERSONALES TRATADOS
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                En el marco de la operación del sistema elena, QPAlliance podrá
                tratar los siguientes tipos de datos personales:
              </p>
              <ul className="text-sm text-gray-700 leading-relaxed mt-2 ml-4 list-disc space-y-1">
                <li>
                  Datos de identificación (nombres, apellidos, cédula, número de
                  proceso).
                </li>
                <li>
                  Datos de contacto (dirección, teléfono, correo electrónico).
                </li>
                <li>
                  Información relacionada con procesos judiciales, partes
                  involucradas, radicados, decisiones y documentos procesales.
                </li>
                <li>
                  Información jurídica de naturaleza confidencial suministrada
                  por clientes, usuarios internos o terceros intervinientes en
                  la gestión procesal.
                </li>
              </ul>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                Estos datos serán tratados exclusivamente para los fines
                operativos del sistema, conforme a lo previsto en la presente
                política, en la legislación vigente y en los lineamientos éticos
                y profesionales de la firma.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                3. PRINCIPIOS DE TRATAMIENTO
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance se compromete a realizar el tratamiento de los datos
                bajo los siguientes principios:
              </p>
              <ul className="text-sm text-gray-700 leading-relaxed mt-2 ml-4 list-disc space-y-1">
                <li>
                  <strong>Legalidad:</strong> el tratamiento se realiza conforme
                  a la ley.
                </li>
                <li>
                  <strong>Finalidad:</strong> los datos son usados
                  exclusivamente para fines internos de gestión de procesos.
                </li>
                <li>
                  <strong>Libertad:</strong> el tratamiento se realiza con
                  autorización previa o bajo habilitación legal.
                </li>
                <li>
                  <strong>Transparencia:</strong> el titular puede consultar el
                  uso de sus datos.
                </li>
                <li>
                  <strong>Seguridad:</strong> los datos son protegidos mediante
                  medidas técnicas y administrativas adecuadas.
                </li>
                <li>
                  <strong>Confidencialidad:</strong> todo tratamiento se realiza
                  bajo reserva profesional.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                4. AUTORIZACIÓN DEL TITULAR
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance podrá tratar los datos personales registrados en
                elena con base en:
              </p>
              <ul className="text-sm text-gray-700 leading-relaxed mt-2 ml-4 list-disc space-y-1">
                <li>
                  La autorización expresa o tácita del titular en el marco de la
                  relación contractual, legal o judicial.
                </li>
                <li>
                  El cumplimiento de un deber legal o contractual derivado de la
                  representación jurídica.
                </li>
                <li>
                  El interés legítimo de QPAlliance en el cumplimiento de sus
                  funciones legales y judiciales.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                5. DERECHOS DE LOS TITULARES
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Conforme a la Ley 1581 de 2012, los titulares de los datos
                personales tratados por QPAlliance tienen derecho a:
              </p>
              <ul className="text-sm text-gray-700 leading-relaxed mt-2 ml-4 list-disc space-y-1">
                <li>Conocer, actualizar y rectificar sus datos.</li>
                <li>Solicitar prueba de la autorización otorgada.</li>
                <li>Ser informados sobre el uso que se ha dado a sus datos.</li>
                <li>
                  Revocar la autorización y/o solicitar la supresión de sus
                  datos cuando no exista deber legal de conservación.
                </li>
                <li>
                  Presentar quejas ante la Superintendencia de Industria y
                  Comercio por infracción a la ley.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                6. MEDIDAS DE SEGURIDAD
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance implementará medidas técnicas, humanas, tecnológicas
                y administrativas razonables para proteger la información
                almacenada en elena contra acceso no autorizado, pérdida,
                alteración, divulgación indebida o destrucción.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mt-2">
                Estas medidas incluyen: control de accesos, encriptación,
                restricciones operativas, monitoreo de actividad y capacitación
                interna sobre protección de datos.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                7. ENCARGADOS DEL TRATAMIENTO
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance podrá designar encargados del tratamiento de los
                datos, quienes actuarán bajo su supervisión y conforme a las
                directrices establecidas. Dichos encargados deberán cumplir con
                esta política, la normativa aplicable y los estándares de
                confidencialidad y seguridad definidos por la firma.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                8. CONSERVACIÓN DE LA INFORMACIÓN
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Los datos tratados en elena serán conservados por el tiempo que
                resulte necesario conforme a los fines establecidos, a los
                términos de prescripción procesal y al cumplimiento de
                obligaciones legales o contractuales. Una vez vencido el
                término, los datos serán eliminados o anonimizados, según
                aplique.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                9. MODIFICACIONES A LA POLÍTICA
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                QPAlliance podrá modificar esta política en cualquier momento.
                Las modificaciones serán comunicadas a través de los canales
                internos dispuestos por la firma. El uso continuado del sistema
                por parte de los usuarios implicará la aceptación de las nuevas
                condiciones.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">10. CONTACTO</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Para consultas, solicitudes o reclamos relacionados con el
                tratamiento de datos personales, los titulares podrán contactar
                a QPAlliance a través del correo:
                <a
                  href="mailto:notificacionesjudiciales@qpalliance.co"
                  className="text-pink-600 hover:text-pink-700 underline ml-1"
                >
                  notificacionesjudiciales@qpalliance.co
                </a>
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => setShowPrivacyModal(false)}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
