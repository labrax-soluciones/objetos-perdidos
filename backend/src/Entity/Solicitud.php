<?php

namespace App\Entity;

use App\Repository\SolicitudRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SolicitudRepository::class)]
#[ORM\Table(name: 'solicitudes')]
#[ORM\HasLifecycleCallbacks]
class Solicitud
{
    public const ESTADO_PENDIENTE = 'PENDIENTE';
    public const ESTADO_VALIDANDO = 'VALIDANDO';
    public const ESTADO_APROBADA = 'APROBADA';
    public const ESTADO_RECHAZADA = 'RECHAZADA';
    public const ESTADO_ENTREGADA = 'ENTREGADA';

    public const TIPO_ENTREGA_PRESENCIAL = 'PRESENCIAL';
    public const TIPO_ENTREGA_ENVIO = 'ENVIO';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['solicitud:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Objeto::class, inversedBy: 'solicitudes')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['solicitud:read'])]
    private ?Objeto $objeto = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class, inversedBy: 'solicitudes')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['solicitud:read'])]
    private ?Usuario $ciudadano = null;

    #[ORM\Column(length: 20)]
    #[Groups(['solicitud:read'])]
    private string $estado = self::ESTADO_PENDIENTE;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['solicitud:read'])]
    private ?array $documentosAdjuntos = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['solicitud:read'])]
    private ?string $motivoRechazo = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['solicitud:read', 'solicitud:write'])]
    private ?string $descripcionReclamacion = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['solicitud:read'])]
    private ?\DateTimeInterface $fechaCita = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['solicitud:read', 'solicitud:write'])]
    private ?string $tipoEntrega = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['solicitud:read', 'solicitud:write'])]
    private ?string $direccionEnvio = null;

    #[ORM\OneToOne(targetEntity: Envio::class, mappedBy: 'solicitud')]
    private ?Envio $envio = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['solicitud:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['solicitud:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

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

    public function getObjeto(): ?Objeto
    {
        return $this->objeto;
    }

    public function setObjeto(?Objeto $objeto): static
    {
        $this->objeto = $objeto;
        return $this;
    }

    public function getCiudadano(): ?Usuario
    {
        return $this->ciudadano;
    }

    public function setCiudadano(?Usuario $ciudadano): static
    {
        $this->ciudadano = $ciudadano;
        return $this;
    }

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): static
    {
        $this->estado = $estado;
        return $this;
    }

    public function getDocumentosAdjuntos(): ?array
    {
        return $this->documentosAdjuntos;
    }

    public function setDocumentosAdjuntos(?array $documentosAdjuntos): static
    {
        $this->documentosAdjuntos = $documentosAdjuntos;
        return $this;
    }

    public function addDocumentoAdjunto(string $url): static
    {
        $this->documentosAdjuntos = $this->documentosAdjuntos ?? [];
        $this->documentosAdjuntos[] = $url;
        return $this;
    }

    public function getMotivoRechazo(): ?string
    {
        return $this->motivoRechazo;
    }

    public function setMotivoRechazo(?string $motivoRechazo): static
    {
        $this->motivoRechazo = $motivoRechazo;
        return $this;
    }

    public function getDescripcionReclamacion(): ?string
    {
        return $this->descripcionReclamacion;
    }

    public function setDescripcionReclamacion(?string $descripcionReclamacion): static
    {
        $this->descripcionReclamacion = $descripcionReclamacion;
        return $this;
    }

    public function getFechaCita(): ?\DateTimeInterface
    {
        return $this->fechaCita;
    }

    public function setFechaCita(?\DateTimeInterface $fechaCita): static
    {
        $this->fechaCita = $fechaCita;
        return $this;
    }

    public function getTipoEntrega(): ?string
    {
        return $this->tipoEntrega;
    }

    public function setTipoEntrega(?string $tipoEntrega): static
    {
        $this->tipoEntrega = $tipoEntrega;
        return $this;
    }

    public function getDireccionEnvio(): ?string
    {
        return $this->direccionEnvio;
    }

    public function setDireccionEnvio(?string $direccionEnvio): static
    {
        $this->direccionEnvio = $direccionEnvio;
        return $this;
    }

    public function getEnvio(): ?Envio
    {
        return $this->envio;
    }

    public function setEnvio(?Envio $envio): static
    {
        if ($envio === null && $this->envio !== null) {
            $this->envio->setSolicitud(null);
        }

        if ($envio !== null && $envio->getSolicitud() !== $this) {
            $envio->setSolicitud($this);
        }

        $this->envio = $envio;
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

    public function isPendiente(): bool
    {
        return $this->estado === self::ESTADO_PENDIENTE;
    }

    public function isAprobada(): bool
    {
        return $this->estado === self::ESTADO_APROBADA;
    }

    public function isRechazada(): bool
    {
        return $this->estado === self::ESTADO_RECHAZADA;
    }
}
