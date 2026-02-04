<?php

namespace App\Service\Interface;

use App\Entity\Puja;
use App\Entity\Subasta;
use App\Entity\Usuario;

/**
 * Interface for Payment Gateway integration (Redsys, Stripe, etc.)
 * This interface will be implemented when payment integration is added
 */
interface PagoServiceInterface
{
    /**
     * Create a payment for an auction win
     *
     * @param Subasta $subasta
     * @param Puja $pujaGanadora
     * @return array{
     *     exito: bool,
     *     url_pago: ?string,
     *     referencia: ?string,
     *     mensaje: string
     * }
     */
    public function crearPago(Subasta $subasta, Puja $pujaGanadora): array;

    /**
     * Process payment confirmation webhook
     *
     * @param array $data
     * @return array{
     *     procesado: bool,
     *     pagado: bool,
     *     referencia: ?string,
     *     mensaje: string
     * }
     */
    public function procesarConfirmacion(array $data): array;

    /**
     * Get payment status
     *
     * @param string $referencia
     * @return array{
     *     estado: string,
     *     cantidad: ?string,
     *     fecha_pago: ?string
     * }
     */
    public function obtenerEstado(string $referencia): array;

    /**
     * Process a refund
     *
     * @param string $referencia
     * @param string $cantidad
     * @param string $motivo
     * @return array{
     *     exito: bool,
     *     referencia_devolucion: ?string,
     *     mensaje: string
     * }
     */
    public function procesarDevolucion(string $referencia, string $cantidad, string $motivo): array;
}
