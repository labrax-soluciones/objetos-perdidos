<?php

namespace App\Service;

use App\Entity\Coincidencia;
use App\Entity\Objeto;
use App\Repository\AlertaRepository;
use App\Repository\CoincidenciaRepository;
use App\Repository\ObjetoRepository;
use Doctrine\ORM\EntityManagerInterface;

class CoincidenciaService
{
    public function __construct(
        private EntityManagerInterface $em,
        private ObjetoRepository $objetoRepository,
        private CoincidenciaRepository $coincidenciaRepository,
        private AlertaRepository $alertaRepository,
        private NotificacionService $notificacionService
    ) {}

    public function buscarCoincidenciasParaPerdido(Objeto $objetoPerdido): array
    {
        if ($objetoPerdido->getTipo() !== Objeto::TIPO_PERDIDO) {
            return [];
        }

        $potenciales = $this->objetoRepository->findPotencialesCoincidencias($objetoPerdido);
        $coincidencias = [];

        foreach ($potenciales as $encontrado) {
            $puntuacion = $this->calcularPuntuacion($encontrado, $objetoPerdido);

            if ($puntuacion >= 30) { // Minimum threshold
                if (!$this->coincidenciaRepository->existeCoincidencia($encontrado->getId(), $objetoPerdido->getId())) {
                    $coincidencia = $this->crearCoincidencia($encontrado, $objetoPerdido, $puntuacion);
                    $coincidencias[] = $coincidencia;
                }
            }
        }

        return $coincidencias;
    }

    public function buscarCoincidenciasParaEncontrado(Objeto $objetoEncontrado): array
    {
        if ($objetoEncontrado->getTipo() !== Objeto::TIPO_ENCONTRADO) {
            return [];
        }

        // Search for matching lost objects
        $objetosPerdidos = $this->objetoRepository->createSearchQueryBuilder([
            'tipo' => Objeto::TIPO_PERDIDO,
            'estado' => Objeto::ESTADO_REGISTRADO,
            'ayuntamiento_id' => $objetoEncontrado->getAyuntamiento()->getId()
        ])->getQuery()->getResult();

        $coincidencias = [];

        foreach ($objetosPerdidos as $perdido) {
            $puntuacion = $this->calcularPuntuacion($objetoEncontrado, $perdido);

            if ($puntuacion >= 30) {
                if (!$this->coincidenciaRepository->existeCoincidencia($objetoEncontrado->getId(), $perdido->getId())) {
                    $coincidencia = $this->crearCoincidencia($objetoEncontrado, $perdido, $puntuacion);
                    $coincidencias[] = $coincidencia;
                }
            }
        }

        // Check for alerts
        $this->verificarAlertas($objetoEncontrado);

        return $coincidencias;
    }

    private function calcularPuntuacion(Objeto $encontrado, Objeto $perdido): int
    {
        $puntuacion = 0;
        $detalles = [];

        // Category match (30 points)
        if ($encontrado->getCategoria() && $perdido->getCategoria()) {
            if ($encontrado->getCategoria()->getId() === $perdido->getCategoria()->getId()) {
                $puntuacion += 30;
                $detalles['categoria'] = 'coincide';
            }
        }

        // Color match (20 points)
        if ($encontrado->getColor() && $perdido->getColor()) {
            if (strtolower($encontrado->getColor()) === strtolower($perdido->getColor())) {
                $puntuacion += 20;
                $detalles['color'] = 'coincide';
            } elseif (stripos($encontrado->getColor(), $perdido->getColor()) !== false ||
                      stripos($perdido->getColor(), $encontrado->getColor()) !== false) {
                $puntuacion += 10;
                $detalles['color'] = 'parcial';
            }
        }

        // Brand match (15 points)
        if ($encontrado->getMarca() && $perdido->getMarca()) {
            if (strtolower($encontrado->getMarca()) === strtolower($perdido->getMarca())) {
                $puntuacion += 15;
                $detalles['marca'] = 'coincide';
            }
        }

        // Model match (15 points)
        if ($encontrado->getModelo() && $perdido->getModelo()) {
            if (strtolower($encontrado->getModelo()) === strtolower($perdido->getModelo())) {
                $puntuacion += 15;
                $detalles['modelo'] = 'coincide';
            }
        }

        // Date proximity (10 points)
        if ($encontrado->getFechaHallazgo() && $perdido->getFechaHallazgo()) {
            $diff = abs($encontrado->getFechaHallazgo()->diff($perdido->getFechaHallazgo())->days);
            if ($diff <= 3) {
                $puntuacion += 10;
                $detalles['fecha'] = 'muy_cercana';
            } elseif ($diff <= 7) {
                $puntuacion += 5;
                $detalles['fecha'] = 'cercana';
            }
        }

        // Description keyword match (10 points)
        if ($encontrado->getDescripcion() && $perdido->getDescripcion()) {
            $palabrasEncontrado = $this->extraerPalabrasClaves($encontrado->getDescripcion());
            $palabrasPerdido = $this->extraerPalabrasClaves($perdido->getDescripcion());
            $coincidentes = array_intersect($palabrasEncontrado, $palabrasPerdido);

            if (count($coincidentes) >= 3) {
                $puntuacion += 10;
                $detalles['descripcion'] = 'alta_coincidencia';
            } elseif (count($coincidentes) >= 1) {
                $puntuacion += 5;
                $detalles['descripcion'] = 'parcial';
            }
        }

        return min(100, $puntuacion);
    }

