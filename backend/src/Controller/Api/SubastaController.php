<?php

namespace App\Controller\Api;

use App\Entity\Puja;
use App\Entity\Usuario;
use App\Repository\PujaRepository;
use App\Repository\SubastaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/subastas')]
class SubastaController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SubastaRepository $subastaRepository,
        private PujaRepository $pujaRepository
    ) {}

    #[Route('', name: 'api_subastas_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $subastas = $this->subastaRepository->findPublicas();

        $data = [];
        foreach ($subastas as $subasta) {
            $lote = $subasta->getLote();
            $data[] = [
                'id' => $subasta->getId(),
                'lote' => [
                    'id' => $lote->getId(),
                    'codigo' => $lote->getCodigo(),
                    'nombre' => $lote->getNombre(),
                    'numeroObjetos' => $lote->getNumeroObjetos()
                ],
                'precioSalida' => $subasta->getPrecioSalida(),
                'precioActual' => $subasta->getPrecioActual(),
                'fechaInicio' => $subasta->getFechaInicio()?->format('c'),
                'fechaFin' => $subasta->getFechaFin()?->format('c'),
                'estado' => $subasta->getEstado(),
                'numeroParticipantes' => $subasta->getNumeroParticipantes()
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/{id}', name: 'api_subastas_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function show(int $id): JsonResponse
    {
        $subasta = $this->subastaRepository->find($id);

        if (!$subasta) {
            return $this->json(['error' => 'Subasta no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $lote = $subasta->getLote();
        $objetos = [];
        foreach ($lote->getObjetos() as $objeto) {
            $fotoPrincipal = $objeto->getFotoPrincipal();
            $objetos[] = [
                'id' => $objeto->getId(),
                'titulo' => $objeto->getTitulo(),
                'categoria' => $objeto->getCategoria() ? $objeto->getCategoria()->getNombre() : null,
                'fotoPrincipal' => $fotoPrincipal ? [
                    'url' => $fotoPrincipal->getUrl(),
                    'thumbnailUrl' => $fotoPrincipal->getThumbnailUrl()
                ] : null
            ];
        }

        $pujas = [];
        foreach ($subasta->getPujas() as $puja) {
            $pujas[] = [
                'id' => $puja->getId(),
                'cantidad' => $puja->getCantidad(),
                'usuario' => $puja->getUsuario()->getNombre(),
                'createdAt' => $puja->getCreatedAt()?->format('c')
            ];
        }

        return $this->json([
            'id' => $subasta->getId(),
            'lote' => [
                'id' => $lote->getId(),
                'codigo' => $lote->getCodigo(),
                'nombre' => $lote->getNombre(),
                'objetos' => $objetos
            ],
            'precioSalida' => $subasta->getPrecioSalida(),
            'precioActual' => $subasta->getPrecioActual(),
            'precioMinimoSiguientePuja' => $subasta->getPrecioMinimoSiguientePuja(),
            'incrementoMinimo' => $subasta->getIncrementoMinimo(),
            'fechaInicio' => $subasta->getFechaInicio()?->format('c'),
            'fechaFin' => $subasta->getFechaFin()?->format('c'),
            'estado' => $subasta->getEstado(),
            'descripcion' => $subasta->getDescripcion(),
            'pujas' => $pujas
        ]);
    }

    #[Route('/{id}/pujar', name: 'api_subastas_pujar', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function pujar(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $subasta = $this->subastaRepository->find($id);

        if (!$subasta) {
            return $this->json(['error' => 'Subasta no encontrada'], Response::HTTP_NOT_FOUND);
        }

        if (!$subasta->isActiva()) {
            return $this->json(['error' => 'La subasta no está activa'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        $cantidad = $data['cantidad'] ?? 0;

        $minimoRequerido = $subasta->getPrecioMinimoSiguientePuja();
        if (bccomp($cantidad, $minimoRequerido, 2) < 0) {
            return $this->json([
                'error' => 'La puja debe ser al menos ' . $minimoRequerido . '€'
            ], Response::HTTP_BAD_REQUEST);
        }

        $puja = new Puja();
        $puja->setSubasta($subasta);
        $puja->setUsuario($usuario);
        $puja->setCantidad($cantidad);

        $subasta->setPrecioActual($cantidad);

        $this->em->persist($puja);
        $this->em->flush();

        return $this->json([
            'message' => 'Puja realizada correctamente',
            'id' => $puja->getId(),
            'precioActual' => $subasta->getPrecioActual()
        ], Response::HTTP_CREATED);
    }
}
