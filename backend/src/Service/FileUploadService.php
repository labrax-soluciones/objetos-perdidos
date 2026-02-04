<?php

namespace App\Service;

use App\Entity\Objeto;
use Symfony\Component\HttpFoundation\File\UploadedFile;

class FileUploadService
{
    public function __construct(
        private string $s3Endpoint,
        private string $s3AccessKey,
        private string $s3SecretKey,
        private string $s3Bucket,
        private string $s3Region,
        private string $uploadDir
    ) {}

    public function uploadObjetoFoto(UploadedFile $file, Objeto $objeto): array
    {
        $filename = $this->generateFilename($file);
        $ayuntamientoId = $objeto->getAyuntamiento()->getId();
        $path = "objetos/{$ayuntamientoId}/{$objeto->getId()}/{$filename}";

        // For local development, save to local directory
        // In production, this would upload to S3/MinIO
        $localPath = $this->uploadDir . '/' . $path;
        $directory = dirname($localPath);

        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $file->move($directory, $filename);

        // Generate thumbnail
        $thumbnailPath = $this->generateThumbnail($localPath);

        // In production, these would be S3 URLs
        $baseUrl = '/uploads';

        return [
            'url' => $baseUrl . '/' . $path,
            'thumbnailUrl' => $thumbnailPath ? $baseUrl . '/' . str_replace($filename, 'thumb_' . $filename, $path) : null,
            'path' => $path
        ];
    }

    private function generateFilename(UploadedFile $file): string
    {
        $extension = $file->guessExtension() ?? 'jpg';
        return uniqid() . '_' . time() . '.' . $extension;
    }

    private function generateThumbnail(string $sourcePath): ?string
    {
        // Basic thumbnail generation
        // In production, consider using a dedicated image processing library

        if (!extension_loaded('gd')) {
            return null;
        }

        $info = getimagesize($sourcePath);
        if (!$info) {
            return null;
        }

        $mime = $info['mime'];
        $width = $info[0];
        $height = $info[1];

        $thumbWidth = 300;
        $thumbHeight = (int) ($height * ($thumbWidth / $width));

        switch ($mime) {
            case 'image/jpeg':
                $source = imagecreatefromjpeg($sourcePath);
                break;
            case 'image/png':
                $source = imagecreatefrompng($sourcePath);
                break;
            case 'image/gif':
                $source = imagecreatefromgif($sourcePath);
                break;
            default:
                return null;
        }

        if (!$source) {
            return null;
        }

        $thumb = imagecreatetruecolor($thumbWidth, $thumbHeight);

        if ($mime === 'image/png') {
            imagealphablending($thumb, false);
            imagesavealpha($thumb, true);
        }

        imagecopyresampled($thumb, $source, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $width, $height);

        $thumbPath = dirname($sourcePath) . '/thumb_' . basename($sourcePath);

        switch ($mime) {
            case 'image/jpeg':
                imagejpeg($thumb, $thumbPath, 80);
                break;
            case 'image/png':
                imagepng($thumb, $thumbPath);
                break;
            case 'image/gif':
                imagegif($thumb, $thumbPath);
                break;
        }

        imagedestroy($source);
        imagedestroy($thumb);

        return $thumbPath;
    }
}