    private function extraerPalabrasClaves(string $texto): array
    {
        $texto = strtolower($texto);
        $texto = preg_replace('/[^\p{L}\p{N}\s]/u', '', $texto);
        $palabras = preg_split('/\s+/', $texto);

        // Remove common words (stopwords)
        $stopwords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al',
                      'y', 'o', 'en', 'con', 'por', 'para', 'se', 'que', 'es', 'son', 'fue',
                      'era', 'muy', 'tiene', 'como', 'mas', 'pero', 'sus', 'le', 'ya', 'este',
                      'esta', 'estos', 'estas', 'uno', 'una', 'mi', 'tu', 'su', 'nos', 'vos'];

        $palabras = array_filter($palabras, function($p) use ($stopwords) {
            return strlen($p) > 2 && !in_array($p, $stopwords);
        });

        return array_values(array_unique($palabras));
    }

    private function crearCoincidencia(Objeto $encontrado, Objeto $perdido, int $puntuacion): Coincidencia
    {
        $coincidencia = new Coincidencia();
        $coincidencia->setObjetoEncontrado($encontrado);
        $coincidencia->setObjetoPerdido($perdido);
        $coincidencia->setPuntuacion($puntuacion);
        $coincidencia->setEstado(Coincidencia::ESTADO_PENDIENTE);
        $coincidencia->setDetallesCoincidencia([
            'categoria' => $encontrado->getCategoria()?->getId() === $perdido->getCategoria()?->getId(),
            'color' => strtolower($encontrado->getColor() ?? '') === strtolower($perdido->getColor() ?? ''),
            'marca' => strtolower($encontrado->getMarca() ?? '') === strtolower($perdido->getMarca() ?? ''),
            'fechaEncontrado' => $encontrado->getFechaHallazgo()?->format('Y-m-d'),
            'fechaPerdido' => $perdido->getFechaHallazgo()?->format('Y-m-d')
        ]);

        $this->em->persist($coincidencia);
        $this->em->flush();

        return $coincidencia;
    }

    private function verificarAlertas(Objeto $objeto): void
    {
        $alertas = $this->alertaRepository->findMatchingAlertas($objeto);

        foreach ($alertas as $alerta) {
            $criterio = $this->getCriterioCoincidente($alerta, $objeto);
            $this->notificacionService->notificarAlertaObjeto(
                $alerta->getCiudadano(),
                $objeto,
                $criterio
            );
        }
    }

    private function getCriterioCoincidente($alerta, $objeto): string
    {
        $criterios = [];
        $alertaCriterios = $alerta->getCriterios();

        if (isset($alertaCriterios['categoria_id']) && $objeto->getCategoria()) {
            $criterios[] = 'categoría';
        }
        if (isset($alertaCriterios['color'])) {
            $criterios[] = 'color';
        }
        if (isset($alertaCriterios['palabras_clave'])) {
            $criterios[] = 'palabras clave';
        }

        return implode(', ', $criterios);
    }
}
