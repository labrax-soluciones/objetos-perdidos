<?php

namespace App\Entity;

use App\Repository\DispositivoPushRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: DispositivoPushRepository::class)]
#[ORM\Table(name: 'dispositivos_push')]
#[ORM\UniqueConstraint(columns: ['token'])]
#[ORM\HasLifecycleCallbacks]
class DispositivoPush
{
    public const PLATAFORMA_IOS = 'IOS';
    public const PLATAFORMA_ANDROID = 'ANDROID';
    public const PLATAFORMA_WEB = 'WEB';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false)]
    private ?Usuario $usuario = null;

    #[ORM\Column(length: 500)]
    private ?string $token = null;

    #[ORM\Column(length: 20)]
    private string $plataforma = self::PLATAFORMA_ANDROID;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $nombreDispositivo = null;

    #[ORM\Column(type: 'boolean')]
    private bool $activo = true;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $lastUsedAt = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsuario(): ?Usuario
    {
        return $this->usuario;
    }

    public function setUsuario(?Usuario $usuario): static
    {
        $this->usuario = $usuario;
        return $this;
    }

    public function getToken(): ?string
    {
        return $this->token;
    }

    public function setToken(string $token): static
    {
        $this->token = $token;
        return $this;
    }

    public function getPlataforma(): string
    {
        return $this->plataforma;
    }

    public function setPlataforma(string $plataforma): static
    {
        $this->plataforma = $plataforma;
        return $this;
    }

    public function getNombreDispositivo(): ?string
    {
        return $this->nombreDispositivo;
    }

    public function setNombreDispositivo(?string $nombreDispositivo): static
    {
        $this->nombreDispositivo = $nombreDispositivo;
        return $this;
    }

    public function isActivo(): bool
    {
        return $this->activo;
    }

    public function setActivo(bool $activo): static
    {
        $this->activo = $activo;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getLastUsedAt(): ?\DateTimeImmutable
    {
        return $this->lastUsedAt;
    }

    public function setLastUsedAt(?\DateTimeImmutable $lastUsedAt): static
    {
        $this->lastUsedAt = $lastUsedAt;
        return $this;
    }

    public function markAsUsed(): static
    {
        $this->lastUsedAt = new \DateTimeImmutable();
        return $this;
    }
}
