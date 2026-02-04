<?php

namespace App\Controller\Api\Admin;

use App\Entity\Usuario;
use App\Repository\CoincidenciaRepository;
use App\Repository\ObjetoRepository;
use App\Repository\SolicitudRepository;
use App\Repository\SubastaRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/admin/estadisticas')]
class AdminEstadisticasController extends AbstractController
{
    public function __construct(
        private ObjetoRepository $objetoRepository,
        private SolicitudRepository $solicitudRepository,
        private CoincidenciaRepository $coincidenciaRepository,
        private SubastaRepository $subastaRepository
    ) {}

    #[Route('/dashboard', name: 'api_admin_estadisticas_dashboard', methods: ['GET'])]
    public function dashboard(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $ayuntamientoId = $usuario->getAyuntamiento()->getId();

        $estadosObjetos = $this->objetoRepository->getEstadisticasPorEstado($ayuntamientoId);
        $solicitudesPendientes = $this->solicitudRepository->countPendientes($ayuntamientoId);
        $coincidenciasPendientes = $this->coincidenciaRepository->countPendientes($ayuntamientoId);

        return $this->json([
            'resumen' => [
                'totalObjetos' => array_sum($estadosObjetos),
                'objetosEnAlmacen' => $estadosObjetos['EN_ALMACEN'] ?? 0,
                'objetosEntregados' => $estadosObjetos['ENTREGADO'] ?? 0,
                'solicitudesPendientes' => $solicitudesPendientes,
                'coincidenciasPendientes' => $coincidenciasPendientes
            ],
            'objetosPorEstado' => $estadosObjetos
        ]);
    }

    #[Route('/objetos', name: 'api_admin_estadisticas_objetos', methods: ['GET'])]
    public function objetos(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $ayuntamientoId = $usuario->getAyuntamiento()->getId();

        $estadosObjetos = $this->objetoRepository->getEstadisticasPorEstado($ayuntamientoId);

        // Get objects by category would require additional repository method
        // For now, return state statistics
        return $this->json([
            'porEstado' => $estadosObjetos,
            'total' => array_sum($estadosObjetos)
        ]);
    }

    #[Route('/coincidencias', name: 'api_admin_estadisticas_coincidencias', methods: ['GET'])]
    public function coincidencias(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        $ayuntamientoId = $usuario->getAyuntamiento()->getId();

        // Get coincidences by state
        $todas = $this->coincidenciaRepository->findByAyuntamiento($ayuntamientoId);

        $porEstado = [
            'PENDIENTE' => 0,
            'CONFIRMADA' => 0,
            'DESCARTADA' => 0
        ];

        foreach ($todas as $coincidencia) {
            $porEstado[$coincidencia->getEstado()]++;
        }

        return $this->json([
            'porEstado' => $porEstado,
            'total' => count($todas),
            'tasaExito' => count($todas) > 0
                ? round(($porEstado['CONFIRMADA'] / count($todas)) * 100, 2)
                : 0
        ]);
    }

    #[Route('/subastas', name: 'api_admin_estadisticas_subastas', methods: ['GET'])]
    public function subastas(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario->getAyuntamiento() && !$usuario->isSuperAdmin()) {
            return $this->json(['error' => 'Usuario sin ayuntamiento asignado'], Response::HTTP_FORBIDDEN);
        }

        // Get auction statistics
        $activas = $this->subastaRepository->findActivas();
        $publicas = $this->subastaRepository->findPublicas();

        $totalRecaudado = 0;
        $adjudicadas = 0;

        foreach ($publicas as $subasta) {
            if ($subasta->getEstado() === 'ADJUDICADA' && $subasta->getPrecioActual()) {
                $totalRecaudado += (float) $subasta->getPrecioActual();
                $adjudicadas++;
            }
        }

        return $this->json([
            'activas' => count($activas),
            'programadas' => count(array_filter($publicas, fn($s) => $s->getEstado() === 'PROGRAMADA')),
            'adjudicadas' => $adjudicadas,
            'totalRecaudado' => number_format($totalRecaudado, 2)
        ]);
    }
}
