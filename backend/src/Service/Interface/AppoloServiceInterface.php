<?php

namespace App\Service\Interface;

use App\Entity\Objeto;

/**
 * Interface for Appolo (Police System) integration
 * This interface will be implemented when Appolo documentation is available
 */
interface AppoloServiceInterface
{
    /**
     * Check if an object has been reported as stolen in the police system
     *
     * @param Objeto $objeto
     * @return array{
     *     encontrado: bool,
     *     numero_denuncia: ?string,
     *     fecha_denuncia: ?string,
     *     descripcion: ?string
     * }
     */
    public function verificarDenuncia(Objeto $objeto): array;

    /**
     * Report a found object to the police system
     *
     * @param Objeto $objeto
     * @return array{
     *     exito: bool,
     *     referencia: ?string,
     *     mensaje: string
     * }
     */
    public function reportarEncontrado(Objeto $objeto): array;

    /**
     * Receive webhook notifications from the police system
     *
     * @param array $data
     * @return array{
     *     procesado: bool,
     *     accion: ?string
     * }
     */
    public function procesarWebhook(array $data): array;
}
