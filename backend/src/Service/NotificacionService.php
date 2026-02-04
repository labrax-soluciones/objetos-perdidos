<?php

namespace App\Service;

use App\Entity\Coincidencia;
use App\Entity\Notificacion;
use App\Entity\Solicitud;
use App\Entity\Usuario;
use App\Repository\DispositivoPushRepository;
use App\Repository\NotificacionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Twig\Environment;

class NotificacionService
{
    public function __construct(
        private EntityManagerInterface $em,
        private NotificacionRepository $notificacionRepository,
        private DispositivoPushRepository $dispositivoPushRepository,
        private MailerInterface $mailer,
        private Environment $twig,
        private string $frontendUrl
    ) {}

    public function enviarEmailVerificacion(Usuario $usuario): void
    {
        $url = $this->frontendUrl . '/verificar-email/' . $usuario->getEmailVerificationToken();

        $email = (new Email())
            ->to($usuario->getEmail())
            ->subject('Verifica tu email - Portal de Objetos Perdidos')
            ->html($this->twig->render('emails/verificacion.html.twig', [
                'usuario' => $usuario,
                'url' => $url
            ]));

        $this->mailer->send($email);
    }

    public function enviarEmailRecuperacionPassword(Usuario $usuario): void
    {
        $url = $this->frontendUrl . '/reset-password/' . $usuario->getPasswordResetToken();

        $email = (new Email())
            ->to($usuario->getEmail())
            ->subject('Recuperar contraseña - Portal de Objetos Perdidos')
            ->html($this->twig->render('emails/recuperar_password.html.twig', [
                'usuario' => $usuario,
                'url' => $url
            ]));

        $this->mailer->send($email);
    }

    public function notificarSolicitudAprobada(Solicitud $solicitud): void
    {
        $ciudadano = $solicitud->getCiudadano();
        $objeto = $solicitud->getObjeto();

        $notificacion = new Notificacion();
        $notificacion->setUsuario($ciudadano);
        $notificacion->setTipo(Notificacion::TIPO_ESTADO_OBJETO);
        $notificacion->setTitulo('Solicitud aprobada');
        $notificacion->setMensaje("Tu solicitud para el objeto \"{$objeto->getTitulo()}\" ha sido aprobada.");
        $notificacion->setData([
            'solicitudId' => $solicitud->getId(),
            'objetoId' => $objeto->getId()
        ]);

        $this->em->persist($notificacion);
        $this->em->flush();

        $this->enviarNotificacionEmail($ciudadano, $notificacion);
        $this->enviarNotificacionPush($ciudadano, $notificacion);
    }

    public function notificarSolicitudRechazada(Solicitud $solicitud): void
    {
        $ciudadano = $solicitud->getCiudadano();
        $objeto = $solicitud->getObjeto();

        $notificacion = new Notificacion();
        $notificacion->setUsuario($ciudadano);
        $notificacion->setTipo(Notificacion::TIPO_ESTADO_OBJETO);
        $notificacion->setTitulo('Solicitud rechazada');
        $notificacion->setMensaje("Tu solicitud para el objeto \"{$objeto->getTitulo()}\" ha sido rechazada. Motivo: {$solicitud->getMotivoRechazo()}");
        $notificacion->setData([
            'solicitudId' => $solicitud->getId(),
            'objetoId' => $objeto->getId()
        ]);

        $this->em->persist($notificacion);
        $this->em->flush();

        $this->enviarNotificacionEmail($ciudadano, $notificacion);
        $this->enviarNotificacionPush($ciudadano, $notificacion);
    }

    public function notificarObjetoEntregado(Solicitud $solicitud): void
    {
        $ciudadano = $solicitud->getCiudadano();
        $objeto = $solicitud->getObjeto();

        $notificacion = new Notificacion();
        $notificacion->setUsuario($ciudadano);
        $notificacion->setTipo(Notificacion::TIPO_ESTADO_OBJETO);
        $notificacion->setTitulo('Objeto entregado');
        $notificacion->setMensaje("El objeto \"{$objeto->getTitulo()}\" ha sido entregado correctamente.");
        $notificacion->setData([
            'solicitudId' => $solicitud->getId(),
            'objetoId' => $objeto->getId()
        ]);

        $this->em->persist($notificacion);
        $this->em->flush();

        $this->enviarNotificacionEmail($ciudadano, $notificacion);
    }

