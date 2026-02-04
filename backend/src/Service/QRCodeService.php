<?php

namespace App\Service;

use App\Entity\Objeto;

class QRCodeService
{
    public function __construct(
        private string $frontendUrl,
        private string $uploadDir
    ) {}

    public function generateForObjeto(Objeto $objeto): string
    {
        $url = $this->frontendUrl . '/objeto/' . $objeto->getCodigoUnico();

        // Generate QR code using a simple API service
        // In production, consider using a PHP library like endroid/qr-code
        $qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' . urlencode($url);

        // Download and save locally
        $ayuntamientoId = $objeto->getAyuntamiento()->getId();
        $filename = 'qr_' . $objeto->getCodigoUnico() . '.png';
        $path = "qrcodes/{$ayuntamientoId}/{$filename}";
        $fullPath = $this->uploadDir . '/' . $path;

        $directory = dirname($fullPath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        // Download QR from API
        $qrContent = @file_get_contents($qrApiUrl);
        if ($qrContent) {
            file_put_contents($fullPath, $qrContent);
            return '/uploads/' . $path;
        }

        // Fallback: return the API URL directly
        return $qrApiUrl;
    }
}
