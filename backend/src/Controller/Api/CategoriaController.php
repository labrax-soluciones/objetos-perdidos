<?php

namespace App\Controller\Api;

use App\Repository\CategoriaRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/categorias')]
class CategoriaController extends AbstractController
{
    public function __construct(
        private CategoriaRepository $categoriaRepository
    ) {}

    #[Route('', name: 'api_categorias_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $categorias = $this->categoriaRepository->findActivas();

        $data = [];
        foreach ($categorias as $categoria) {
            $data[] = [
                'id' => $categoria->getId(),
                'nombre' => $categoria->getNombre(),
                'icono' => $categoria->getIcono(),
                'descripcion' => $categoria->getDescripcion(),
                'padreId' => $categoria->getPadre()?->getId(),
                'orden' => $categoria->getOrden()
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/arbol', name: 'api_categorias_tree', methods: ['GET'])]
    public function tree(): JsonResponse
    {
        $raices = $this->categoriaRepository->findRaices();

        $data = [];
        foreach ($raices as $categoria) {
            $data[] = $this->buildCategoriaTree($categoria);
        }

        return $this->json(['data' => $data]);
    }

    private function buildCategoriaTree($categoria): array
    {
        $hijos = [];
        foreach ($categoria->getHijos() as $hijo) {
            if ($hijo->isActiva()) {
                $hijos[] = $this->buildCategoriaTree($hijo);
            }
        }

        return [
            'id' => $categoria->getId(),
            'nombre' => $categoria->getNombre(),
            'icono' => $categoria->getIcono(),
            'descripcion' => $categoria->getDescripcion(),
            'orden' => $categoria->getOrden(),
            'hijos' => $hijos
        ];
    }
}