    public function notificarCitaProgramada(Solicitud $solicitud): void
    {
        $ciudadano = $solicitud->getCiudadano();
        $objeto = $solicitud->getObjeto();
        $fechaCita = $solicitud->getFechaCita()->format('d/m/Y H:i');

        $notificacion = new Notificacion();
        $notificacion->setUsuario($ciudadano);
        $notificacion->setTipo(Notificacion::TIPO_CITA);
        $notificacion->setTitulo('Cita programada');
        $notificacion->setMensaje("Tienes una cita para recoger el objeto \"{$objeto->getTitulo()}\" el {$fechaCita}.");
        $notificacion->setData([
            'solicitudId' => $solicitud->getId(),
            'objetoId' => $objeto->getId(),
            'fechaCita' => $solicitud->getFechaCita()->format('c')
        ]);

        $this->em->persist($notificacion);
        $this->em->flush();

        $this->enviarNotificacionEmail($ciudadano, $notificacion);
        $this->enviarNotificacionPush($ciudadano, $notificacion);
    }

    public function notificarCoincidenciaConfirmada(Coincidencia $coincidencia): void
    {
        $perdido = $coincidencia->getObjetoPerdido();
        $ciudadano = $perdido->getUsuarioReporta();

        if (!$ciudadano) {
            return;
        }

        $encontrado = $coincidencia->getObjetoEncontrado();

        $notificacion = new Notificacion();
        $notificacion->setUsuario($ciudadano);
        $notificacion->setTipo(Notificacion::TIPO_COINCIDENCIA);
        $notificacion->setTitulo('Posible coincidencia encontrada');
        $notificacion->setMensaje("Se ha encontrado un objeto que podría coincidir con \"{$perdido->getTitulo()}\". Por favor, revisa los detalles.");
        $notificacion->setData([
            'coincidenciaId' => $coincidencia->getId(),
            'objetoPerdidoId' => $perdido->getId(),
            'objetoEncontradoId' => $encontrado->getId()
        ]);

        $this->em->persist($notificacion);
        $this->em->flush();

        $this->enviarNotificacionEmail($ciudadano, $notificacion);
        $this->enviarNotificacionPush($ciudadano, $notificacion);
    }

    public function notificarAlertaObjeto(Usuario $ciudadano, $objeto, string $criterioCoincidente): void
    {
        $notificacion = new Notificacion();
        $notificacion->setUsuario($ciudadano);
        $notificacion->setTipo(Notificacion::TIPO_COINCIDENCIA);
        $notificacion->setTitulo('Nuevo objeto coincide con tu alerta');
        $notificacion->setMensaje("Se ha registrado un objeto que coincide con tu alerta: \"{$objeto->getTitulo()}\".");
        $notificacion->setData([
            'objetoId' => $objeto->getId(),
            'criterio' => $criterioCoincidente
        ]);

        $this->em->persist($notificacion);
        $this->em->flush();

        $this->enviarNotificacionEmail($ciudadano, $notificacion);
        $this->enviarNotificacionPush($ciudadano, $notificacion);
    }

    private function enviarNotificacionEmail(Usuario $usuario, Notificacion $notificacion): void
    {
        try {
            $email = (new Email())
                ->to($usuario->getEmail())
                ->subject($notificacion->getTitulo() . ' - Portal de Objetos Perdidos')
                ->html($this->twig->render('emails/notificacion.html.twig', [
                    'usuario' => $usuario,
                    'notificacion' => $notificacion
                ]));

            $this->mailer->send($email);
        } catch (\Exception $e) {
            // Log error but don't fail the operation
        }
    }

    private function enviarNotificacionPush(Usuario $usuario, Notificacion $notificacion): void
    {
        // Push notifications will be implemented with Firebase Cloud Messaging
        // For now, this is a stub
        $dispositivos = $this->dispositivoPushRepository->findActivosByUsuario($usuario->getId());

        foreach ($dispositivos as $dispositivo) {
            // TODO: Send push notification via FCM
            // This will be implemented in a later phase
        }
    }
}
