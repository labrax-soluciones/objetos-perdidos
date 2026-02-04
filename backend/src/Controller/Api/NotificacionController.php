<?php

namespace App\Controller\Api;

use App\Entity\Usuario;
use App\Repository\NotificacionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/notificaciones')]
class NotificacionController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private NotificacionRepository $notificacionRepository
    ) {}

    #[Route('', name: 'api_notificaciones_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $notificaciones = $this->notificacionRepository->findByUsuario($usuario->getId());
        $noLeidas = $this->notificacionRepository->countNoLeidas($usuario->getId());

        $data = [];
        foreach ($notificaciones as $notificacion) {
            $data[] = [
                'id' => $notificacion->getId(),
                'tipo' => $notificacion->getTipo(),
                'titulo' => $notificacion->getTitulo(),
                'mensaje' => $notificacion->getMensaje(),
                'leida' => $notificacion->isLeida(),
                'data' => $notificacion->getData(),
                'createdAt' => $notificacion->getCreatedAt()?->format('c')
            ];
        }

        return $this->json([
            'data' => $data,
            'noLeidas' => $noLeidas
        ]);
    }

    #[Route('/{id}/leer', name: 'api_notificaciones_read', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function markAsRead(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $notificacion = $this->notificacionRepository->find($id);

        if (!$notificacion || $notificacion->getUsuario() !== $usuario) {
            return $this->json(['error' => 'Notificación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $notificacion->marcarComoLeida();
        $this->em->flush();

        return $this->json(['message' => 'Notificación marcada como leída']);
    }

    #[Route('/leer-todas', name: 'api_notificaciones_read_all', methods: ['PUT'])]
    public function markAllAsRead(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $this->notificacionRepository->marcarTodasComoLeidas($usuario->getId());

        return $this->json(['message' => 'Todas las notificaciones marcadas como leídas']);
    }
}
