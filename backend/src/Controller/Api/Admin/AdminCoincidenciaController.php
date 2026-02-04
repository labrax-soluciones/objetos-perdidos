<?php

namespace App\Controller\Api\Admin;

use App\Entity\Coincidencia;
use App\Entity\Usuario;
use App\Repository\CoincidenciaRepository;
use App\Service\NotificacionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/coincidencias')]
class AdminCoincidenciaController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private CoincidenciaRepository $coincidenciaRepository,
        private NotificacionService $notificacionService
    ) {}

    #[Route('', name: 'api_admin_coincidencias_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $estado = $request->query->get('estado');
        $ayuntamientoId = $usuario->isSuperAdmin()
            ? $request->query->get('ayuntamiento')
            : $usuario->getAyuntamiento()->getId();

        $coincidencias = $this->coincidenciaRepository->findByAyuntamiento($ayuntamientoId, $estado);

        $data = [];
        foreach ($coincidencias as $coincidencia) {
            $encontrado = $coincidencia->getObjetoEncontrado();
            $perdido = $coincidencia->getObjetoPerdido();
            $fotoEncontrado = $encontrado->getFotoPrincipal();
            $fotoPerdido = $perdido->getFotoPrincipal();

            $data[] = [
                'id' => $coincidencia->getId(),
                'puntuacion' => $coincidencia->getPuntuacion(),
                'estado' => $coincidencia->getEstado(),
                'createdAt' => $coincidencia->getCreatedAt()?->format('c'),
                'objetoEncontrado' => [
                    'id' => $encontrado->getId(),
                    'codigoUnico' => $encontrado->getCodigoUnico(),
                    'titulo' => $encontrado->getTitulo(),
                    'categoria' => $encontrado->getCategoria()?->getNombre(),
                    'color' => $encontrado->getColor(),
                    'fotoPrincipal' => $fotoEncontrado ? [
                        'thumbnailUrl' => $fotoEncontrado->getThumbnailUrl()
                    ] : null
                ],
                'objetoPerdido' => [
                    'id' => $perdido->getId(),
                    'codigoUnico' => $perdido->getCodigoUnico(),
                    'titulo' => $perdido->getTitulo(),
                    'categoria' => $perdido->getCategoria()?->getNombre(),
                    'color' => $perdido->getColor(),
                    'reportadoPor' => $perdido->getUsuarioReporta()?->getNombreCompleto(),
                    'fotoPrincipal' => $fotoPerdido ? [
                        'thumbnailUrl' => $fotoPerdido->getThumbnailUrl()
                    ] : null
                ]
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/{id}', name: 'api_admin_coincidencias_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $coincidencia = $this->coincidenciaRepository->find($id);

        if (!$coincidencia) {
            return $this->json(['error' => 'Coincidencia no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $encontrado = $coincidencia->getObjetoEncontrado();

        if (!$usuario->isSuperAdmin() && $encontrado->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $perdido = $coincidencia->getObjetoPerdido();

        $fotosEncontrado = [];
        foreach ($encontrado->getFotos() as $foto) {
            $fotosEncontrado[] = [
                'id' => $foto->getId(),
                'url' => $foto->getUrl(),
                'thumbnailUrl' => $foto->getThumbnailUrl()
            ];
        }

        $fotosPerdido = [];
        foreach ($perdido->getFotos() as $foto) {
            $fotosPerdido[] = [
                'id' => $foto->getId(),
                'url' => $foto->getUrl(),
                'thumbnailUrl' => $foto->getThumbnailUrl()
            ];
        }

        return $this->json([
            'id' => $coincidencia->getId(),
            'puntuacion' => $coincidencia->getPuntuacion(),
            'estado' => $coincidencia->getEstado(),
            'detallesCoincidencia' => $coincidencia->getDetallesCoincidencia(),
            'notas' => $coincidencia->getNotas(),
            'validadoPor' => $coincidencia->getValidadoPor()?->getNombreCompleto(),
            'createdAt' => $coincidencia->getCreatedAt()?->format('c'),
            'objetoEncontrado' => [
                'id' => $encontrado->getId(),
                'codigoUnico' => $encontrado->getCodigoUnico(),
                'titulo' => $encontrado->getTitulo(),
                'descripcion' => $encontrado->getDescripcion(),
                'categoria' => $encontrado->getCategoria()?->getNombre(),
                'marca' => $encontrado->getMarca(),
                'modelo' => $encontrado->getModelo(),
                'color' => $encontrado->getColor(),
                'fechaHallazgo' => $encontrado->getFechaHallazgo()?->format('Y-m-d'),
                'direccionHallazgo' => $encontrado->getDireccionHallazgo(),
                'fotos' => $fotosEncontrado
            ],
            'objetoPerdido' => [
                'id' => $perdido->getId(),
                'codigoUnico' => $perdido->getCodigoUnico(),
                'titulo' => $perdido->getTitulo(),
                'descripcion' => $perdido->getDescripcion(),
                'categoria' => $perdido->getCategoria()?->getNombre(),
                'marca' => $perdido->getMarca(),
                'modelo' => $perdido->getModelo(),
                'color' => $perdido->getColor(),
                'fechaHallazgo' => $perdido->getFechaHallazgo()?->format('Y-m-d'),
                'direccionHallazgo' => $perdido->getDireccionHallazgo(),
                'reportadoPor' => [
                    'nombre' => $perdido->getUsuarioReporta()?->getNombreCompleto(),
                    'email' => $perdido->getUsuarioReporta()?->getEmail(),
                    'telefono' => $perdido->getUsuarioReporta()?->getTelefono()
                ],
                'fotos' => $fotosPerdido
            ]
        ]);
    }

    #[Route('/{id}/confirmar', name: 'api_admin_coincidencias_confirmar', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function confirmar(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $coincidencia = $this->coincidenciaRepository->find($id);

        if (!$coincidencia) {
            return $this->json(['error' => 'Coincidencia no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $encontrado = $coincidencia->getObjetoEncontrado();

        if (!$usuario->isSuperAdmin() && $encontrado->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        if (!$coincidencia->isPendiente()) {
            return $this->json(['error' => 'La coincidencia ya ha sido procesada'], Response::HTTP_BAD_REQUEST);
        }

        $coincidencia->confirmar($usuario);
        $this->em->flush();

        // Notify the citizen who reported the lost object
        $perdido = $coincidencia->getObjetoPerdido();
        if ($perdido->getUsuarioReporta()) {
            $this->notificacionService->notificarCoincidenciaConfirmada($coincidencia);
        }

        return $this->json(['message' => 'Coincidencia confirmada']);
    }

    #[Route('/{id}/descartar', name: 'api_admin_coincidencias_descartar', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function descartar(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $coincidencia = $this->coincidenciaRepository->find($id);

        if (!$coincidencia) {
            return $this->json(['error' => 'Coincidencia no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $encontrado = $coincidencia->getObjetoEncontrado();

        if (!$usuario->isSuperAdmin() && $encontrado->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        if (!$coincidencia->isPendiente()) {
            return $this->json(['error' => 'La coincidencia ya ha sido procesada'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        $notas = $data['notas'] ?? null;

        $coincidencia->descartar($usuario, $notas);
        $this->em->flush();

        return $this->json(['message' => 'Coincidencia descartada']);
    }
}
