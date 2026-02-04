<?php

namespace App\Controller\Api\Admin;

use App\Entity\Acta;
use App\Entity\Objeto;
use App\Entity\Solicitud;
use App\Entity\Usuario;
use App\Repository\SolicitudRepository;
use App\Service\NotificacionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/solicitudes')]
class AdminSolicitudController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SolicitudRepository $solicitudRepository,
        private NotificacionService $notificacionService
    ) {}

    #[Route('', name: 'api_admin_solicitudes_list', methods: ['GET'])]
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

        $solicitudes = $this->solicitudRepository->findByAyuntamiento($ayuntamientoId, $estado);

        $data = [];
        foreach ($solicitudes as $solicitud) {
            $objeto = $solicitud->getObjeto();
            $ciudadano = $solicitud->getCiudadano();
            $fotoPrincipal = $objeto->getFotoPrincipal();

            $data[] = [
                'id' => $solicitud->getId(),
                'estado' => $solicitud->getEstado(),
                'tipoEntrega' => $solicitud->getTipoEntrega(),
                'fechaCita' => $solicitud->getFechaCita()?->format('c'),
                'createdAt' => $solicitud->getCreatedAt()?->format('c'),
                'objeto' => [
                    'id' => $objeto->getId(),
                    'codigoUnico' => $objeto->getCodigoUnico(),
                    'titulo' => $objeto->getTitulo(),
                    'fotoPrincipal' => $fotoPrincipal ? [
                        'thumbnailUrl' => $fotoPrincipal->getThumbnailUrl()
                    ] : null
                ],
                'ciudadano' => [
                    'id' => $ciudadano->getId(),
                    'nombre' => $ciudadano->getNombreCompleto(),
                    'email' => $ciudadano->getEmail()
                ]
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/{id}', name: 'api_admin_solicitudes_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $solicitud = $this->solicitudRepository->find($id);

        if (!$solicitud) {
            return $this->json(['error' => 'Solicitud no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $objeto = $solicitud->getObjeto();

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $ciudadano = $solicitud->getCiudadano();

        $fotos = [];
        foreach ($objeto->getFotos() as $foto) {
            $fotos[] = [
                'id' => $foto->getId(),
                'url' => $foto->getUrl(),
                'thumbnailUrl' => $foto->getThumbnailUrl()
            ];
        }

        return $this->json([
            'id' => $solicitud->getId(),
            'estado' => $solicitud->getEstado(),
            'descripcionReclamacion' => $solicitud->getDescripcionReclamacion(),
            'documentosAdjuntos' => $solicitud->getDocumentosAdjuntos(),
            'motivoRechazo' => $solicitud->getMotivoRechazo(),
            'tipoEntrega' => $solicitud->getTipoEntrega(),
            'direccionEnvio' => $solicitud->getDireccionEnvio(),
            'fechaCita' => $solicitud->getFechaCita()?->format('c'),
            'createdAt' => $solicitud->getCreatedAt()?->format('c'),
            'objeto' => [
                'id' => $objeto->getId(),
                'codigoUnico' => $objeto->getCodigoUnico(),
                'titulo' => $objeto->getTitulo(),
                'descripcion' => $objeto->getDescripcion(),
                'categoria' => $objeto->getCategoria()?->getNombre(),
                'marca' => $objeto->getMarca(),
                'modelo' => $objeto->getModelo(),
                'color' => $objeto->getColor(),
                'fotos' => $fotos
            ],
            'ciudadano' => [
                'id' => $ciudadano->getId(),
                'nombre' => $ciudadano->getNombreCompleto(),
                'email' => $ciudadano->getEmail(),
                'telefono' => $ciudadano->getTelefono(),
                'dni' => $ciudadano->getDni()
            ]
        ]);
    }

    #[Route('/{id}/validar', name: 'api_admin_solicitudes_validar', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function validar(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $solicitud = $this->solicitudRepository->find($id);

        if (!$solicitud) {
            return $this->json(['error' => 'Solicitud no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $objeto = $solicitud->getObjeto();

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        if ($solicitud->getEstado() !== Solicitud::ESTADO_PENDIENTE && $solicitud->getEstado() !== Solicitud::ESTADO_VALIDANDO) {
            return $this->json(['error' => 'La solicitud no está pendiente'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        $solicitud->setEstado(Solicitud::ESTADO_APROBADA);

        if (isset($data['fechaCita'])) {
            $solicitud->setFechaCita(new \DateTime($data['fechaCita']));
        }

        $this->em->flush();

        // Notify citizen
        $this->notificacionService->notificarSolicitudAprobada($solicitud);

        return $this->json(['message' => 'Solicitud aprobada correctamente']);
    }

    #[Route('/{id}/rechazar', name: 'api_admin_solicitudes_rechazar', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function rechazar(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $solicitud = $this->solicitudRepository->find($id);

        if (!$solicitud) {
            return $this->json(['error' => 'Solicitud no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $objeto = $solicitud->getObjeto();

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        $solicitud->setEstado(Solicitud::ESTADO_RECHAZADA);
        $solicitud->setMotivoRechazo($data['motivo'] ?? 'No especificado');

        // Return object to available state
        $objeto->setEstado(Objeto::ESTADO_EN_ALMACEN);

        $this->em->flush();

        // Notify citizen
        $this->notificacionService->notificarSolicitudRechazada($solicitud);

        return $this->json(['message' => 'Solicitud rechazada']);
    }

    #[Route('/{id}/entregar', name: 'api_admin_solicitudes_entregar', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function entregar(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $solicitud = $this->solicitudRepository->find($id);

        if (!$solicitud) {
            return $this->json(['error' => 'Solicitud no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $objeto = $solicitud->getObjeto();

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        if ($solicitud->getEstado() !== Solicitud::ESTADO_APROBADA) {
            return $this->json(['error' => 'La solicitud debe estar aprobada para entregar'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        $solicitud->setEstado(Solicitud::ESTADO_ENTREGADA);
        $objeto->setEstado(Objeto::ESTADO_ENTREGADO);

        // Free storage location
        if ($objeto->getUbicacionAlmacen()) {
            $objeto->getUbicacionAlmacen()->decrementarOcupacion();
            $objeto->setUbicacionAlmacen(null);
        }

        // Create delivery act
        $acta = new Acta();
        $acta->setTipo(Acta::TIPO_ENTREGA);
        $acta->setObjeto($objeto);
        $acta->setUsuarioEntrega($usuario);
        $acta->setUsuarioRecibe($solicitud->getCiudadano());
        $acta->setObservaciones($data['observaciones'] ?? null);

        $this->em->persist($acta);
        $this->em->flush();

        // Notify citizen
        $this->notificacionService->notificarObjetoEntregado($solicitud);

        return $this->json([
            'message' => 'Objeto entregado correctamente',
            'actaId' => $acta->getId(),
            'actaCodigo' => $acta->getCodigo()
        ]);
    }

    #[Route('/{id}/cita', name: 'api_admin_solicitudes_cita', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function programarCita(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $solicitud = $this->solicitudRepository->find($id);

        if (!$solicitud) {
            return $this->json(['error' => 'Solicitud no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $objeto = $solicitud->getObjeto();

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (!isset($data['fechaCita'])) {
            return $this->json(['error' => 'Debe especificar una fecha para la cita'], Response::HTTP_BAD_REQUEST);
        }

        $solicitud->setFechaCita(new \DateTime($data['fechaCita']));
        $this->em->flush();

        // Notify citizen
        $this->notificacionService->notificarCitaProgramada($solicitud);

        return $this->json(['message' => 'Cita programada correctamente']);
    }
}
