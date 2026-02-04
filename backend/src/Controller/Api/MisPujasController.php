<?php

namespace App\Controller\Api;

use App\Entity\Usuario;
use App\Repository\PujaRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/mis-pujas')]
class MisPujasController extends AbstractController
{
    public function __construct(
        private PujaRepository $pujaRepository
    ) {}

    #[Route('', name: 'api_mis_pujas', methods: ['GET'])]
    public function index(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $pujas = $this->pujaRepository->findByUsuario($usuario->getId());

        $data = [];
        foreach ($pujas as $puja) {
            $subasta = $puja->getSubasta();
            $lote = $subasta->getLote();
            $pujaGanadora = $subasta->getPujaGanadora();

            $data[] = [
                'id' => $puja->getId(),
                'cantidad' => $puja->getCantidad(),
                'esGanadora' => $pujaGanadora && $pujaGanadora->getId() === $puja->getId(),
                'subasta' => [
                    'id' => $subasta->getId(),
                    'estado' => $subasta->getEstado(),
                    'precioActual' => $subasta->getPrecioActual(),
                    'fechaFin' => $subasta->getFechaFin()?->format('c'),
                    'lote' => [
                        'id' => $lote->getId(),
                        'codigo' => $lote->getCodigo(),
                        'nombre' => $lote->getNombre()
                    ]
                ],
                'createdAt' => $puja->getCreatedAt()?->format('c')
            ];
        }

        return $this->json(['data' => $data]);
    }
}
