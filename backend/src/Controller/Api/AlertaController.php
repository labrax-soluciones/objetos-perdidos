<?php

namespace App\Controller\Api;

use App\Entity\Alerta;
use App\Entity\Usuario;
use App\Repository\AlertaRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/alertas')]
class AlertaController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private AlertaRepository $alertaRepository
    ) {}

    #[Route('', name: 'api_alertas_list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $alertas = $this->alertaRepository->findByCiudadano($usuario->getId());

        $data = [];
        foreach ($alertas as $alerta) {
            $data[] = [
                'id' => $alerta->getId(),
                'nombre' => $alerta->getNombre(),
                'criterios' => $alerta->getCriterios(),
                'activa' => $alerta->isActiva(),
                'createdAt' => $alerta->getCreatedAt()?->format('c')
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('', name: 'api_alertas_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        $alerta = new Alerta();
        $alerta->setCiudadano($usuario);
        $alerta->setNombre($data['nombre'] ?? null);
        $alerta->setCriterios($data['criterios'] ?? []);
        $alerta->setActiva(true);

        $this->em->persist($alerta);
        $this->em->flush();

        return $this->json([
            'message' => 'Alerta creada correctamente',
            'id' => $alerta->getId()
        ], Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'api_alertas_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function update(int $id, Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $alerta = $this->alertaRepository->find($id);

        if (!$alerta || $alerta->getCiudadano() !== $usuario) {
            return $this->json(['error' => 'Alerta no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nombre'])) {
            $alerta->setNombre($data['nombre']);
        }
        if (isset($data['criterios'])) {
            $alerta->setCriterios($data['criterios']);
        }
        if (isset($data['activa'])) {
            $alerta->setActiva($data['activa']);
        }

        $this->em->flush();

        return $this->json(['message' => 'Alerta actualizada correctamente']);
    }

    #[Route('/{id}', name: 'api_alertas_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function delete(int $id): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $alerta = $this->alertaRepository->find($id);

        if (!$alerta || $alerta->getCiudadano() !== $usuario) {
            return $this->json(['error' => 'Alerta no encontrada'], Response::HTTP_NOT_FOUND);
        }

        $this->em->remove($alerta);
        $this->em->flush();

        return $this->json(['message' => 'Alerta eliminada correctamente']);
    }
}
