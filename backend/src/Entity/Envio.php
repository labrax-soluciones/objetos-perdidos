<?php

namespace App\Entity;

use App\Repository\EnvioRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: EnvioRepository::class)]
#[ORM\Table(name: 'envios')]
#[ORM\HasLifecycleCallbacks]
class Envio
{
    public const ESTADO_PENDIENTE = 'PENDIENTE';
    public const ESTADO_RECOGIDO = 'RECOGIDO';
    public const ESTADO_EN_TRANSITO = 'EN_TRANSITO';
    public const ESTADO_ENTREGADO = 'ENTREGADO';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['envio:read'])]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Solicitud::class, inversedBy: 'envio')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Solicitud $solicitud = null;

    #[ORM\ManyToOne(targetEntity: EmpresaLogistica::class, inversedBy: 'envios')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['envio:read'])]
    private ?EmpresaLogistica $empresa = null;

    #[ORM\Column(length: 20)]
    #[Groups(['envio:read'])]
    private string $estado = self::ESTADO_PENDIENTE;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['envio:read'])]
    private ?string $trackingCode = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Groups(['envio:read'])]
    private ?string $fotoEntregaUrl = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['envio:read'])]
    private ?string $observaciones = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['envio:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['envio:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['envio:read'])]
    private ?\DateTimeImmutable $fechaEntrega = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSolicitud(): ?Solicitud
    {
        return $this->solicitud;
    }

    public function setSolicitud(?Solicitud $solicitud): static
    {
        $this->solicitud = $solicitud;
        return $this;
    }

    public function getEmpresa(): ?EmpresaLogistica
    {
        return $this->empresa;
    }

    public function setEmpresa(?EmpresaLogistica $empresa): static
    {
        $this->empresa = $empresa;
        return $this;
    }

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): static
    {
        $this->estado = $estado;
        if ($estado === self::ESTADO_ENTREGADO && $this->fechaEntrega === null) {
            $this->fechaEntrega = new \DateTimeImmutable();
        }
        return $this;
    }

    public function getTrackingCode(): ?string
    {
        return $this->trackingCode;
    }

    public function setTrackingCode(?string $trackingCode): static
    {
        $this->trackingCode = $trackingCode;
        return $this;
    }

    public function getFotoEntregaUrl(): ?string
    {
        return $this->fotoEntregaUrl;
    }

    public function setFotoEntregaUrl(?string $fotoEntregaUrl): static
    {
        $this->fotoEntregaUrl = $fotoEntregaUrl;
        return $this;
    }

    public function getObservaciones(): ?string
    {
        return $this->observaciones;
    }

    public function setObservaciones(?string $observaciones): static
    {
        $this->observaciones = $observaciones;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getFechaEntrega(): ?\DateTimeImmutable
    {
        return $this->fechaEntrega;
    }

    public function isEntregado(): bool
    {
        return $this->estado === self::ESTADO_ENTREGADO;
    }
}
