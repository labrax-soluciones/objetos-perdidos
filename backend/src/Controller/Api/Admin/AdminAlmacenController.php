<?php

namespace App\Controller\Api\Admin;

use App\Entity\Almacen;
use App\Entity\Ubicacion;
use App\Entity\Usuario;
use App\Repository\AlmacenRepository;
use App\Repository\UbicacionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/almacenes')]
class AdminAlmacenController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private AlmacenRepository $almacenRepository,
        private UbicacionRepository $ubicacionRepository
    ) {}

    #[Route('', name: 'api_admin_almacenes_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $almacenes = $this->almacenRepository->findByAyuntamiento($usuario->getAyuntamiento()->getId());

        $data = [];
        foreach ($almacenes as $almacen) {
            $data[] = [
                'id' => $almacen->getId(),
                'nombre' => $almacen->getNombre(),
                'direccion' => $almacen->getDireccion(),
                'activo' => $almacen->isActivo(),
                'numeroUbicaciones' => $almacen->getUbicaciones()->count()
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('', name: 'api_admin_almacenes_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        $almacen = new Almacen();
        $almacen->setNombre($data['nombre'] ?? '');
        $almacen->setDireccion($data['direccion'] ?? '');
        $almacen->setAyuntamiento($usuario->getAyuntamiento());
        $almacen->setActivo(true);

        $this->em->persist($almacen);
        $this->em->flush();

        return $this->json([
            'message' => 'Almacén creado correctamente',
            'id' => $almacen->getId()
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_admin_almacenes_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $almacen = $this->almacenRepository->find($id);

        if (!$almacen) {
            return $this->json(['error' => 'Almacén no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $almacen->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        return $this->json([
            'id' => $almacen->getId(),
            'nombre' => $almacen->getNombre(),
            'direccion' => $almacen->getDireccion(),
            'activo' => $almacen->isActivo()
        ]);
    }

    #[Route('/{id}', name: 'api_admin_almacenes_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $almacen = $this->almacenRepository->find($id);

        if (!$almacen) {
            return $this->json(['error' => 'Almacén no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $almacen->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nombre'])) {
            $almacen->setNombre($data['nombre']);
        }
        if (isset($data['direccion'])) {
            $almacen->setDireccion($data['direccion']);
        }
        if (isset($data['activo'])) {
            $almacen->setActivo($data['activo']);
        }

        $this->em->flush();

        return $this->json(['message' => 'Almacén actualizado correctamente']);
    }

    #[Route('/{id}/ubicaciones', name: 'api_admin_almacenes_ubicaciones_list', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function listUbicaciones(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $almacen = $this->almacenRepository->find($id);

        if (!$almacen) {
            return $this->json(['error' => 'Almacén no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $almacen->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $ubicaciones = $this->ubicacionRepository->findByAlmacen($id);

        $data = [];
        foreach ($ubicaciones as $ubicacion) {
            $data[] = [
                'id' => $ubicacion->getId(),
                'codigo' => $ubicacion->getCodigo(),
                'codigoCompleto' => $ubicacion->getCodigoCompleto(),
                'tipo' => $ubicacion->getTipo(),
                'capacidad' => $ubicacion->getCapacidad(),
                'ocupacionActual' => $ubicacion->getOcupacionActual(),
                'tieneEspacio' => $ubicacion->tieneEspacio(),
                'padreId' => $ubicacion->getPadre()?->getId()
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/{id}/ubicaciones', name: 'api_admin_almacenes_ubicaciones_create', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function createUbicacion(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $almacen = $this->almacenRepository->find($id);

        if (!$almacen) {
            return $this->json(['error' => 'Almacén no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $almacen->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        $ubicacion = new Ubicacion();
        $ubicacion->setAlmacen($almacen);
        $ubicacion->setCodigo($data['codigo'] ?? '');
        $ubicacion->setTipo($data['tipo'] ?? Ubicacion::TIPO_CASILLERO);
        $ubicacion->setCapacidad($data['capacidad'] ?? null);

        if (isset($data['padreId'])) {
            $padre = $this->ubicacionRepository->find($data['padreId']);
            if ($padre) {
                $ubicacion->setPadre($padre);
            }
        }

        $this->em->persist($ubicacion);
        $this->em->flush();

        return $this->json([
            'message' => 'Ubicación creada correctamente',
            'id' => $ubicacion->getId(),
            'codigoCompleto' => $ubicacion->getCodigoCompleto()
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}/mapa', name: 'api_admin_almacenes_mapa', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function mapa(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $almacen = $this->almacenRepository->find($id);

        if (!$almacen) {
            return $this->json(['error' => 'Almacén no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $almacen->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        // Build hierarchical structure for visual map
        $ubicaciones = $this->ubicacionRepository->findByAlmacen($id);

        $raices = [];
        $porId = [];

        foreach ($ubicaciones as $ubicacion) {
            $porId[$ubicacion->getId()] = [
                'id' => $ubicacion->getId(),
                'codigo' => $ubicacion->getCodigo(),
                'tipo' => $ubicacion->getTipo(),
                'capacidad' => $ubicacion->getCapacidad(),
                'ocupacionActual' => $ubicacion->getOcupacionActual(),
                'hijos' => []
            ];
        }

        foreach ($ubicaciones as $ubicacion) {
            if ($ubicacion->getPadre()) {
                $padreId = $ubicacion->getPadre()->getId();
                if (isset($porId[$padreId])) {
                    $porId[$padreId]['hijos'][] = &$porId[$ubicacion->getId()];
                }
            } else {
                $raices[] = &$porId[$ubicacion->getId()];
            }
        }

        return $this->json([
            'almacen' => [
                'id' => $almacen->getId(),
                'nombre' => $almacen->getNombre()
            ],
            'ubicaciones' => $raices
        ]);
    }
}
