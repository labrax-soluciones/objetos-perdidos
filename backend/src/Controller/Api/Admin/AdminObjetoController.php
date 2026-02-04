<?php

namespace App\Controller\Api\Admin;

use App\Entity\MovimientoObjeto;
use App\Entity\Objeto;
use App\Entity\ObjetoFoto;
use App\Entity\Usuario;
use App\Repository\CategoriaRepository;
use App\Repository\ObjetoRepository;
use App\Repository\UbicacionRepository;
use App\Service\CoincidenciaService;
use App\Service\FileUploadService;
use App\Service\QRCodeService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/objetos')]
class AdminObjetoController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ObjetoRepository $objetoRepository,
        private CategoriaRepository $categoriaRepository,
        private UbicacionRepository $ubicacionRepository,
        private FileUploadService $fileUploadService,
        private QRCodeService $qrCodeService,
        private CoincidenciaService $coincidenciaService
    ) {}

    #[Route('', name: 'api_admin_objetos_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $filters = [
            'tipo' => $request->query->get('tipo'),
            'estado' => $request->query->get('estado'),
            'categoria_id' => $request->query->get('categoria'),
            'busqueda' => $request->query->get('q'),
        ];

        if (!$usuario->isSuperAdmin()) {
            $filters['ayuntamiento_id'] = $usuario->getAyuntamiento()->getId();
        } elseif ($request->query->get('ayuntamiento')) {
            $filters['ayuntamiento_id'] = $request->query->get('ayuntamiento');
        }

        $filters = array_filter($filters, fn($v) => $v !== null);

        $page = max(1, (int) $request->query->get('page', 1));
        $limit = min(100, max(1, (int) $request->query->get('limit', 20)));

        $qb = $this->objetoRepository->createSearchQueryBuilder($filters);
        $total = (int) (clone $qb)->select('COUNT(o.id)')->getQuery()->getSingleScalarResult();

        $objetos = $qb->orderBy('o.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();

        $data = [];
        foreach ($objetos as $objeto) {
            $fotoPrincipal = $objeto->getFotoPrincipal();
            $data[] = [
                'id' => $objeto->getId(),
                'codigoUnico' => $objeto->getCodigoUnico(),
                'titulo' => $objeto->getTitulo(),
                'tipo' => $objeto->getTipo(),
                'estado' => $objeto->getEstado(),
                'categoria' => $objeto->getCategoria() ? [
                    'id' => $objeto->getCategoria()->getId(),
                    'nombre' => $objeto->getCategoria()->getNombre()
                ] : null,
                'ubicacionAlmacen' => $objeto->getUbicacionAlmacen() ? [
                    'codigo' => $objeto->getUbicacionAlmacen()->getCodigoCompleto()
                ] : null,
                'fotoPrincipal' => $fotoPrincipal ? [
                    'thumbnailUrl' => $fotoPrincipal->getThumbnailUrl()
                ] : null,
                'createdAt' => $objeto->getCreatedAt()?->format('c')
            ];
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

    #[Route('', name: 'api_admin_objetos_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        $objeto = new Objeto();
        $objeto->setTipo(Objeto::TIPO_ENCONTRADO);
        $objeto->setEstado(Objeto::ESTADO_REGISTRADO);
        $objeto->setTitulo($data['titulo'] ?? '');
        $objeto->setDescripcion($data['descripcion'] ?? null);
        $objeto->setMarca($data['marca'] ?? null);
        $objeto->setModelo($data['modelo'] ?? null);
        $objeto->setColor($data['color'] ?? null);
        $objeto->setNumeroSerie($data['numeroSerie'] ?? null);
        $objeto->setDireccionHallazgo($data['direccionHallazgo'] ?? null);
        $objeto->setLatitud($data['latitud'] ?? null);
        $objeto->setLongitud($data['longitud'] ?? null);
        $objeto->setValorEstimado($data['valorEstimado'] ?? null);
        $objeto->setUsuarioReporta($usuario);

        if (isset($data['fechaHallazgo'])) {
            $objeto->setFechaHallazgo(new \DateTime($data['fechaHallazgo']));
        }

        if (isset($data['horaHallazgo'])) {
            $objeto->setHoraHallazgo(new \DateTime($data['horaHallazgo']));
        }

        if (isset($data['categoriaId'])) {
            $categoria = $this->categoriaRepository->find($data['categoriaId']);
            if ($categoria) {
                $objeto->setCategoria($categoria);
            }
        }

        // Set ayuntamiento
        if ($usuario->isSuperAdmin() && isset($data['ayuntamientoId'])) {
            $ayuntamiento = $this->em->getRepository(\App\Entity\Ayuntamiento::class)->find($data['ayuntamientoId']);
            if ($ayuntamiento) {
                $objeto->setAyuntamiento($ayuntamiento);
            }
        } else {
            $objeto->setAyuntamiento($usuario->getAyuntamiento());
        }

        if (!$objeto->getAyuntamiento()) {
            return $this->json(['error' => 'Debe especificar un ayuntamiento'], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($objeto);
        $this->em->flush();

        // Generate QR code
        $qrUrl = $this->qrCodeService->generateForObjeto($objeto);
        $objeto->setQrCode($qrUrl);
        $this->em->flush();

        // Search for matches with lost objects
        $this->coincidenciaService->buscarCoincidenciasParaEncontrado($objeto);

        return $this->json([
            'message' => 'Objeto registrado correctamente',
            'id' => $objeto->getId(),
            'codigo' => $objeto->getCodigoUnico(),
            'qrCode' => $objeto->getQrCode()
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_admin_objetos_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $objeto = $this->objetoRepository->find($id);

        if (!$objeto) {
            return $this->json(['error' => 'Objeto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $fotos = [];
        foreach ($objeto->getFotos() as $foto) {
            $fotos[] = [
                'id' => $foto->getId(),
                'url' => $foto->getUrl(),
                'thumbnailUrl' => $foto->getThumbnailUrl(),
                'esPrincipal' => $foto->isEsPrincipal(),
                'textoOcr' => $foto->getTextoOcr()
            ];
        }

        $movimientos = [];
        foreach ($objeto->getMovimientos() as $movimiento) {
            $movimientos[] = [
                'id' => $movimiento->getId(),
                'tipo' => $movimiento->getTipo(),
                'motivo' => $movimiento->getMotivo(),
                'ubicacionOrigen' => $movimiento->getUbicacionOrigen()?->getCodigoCompleto(),
                'ubicacionDestino' => $movimiento->getUbicacionDestino()?->getCodigoCompleto(),
                'usuario' => $movimiento->getUsuario()->getNombreCompleto(),
                'createdAt' => $movimiento->getCreatedAt()?->format('c')
            ];
        }

        return $this->json([
            'id' => $objeto->getId(),
            'codigoUnico' => $objeto->getCodigoUnico(),
            'tipo' => $objeto->getTipo(),
            'estado' => $objeto->getEstado(),
            'titulo' => $objeto->getTitulo(),
            'descripcion' => $objeto->getDescripcion(),
            'categoria' => $objeto->getCategoria() ? [
                'id' => $objeto->getCategoria()->getId(),
                'nombre' => $objeto->getCategoria()->getNombre()
            ] : null,
            'marca' => $objeto->getMarca(),
            'modelo' => $objeto->getModelo(),
            'color' => $objeto->getColor(),
            'numeroSerie' => $objeto->getNumeroSerie(),
            'fechaHallazgo' => $objeto->getFechaHallazgo()?->format('Y-m-d'),
            'horaHallazgo' => $objeto->getHoraHallazgo()?->format('H:i'),
            'direccionHallazgo' => $objeto->getDireccionHallazgo(),
            'latitud' => $objeto->getLatitud(),
            'longitud' => $objeto->getLongitud(),
            'ubicacionAlmacen' => $objeto->getUbicacionAlmacen() ? [
                'id' => $objeto->getUbicacionAlmacen()->getId(),
                'codigo' => $objeto->getUbicacionAlmacen()->getCodigoCompleto()
            ] : null,
            'qrCode' => $objeto->getQrCode(),
            'valorEstimado' => $objeto->getValorEstimado(),
            'metadataIa' => $objeto->getMetadataIa(),
            'fotos' => $fotos,
            'movimientos' => $movimientos,
            'createdAt' => $objeto->getCreatedAt()?->format('c'),
            'updatedAt' => $objeto->getUpdatedAt()?->format('c')
        ]);
    }

    #[Route('/{id}', name: 'api_admin_objetos_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $objeto = $this->objetoRepository->find($id);

        if (!$objeto) {
            return $this->json(['error' => 'Objeto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['titulo'])) {
            $objeto->setTitulo($data['titulo']);
        }
        if (isset($data['descripcion'])) {
            $objeto->setDescripcion($data['descripcion']);
        }
        if (isset($data['marca'])) {
            $objeto->setMarca($data['marca']);
        }
        if (isset($data['modelo'])) {
            $objeto->setModelo($data['modelo']);
        }
        if (isset($data['color'])) {
            $objeto->setColor($data['color']);
        }
        if (isset($data['numeroSerie'])) {
            $objeto->setNumeroSerie($data['numeroSerie']);
        }
        if (isset($data['estado'])) {
            $objeto->setEstado($data['estado']);
        }
        if (isset($data['categoriaId'])) {
            $categoria = $this->categoriaRepository->find($data['categoriaId']);
            $objeto->setCategoria($categoria);
        }
        if (isset($data['valorEstimado'])) {
            $objeto->setValorEstimado($data['valorEstimado']);
        }

        $this->em->flush();

        return $this->json(['message' => 'Objeto actualizado correctamente']);
    }

    #[Route('/{id}', name: 'api_admin_objetos_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $objeto = $this->objetoRepository->find($id);

        if (!$objeto) {
            return $this->json(['error' => 'Objeto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $this->em->remove($objeto);
        $this->em->flush();

        return $this->json(['message' => 'Objeto eliminado correctamente']);
    }

    #[Route('/{id}/ubicar', name: 'api_admin_objetos_ubicar', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function ubicar(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $objeto = $this->objetoRepository->find($id);

        if (!$objeto) {
            return $this->json(['error' => 'Objeto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $ubicacionId = $data['ubicacionId'] ?? null;

        if (!$ubicacionId) {
            return $this->json(['error' => 'Debe especificar una ubicación'], Response::HTTP_BAD_REQUEST);
        }

        $ubicacion = $this->ubicacionRepository->find($ubicacionId);

        if (!$ubicacion) {
            return $this->json(['error' => 'Ubicación no encontrada'], Response::HTTP_NOT_FOUND);
        }

        if (!$ubicacion->tieneEspacio()) {
            return $this->json(['error' => 'La ubicación está llena'], Response::HTTP_BAD_REQUEST);
        }

        // Create movement record
        $movimiento = new MovimientoObjeto();
        $movimiento->setObjeto($objeto);
        $movimiento->setUbicacionOrigen($objeto->getUbicacionAlmacen());
        $movimiento->setUbicacionDestino($ubicacion);
        $movimiento->setUsuario($usuario);
        $movimiento->setTipo($objeto->getUbicacionAlmacen() ? MovimientoObjeto::TIPO_MOVIMIENTO : MovimientoObjeto::TIPO_ENTRADA);
        $movimiento->setMotivo($data['motivo'] ?? null);

        // Update ocupation
        if ($objeto->getUbicacionAlmacen()) {
            $objeto->getUbicacionAlmacen()->decrementarOcupacion();
        }
        $ubicacion->incrementarOcupacion();

        $objeto->setUbicacionAlmacen($ubicacion);
        $objeto->setEstado(Objeto::ESTADO_EN_ALMACEN);

        $this->em->persist($movimiento);
        $this->em->flush();

        return $this->json([
            'message' => 'Objeto ubicado correctamente',
            'ubicacion' => $ubicacion->getCodigoCompleto()
        ]);
    }

    #[Route('/{id}/qr', name: 'api_admin_objetos_qr', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function generarQR(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $objeto = $this->objetoRepository->find($id);

        if (!$objeto) {
            return $this->json(['error' => 'Objeto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $qrUrl = $this->qrCodeService->generateForObjeto($objeto);
        $objeto->setQrCode($qrUrl);
        $this->em->flush();

        return $this->json([
            'message' => 'QR generado correctamente',
            'qrCode' => $qrUrl
        ]);
    }

    #[Route('/{id}/fotos', name: 'api_admin_objetos_upload_foto', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function uploadFoto(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $objeto = $this->objetoRepository->find($id);

        if (!$objeto) {
            return $this->json(['error' => 'Objeto no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $objeto->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $file = $request->files->get('foto');
        if (!$file) {
            return $this->json(['error' => 'No se ha enviado ningún archivo'], Response::HTTP_BAD_REQUEST);
        }

        $result = $this->fileUploadService->uploadObjetoFoto($file, $objeto);

        $foto = new ObjetoFoto();
        $foto->setObjeto($objeto);
        $foto->setUrl($result['url']);
        $foto->setThumbnailUrl($result['thumbnailUrl']);
        $foto->setNombreOriginal($file->getClientOriginalName());
        $foto->setMimeType($file->getMimeType());
        $foto->setTamano($file->getSize());
        $foto->setEsPrincipal($objeto->getFotos()->isEmpty());
        $foto->setOrden($objeto->getFotos()->count());

        $this->em->persist($foto);
        $this->em->flush();

        return $this->json([
            'message' => 'Foto subida correctamente',
            'id' => $foto->getId(),
            'url' => $foto->getUrl(),
            'thumbnailUrl' => $foto->getThumbnailUrl()
        ], Response::HTTP_CREATED);
    }

    #[Route('/rapido', name: 'api_admin_objetos_rapido', methods: ['POST'])]
    public function registroRapido(Request $request): JsonResponse
    {
        // Quick registration with photo and AI classification
        // AI classification will be implemented in a later phase
        // For now, it works like a normal registration

        return $this->create($request);
    }

    #[Route('/lote', name: 'api_admin_objetos_lote', methods: ['POST'])]
    public function createLote(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);
        $objetos = $data['objetos'] ?? [];

        if (empty($objetos)) {
            return $this->json(['error' => 'Debe enviar al menos un objeto'], Response::HTTP_BAD_REQUEST);
        }

        $creados = [];

        foreach ($objetos as $objetoData) {
            $objeto = new Objeto();
            $objeto->setTipo(Objeto::TIPO_ENCONTRADO);
            $objeto->setEstado(Objeto::ESTADO_REGISTRADO);
            $objeto->setTitulo($objetoData['titulo'] ?? 'Sin título');
            $objeto->setDescripcion($objetoData['descripcion'] ?? null);
            $objeto->setColor($objetoData['color'] ?? null);
            $objeto->setUsuarioReporta($usuario);
            $objeto->setAyuntamiento($usuario->getAyuntamiento());

            if (isset($objetoData['categoriaId'])) {
                $categoria = $this->categoriaRepository->find($objetoData['categoriaId']);
                if ($categoria) {
                    $objeto->setCategoria($categoria);
                }
            }

            $this->em->persist($objeto);
            $creados[] = $objeto;
        }

        $this->em->flush();

        // Generate QR codes for all
        foreach ($creados as $objeto) {
            $qrUrl = $this->qrCodeService->generateForObjeto($objeto);
            $objeto->setQrCode($qrUrl);
        }

        $this->em->flush();

        $result = [];
        foreach ($creados as $objeto) {
            $result[] = [
                'id' => $objeto->getId(),
                'codigo' => $objeto->getCodigoUnico(),
                'qrCode' => $objeto->getQrCode()
            ];
        }

        return $this->json([
            'message' => count($creados) . ' objetos creados correctamente',
            'objetos' => $result
        ], Response::HTTP_CREATED);
    }
}
