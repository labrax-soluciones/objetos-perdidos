<?php

namespace App\Service\Interface;

use App\Entity\Objeto;
use App\Entity\ObjetoFoto;

/**
 * Interface for AI services - classification, OCR, image comparison
 * This interface will be implemented when AI integration is added
 */
interface IAServiceInterface
{
    /**
     * Classify an object based on its photos
     *
     * @param ObjetoFoto[] $fotos
     * @return array{
     *     categoria_sugerida: ?int,
     *     confianza: float,
     *     etiquetas: string[],
     *     colores_detectados: string[]
     * }
     */
    public function clasificar(array $fotos): array;

    /**
     * Extract text from an image using OCR
     *
     * @param ObjetoFoto $foto
     * @return array{
     *     texto: string,
     *     confianza: float,
     *     regiones: array
     * }
     */
    public function extraerTexto(ObjetoFoto $foto): array;

    /**
     * Compare two images to determine similarity
     *
     * @param ObjetoFoto $foto1
     * @param ObjetoFoto $foto2
     * @return array{
     *     similitud: float,
     *     caracteristicas_coincidentes: string[]
     * }
     */
    public function compararImagenes(ObjetoFoto $foto1, ObjetoFoto $foto2): array;

    /**
     * Search for similar objects based on an image
     *
     * @param ObjetoFoto $foto
     * @param int $limit
     * @return array{
     *     objeto_id: int,
     *     similitud: float
     * }[]
     */
    public function buscarPorImagen(ObjetoFoto $foto, int $limit = 10): array;
}
