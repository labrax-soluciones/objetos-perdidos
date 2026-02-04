<?php

namespace App\Entity;

use App\Repository\ObjetoFotoRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ObjetoFotoRepository::class)]
#[ORM\Table(name: 'objeto_fotos')]
class ObjetoFoto
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['objeto:read', 'objeto:list'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Objeto::class, inversedBy: 'fotos')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private ?Objeto $objeto = null;

    #[ORM\Column(length: 500)]
    #[Groups(['objeto:read', 'objeto:list'])]
    private ?string $url = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Groups(['objeto:read', 'objeto:list'])]
    private ?string $thumbnailUrl = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['objeto:read', 'objeto:list'])]
    private bool $esPrincipal = false;

    #[ORM\Column(type: 'integer')]
    #[Groups(['objeto:read', 'objeto:list'])]
    private int $orden = 0;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['objeto:read'])]
    private ?string $textoOcr = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $nombreOriginal = null;

    #[ORM\Column(length: 50, nullable: true)]
    private ?string $mimeType = null;

    #[ORM\Column(type: 'integer', nullable: true)]
    private ?int $tamano = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getObjeto(): ?Objeto
    {
        return $this->objeto;
    }

    public function setObjeto(?Objeto $objeto): static
    {
        $this->objeto = $objeto;
        return $this;
    }

    public function getUrl(): ?string
    {
        return $this->url;
    }

    public function setUrl(string $url): static
    {
        $this->url = $url;
        return $this;
    }

    public function getThumbnailUrl(): ?string
    {
        return $this->thumbnailUrl;
    }

    public function setThumbnailUrl(?string $thumbnailUrl): static
    {
        $this->thumbnailUrl = $thumbnailUrl;
        return $this;
    }

    public function isEsPrincipal(): bool
    {
        return $this->esPrincipal;
    }

    public function setEsPrincipal(bool $esPrincipal): static
    {
        $this->esPrincipal = $esPrincipal;
        return $this;
    }

    public function getOrden(): int
    {
        return $this->orden;
    }

    public function setOrden(int $orden): static
    {
        $this->orden = $orden;
        return $this;
    }

    public function getTextoOcr(): ?string
    {
        return $this->textoOcr;
    }

    public function setTextoOcr(?string $textoOcr): static
    {
        $this->textoOcr = $textoOcr;
        return $this;
    }

    public function getNombreOriginal(): ?string
    {
        return $this->nombreOriginal;
    }

    public function setNombreOriginal(?string $nombreOriginal): static
    {
        $this->nombreOriginal = $nombreOriginal;
        return $this;
    }

    public function getMimeType(): ?string
    {
        return $this->mimeType;
    }

    public function setMimeType(?string $mimeType): static
    {
        $this->mimeType = $mimeType;
        return $this;
    }

    public function getTamano(): ?int
    {
        return $this->tamano;
    }

    public function setTamano(?int $tamano): static
    {
        $this->tamano = $tamano;
        return $this;
    }
}
