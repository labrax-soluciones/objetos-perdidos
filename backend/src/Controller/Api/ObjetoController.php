<?php

namespace App\Controller\Api;

use App\Entity\Objeto;
use App\Entity\Solicitud;
use App\Entity\Usuario;
use App\Repository\CategoriaRepository;
use App\Repository\ObjetoRepository;
use App\Repository\SolicitudRepository;
use App\Service\CoincidenciaService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/api/objetos')]
class ObjetoController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ObjetoRepository $objetoRepository,
        private CategoriaRepository $categoriaRepository,
        private SolicitudRepository $solicitudRepository,
        private SerializerInterface $serializer,
        private CoincidenciaService $coincidenciaService
    ) {}

    #[Route('', name: 'api_objetos_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $filters = [
            'categoria_id' => $request->query->get('categoria'),
            'color' => $request->query->get('color'),
            'busqueda' => $request->query->get('q'),
            'fecha_desde' => $request->query->get('fecha_desde'),
            'fecha_hasta' => $request->query->get('fecha_hasta'),
            'ayuntamiento_id' => $request->query->get('ayuntamiento'),
        ];

        // Remove null values
        $filters = array_filter($filters, fn($v) => $v !== null);

        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(50, max(1, (int) $request->query->get('limit', 20)));

        $objetos = $this->objetoRepository->findObjetosPublicos($filters, $page, $limit);
        $total = $this->objetoRepository->countObjetosPublicos($filters);

        $data = [];
        foreach ($objetos as $objeto) {
            $data[] = $this->serializeObjetoList($objeto);
        }

        return $this->json([
            'data' => $data,
            'meta' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    #[Route('/{id}', name: 'api_objetos_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $objeto = $this->objetoRepository->find($id);

        if (!$objeto) {
            return $this->json(['error' => 'Objeto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Only show public objects (found and available)
        if (!$objeto->isEncontrado() || !$objeto->isDisponible()) {
            /** @var Usuario|null $user */
            $user = $this->getUser();

            // Allow admins or the reporter to see the object
            if (!$user || (!$user->isAdmin() && $objeto->getUsuarioReporta() !== $user)) {
                return $this->json(['error' => 'Objeto no disponible'], Response::HTTP_NOT_FOUND);
            }
        }

        return $this->json($this->serializeObjetoDetalle($objeto));
    }

    #[Route('/perdidos', name: 'api_objetos_perdidos_create', methods: ['POST'])]
    public function reportarPerdido(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        $objeto = new Objeto();
        $objeto->setTipo(Objeto::TIPO_PERDIDO);
        $objeto->setEstado(Objeto::ESTADO_REGISTRADO);
        $objeto->setTitulo($data['titulo'] ?? '');
        $objeto->setDescripcion($data['descripcion'] ?? null);
        $objeto->setMarca($data['marca'] ?? null);
        $objeto->setModelo($data['modelo'] ?? null);
        $objeto->setColor($data['color'] ?? null);
        $objeto->setNumeroSerie($data['numeroSerie'] ?? null);
        $objeto->setDireccionHallazgo($data['direccionPerdida'] ?? null);
        $objeto->setLatitud($data['latitud'] ?? null);
        $objeto->setLongitud($data['longitud'] ?? null);
        $objeto->setUsuarioReporta($usuario);

        if (isset($data['fechaPerdida'])) {
            $objeto->setFechaHallazgo(new \DateTime($data['fechaPerdida']));
        }

        if (isset($data['categoriaId'])) {
            $categoria = $this->categoriaRepository->find($data['categoriaId']);
            if ($categoria) {
                $objeto->setCategoria($categoria);
            }
        }

        // Set ayuntamiento from user or from request
        if ($usuario->getAyuntamiento()) {
            $objeto->setAyuntamiento($usuario->getAyuntamiento());
        } elseif (isset($data['ayuntamientoId'])) {
            $ayuntamiento = $this->em->getRepository(\App\Entity\Ayuntamiento::class)->find($data['ayuntamientoId']);
            if ($ayuntamiento) {
                $objeto->setAyuntamiento($ayuntamiento);
            }
        }

        if (!$objeto->getAyuntamiento()) {
            return $this->json(['error' => 'Debe especificar un ayuntamiento'], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($objeto);
        $this->em->flush();

        // Search for matches
        $this->coincidenciaService->buscarCoincidenciasParaPerdido($objeto);

        return $this->json([
            'message' => 'Objeto perdido registrado correctamente',
            'id' => $objeto->getId(),
            'codigo' => $objeto->getCodigoUnico()
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}/solicitar', name: 'api_objetos_solicitar', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function solicitarRecuperacion(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $objeto = $this->objetoRepository->find($id);

        if (!$objeto) {
            return $this->json(['error' => 'Objeto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$objeto->isEncontrado() || !$objeto->isDisponible()) {
            return $this->json(['error' => 'Este objeto no está disponible para reclamar'], Response::HTTP_BAD_REQUEST);
        }

        // Check if user already has a pending request
        $existingSolicitud = $this->solicitudRepository->findOneBy([
            'objeto' => $objeto,
            'ciudadano' => $usuario,
            'estado' => Solicitud::ESTADO_PENDIENTE
        ]);

        if ($existingSolicitud) {
            return $this->json(['error' => 'Ya tienes una solicitud pendiente para este objeto'], Response::HTTP_CONFLICT);
        }

        $data = json_decode($request->getContent(), true);

        $solicitud = new Solicitud();
        $solicitud->setObjeto($objeto);
        $solicitud->setCiudadano($usuario);
        $solicitud->setDescripcionReclamacion($data['descripcion'] ?? null);
        $solicitud->setTipoEntrega($data['tipoEntrega'] ?? Solicitud::TIPO_ENTREGA_PRESENCIAL);
        $solicitud->setDireccionEnvio($data['direccionEnvio'] ?? null);

        $this->em->persist($solicitud);

        // Update object state
        $objeto->setEstado(Objeto::ESTADO_RECLAMADO);

        $this->em->flush();

        return $this->json([
            'message' => 'Solicitud de recuperación enviada correctamente',
            'id' => $solicitud->getId()
        ], Response::HTTP_CREATED);
    }

    #[Route('/buscar-imagen', name: 'api_objetos_buscar_imagen', methods: ['POST'])]
    public function buscarPorImagen(Request $request): JsonResponse
    {
        // This endpoint is prepared for AI image search
        // Implementation will be added in a later phase
        return $this->json([
            'message' => 'Búsqueda por imagen no implementada todavía',
            'data' => []
        ]);
    }

    private function serializeObjetoList(Objeto $objeto): array
    {
        $fotoPrincipal = $objeto->getFotoPrincipal();

        return [
            'id' => $objeto->getId(),
            'codigoUnico' => $objeto->getCodigoUnico(),
            'titulo' => $objeto->getTitulo(),
            'tipo' => $objeto->getTipo(),
            'estado' => $objeto->getEstado(),
            'categoria' => $objeto->getCategoria() ? [
                'id' => $objeto->getCategoria()->getId(),
                'nombre' => $objeto->getCategoria()->getNombre()
            ] : null,
            'color' => $objeto->getColor(),
            'fechaHallazgo' => $objeto->getFechaHallazgo()?->format('Y-m-d'),
            'direccionHallazgo' => $objeto->getDireccionHallazgo(),
            'fotoPrincipal' => $fotoPrincipal ? [
                'url' => $fotoPrincipal->getUrl(),
                'thumbnailUrl' => $fotoPrincipal->getThumbnailUrl()
            ] : null,
            'createdAt' => $objeto->getCreatedAt()?->format('c')
        ];
    }

    private function serializeObjetoDetalle(Objeto $objeto): array
    {
        $fotos = [];
        foreach ($objeto->getFotos() as $foto) {
            $fotos[] = [
                'id' => $foto->getId(),
                'url' => $foto->getUrl(),
                'thumbnailUrl' => $foto->getThumbnailUrl(),
                'esPrincipal' => $foto->isEsPrincipal(),
                'orden' => $foto->getOrden()
            ];
        }

        return [
            'id' => $objeto->getId(),
            'codigoUnico' => $objeto->getCodigoUnico(),
            'tipo' => $objeto->getTipo(),
            'estado' => $objeto->getEstado(),
            'titulo' => $objeto->getTitulo(),
            'descripcion' => $objeto->getDescripcion(),
            'categoria' => $objeto->getCategoria() ? [
                'id' => $objeto->getCategoria()->getId(),
                'nombre' => $objeto->getCategoria()->getNombre(),
                'rutaCompleta' => $objeto->getCategoria()->getRutaCompleta()
            ] : null,
            'marca' => $objeto->getMarca(),
            'modelo' => $objeto->getModelo(),
            'color' => $objeto->getColor(),
            'fechaHallazgo' => $objeto->getFechaHallazgo()?->format('Y-m-d'),
            'horaHallazgo' => $objeto->getHoraHallazgo()?->format('H:i'),
            'direccionHallazgo' => $objeto->getDireccionHallazgo(),
            'latitud' => $objeto->getLatitud(),
            'longitud' => $objeto->getLongitud(),
            'ayuntamiento' => $objeto->getAyuntamiento() ? [
                'id' => $objeto->getAyuntamiento()->getId(),
                'nombre' => $objeto->getAyuntamiento()->getNombre()
            ] : null,
            'fotos' => $fotos,
            'createdAt' => $objeto->getCreatedAt()?->format('c'),
            'updatedAt' => $objeto->getUpdatedAt()?->format('c')
        ];
    }
}
