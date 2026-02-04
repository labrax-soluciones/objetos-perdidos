<?php

namespace App\Controller\Api\Admin;

use App\Entity\Lote;
use App\Entity\Objeto;
use App\Entity\Subasta;
use App\Entity\Usuario;
use App\Repository\LoteRepository;
use App\Repository\ObjetoRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/lotes')]
class AdminLoteController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private LoteRepository $loteRepository,
        private ObjetoRepository $objetoRepository
    ) {}

    #[Route('', name: 'api_admin_lotes_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $lotes = $this->loteRepository->findByAyuntamiento($usuario->getAyuntamiento()->getId());

        $data = [];
        foreach ($lotes as $lote) {
            $data[] = [
                'id' => $lote->getId(),
                'codigo' => $lote->getCodigo(),
                'nombre' => $lote->getNombre(),
                'tipo' => $lote->getTipo(),
                'estado' => $lote->getEstado(),
                'numeroObjetos' => $lote->getNumeroObjetos(),
                'fechaCreacion' => $lote->getFechaCreacion()?->format('c'),
                'fechaCierre' => $lote->getFechaCierre()?->format('c')
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('', name: 'api_admin_lotes_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true);

        $lote = new Lote();
        $lote->setNombre($data['nombre'] ?? '');
        $lote->setTipo($data['tipo'] ?? Lote::TIPO_SUBASTA);
        $lote->setAyuntamiento($usuario->getAyuntamiento());

        if (isset($data['fechaCierre'])) {
            $lote->setFechaCierre(new \DateTime($data['fechaCierre']));
        }

        // Add objects to lot
        if (isset($data['objetosIds']) && is_array($data['objetosIds'])) {
            foreach ($data['objetosIds'] as $objetoId) {
                $objeto = $this->objetoRepository->find($objetoId);
                if ($objeto && $objeto->getAyuntamiento() === $usuario->getAyuntamiento()) {
                    $lote->addObjeto($objeto);
                    $objeto->setEstado(Objeto::ESTADO_SUBASTA);
                }
            }
        }

        $this->em->persist($lote);
        $this->em->flush();

        return $this->json([
            'message' => 'Lote creado correctamente',
            'id' => $lote->getId(),
            'codigo' => $lote->getCodigo()
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_admin_lotes_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $lote = $this->loteRepository->find($id);

        if (!$lote) {
            return $this->json(['error' => 'Lote no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $lote->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        $objetos = [];
        foreach ($lote->getObjetos() as $objeto) {
            $fotoPrincipal = $objeto->getFotoPrincipal();
            $objetos[] = [
                'id' => $objeto->getId(),
                'codigoUnico' => $objeto->getCodigoUnico(),
                'titulo' => $objeto->getTitulo(),
                'categoria' => $objeto->getCategoria()?->getNombre(),
                'valorEstimado' => $objeto->getValorEstimado(),
                'fotoPrincipal' => $fotoPrincipal ? [
                    'thumbnailUrl' => $fotoPrincipal->getThumbnailUrl()
                ] : null
            ];
        }

        return $this->json([
            'id' => $lote->getId(),
            'codigo' => $lote->getCodigo(),
            'nombre' => $lote->getNombre(),
            'tipo' => $lote->getTipo(),
            'estado' => $lote->getEstado(),
            'fechaCreacion' => $lote->getFechaCreacion()?->format('c'),
            'fechaCierre' => $lote->getFechaCierre()?->format('c'),
            'objetos' => $objetos,
            'subasta' => $lote->getSubasta() ? [
                'id' => $lote->getSubasta()->getId(),
                'estado' => $lote->getSubasta()->getEstado(),
                'precioSalida' => $lote->getSubasta()->getPrecioSalida(),
                'precioActual' => $lote->getSubasta()->getPrecioActual()
            ] : null
        ]);
    }

    #[Route('/{id}', name: 'api_admin_lotes_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $lote = $this->loteRepository->find($id);

        if (!$lote) {
            return $this->json(['error' => 'Lote no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $lote->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        if ($lote->getEstado() !== Lote::ESTADO_PREPARACION) {
            return $this->json(['error' => 'Solo se pueden modificar lotes en preparacion'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nombre'])) {
            $lote->setNombre($data['nombre']);
        }
        if (isset($data['tipo'])) {
            $lote->setTipo($data['tipo']);
        }
        if (isset($data['fechaCierre'])) {
            $lote->setFechaCierre(new \DateTime($data['fechaCierre']));
        }

        // Update objects
        if (isset($data['objetosIds']) && is_array($data['objetosIds'])) {
            // Remove current objects
            foreach ($lote->getObjetos() as $objeto) {
                $objeto->setEstado(Objeto::ESTADO_EN_ALMACEN);
                $lote->removeObjeto($objeto);
            }

            // Add new objects
            foreach ($data['objetosIds'] as $objetoId) {
                $objeto = $this->objetoRepository->find($objetoId);
                if ($objeto && $objeto->getAyuntamiento() === $usuario->getAyuntamiento()) {
                    $lote->addObjeto($objeto);
                    $objeto->setEstado(Objeto::ESTADO_SUBASTA);
                }
            }
        }

        $this->em->flush();

        return $this->json(['message' => 'Lote actualizado correctamente']);
    }

    #[Route('/{id}/publicar', name: 'api_admin_lotes_publicar', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function publicar(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        $lote = $this->loteRepository->find($id);

        if (!$lote) {
            return $this->json(['error' => 'Lote no encontrado'], Response::HTTP_NOT_FOUND);
        }

        if (!$usuario->isSuperAdmin() && $lote->getAyuntamiento() !== $usuario->getAyuntamiento()) {
            return $this->json(['error' => 'No autorizado'], Response::HTTP_FORBIDDEN);
        }

        if ($lote->getEstado() !== Lote::ESTADO_PREPARACION) {
            return $this->json(['error' => 'El lote ya ha sido publicado'], Response::HTTP_BAD_REQUEST);
        }

        if ($lote->getNumeroObjetos() === 0) {
            return $this->json(['error' => 'El lote debe tener al menos un objeto'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        $lote->setEstado(Lote::ESTADO_PUBLICADO);

        // Create auction if type is SUBASTA
        if ($lote->getTipo() === Lote::TIPO_SUBASTA) {
            $subasta = new Subasta();
            $subasta->setLote($lote);
            $subasta->setPrecioSalida($data['precioSalida'] ?? '1.00');
            $subasta->setIncrementoMinimo($data['incrementoMinimo'] ?? '1.00');
            $subasta->setFechaInicio(new \DateTime($data['fechaInicio'] ?? 'now'));
            $subasta->setFechaFin(new \DateTime($data['fechaFin'] ?? '+7 days'));
            $subasta->setEstado(Subasta::ESTADO_PROGRAMADA);
            $subasta->setDescripcion($data['descripcion'] ?? null);

            $this->em->persist($subasta);
        }

        $this->em->flush();

        return $this->json([
            'message' => 'Lote publicado correctamente',
            'subastaId' => $lote->getSubasta()?->getId()
        ]);
    }

    #[Route('/elegibles-subasta', name: 'api_admin_lotes_elegibles', methods: ['GET'])]
    public function elegiblesParaSubasta(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $objetos = $this->objetoRepository->findEligiblesParaSubasta($usuario->getAyuntamiento()->getId());

        $data = [];
        foreach ($objetos as $objeto) {
            $fotoPrincipal = $objeto->getFotoPrincipal();
            $data[] = [
                'id' => $objeto->getId(),
                'codigoUnico' => $objeto->getCodigoUnico(),
                'titulo' => $objeto->getTitulo(),
                'categoria' => $objeto->getCategoria()?->getNombre(),
                'valorEstimado' => $objeto->getValorEstimado(),
                'createdAt' => $objeto->getCreatedAt()?->format('c'),
                'fotoPrincipal' => $fotoPrincipal ? [
                    'thumbnailUrl' => $fotoPrincipal->getThumbnailUrl()
                ] : null
            ];
        }

        return $this->json(['data' => $data]);
    }
}
