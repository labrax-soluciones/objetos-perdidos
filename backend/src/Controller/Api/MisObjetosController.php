<?php

namespace App\Controller\Api;

use App\Entity\Usuario;
use App\Repository\ObjetoRepository;
use App\Repository\SolicitudRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/mis-objetos')]
class MisObjetosController extends AbstractController
{
    public function __construct(
        private ObjetoRepository $objetoRepository,
        private SolicitudRepository $solicitudRepository
    ) {}

    #[Route('', name: 'api_mis_objetos', methods: ['GET'])]
    public function index(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $objetos = $this->objetoRepository->findByUsuario($usuario->getId());
        $solicitudes = $this->solicitudRepository->findByCiudadano($usuario->getId());

        $objetosData = [];
        foreach ($objetos as $objeto) {
            $fotoPrincipal = $objeto->getFotoPrincipal();
            $objetosData[] = [
                'id' => $objeto->getId(),
                'codigoUnico' => $objeto->getCodigoUnico(),
                'titulo' => $objeto->getTitulo(),
                'tipo' => $objeto->getTipo(),
                'estado' => $objeto->getEstado(),
                'categoria' => $objeto->getCategoria() ? [
                    'id' => $objeto->getCategoria()->getId(),
                    'nombre' => $objeto->getCategoria()->getNombre()
                ] : null,
                'fotoPrincipal' => $fotoPrincipal ? [
                    'url' => $fotoPrincipal->getUrl(),
                    'thumbnailUrl' => $fotoPrincipal->getThumbnailUrl()
                ] : null,
                'createdAt' => $objeto->getCreatedAt()?->format('c')
            ];
        }

        $solicitudesData = [];
        foreach ($solicitudes as $solicitud) {
            $objeto = $solicitud->getObjeto();
            $fotoPrincipal = $objeto->getFotoPrincipal();
            $solicitudesData[] = [
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
                        'url' => $fotoPrincipal->getUrl(),
                        'thumbnailUrl' => $fotoPrincipal->getThumbnailUrl()
                    ] : null
                ]
            ];
        }

        return $this->json([
            'objetosReportados' => $objetosData,
            'solicitudes' => $solicitudesData
        ]);
    }
}
