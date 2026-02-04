<?php

namespace App\Entity;

use App\Repository\MovimientoObjetoRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: MovimientoObjetoRepository::class)]
#[ORM\Table(name: 'movimientos_objeto')]
#[ORM\HasLifecycleCallbacks]
class MovimientoObjeto
{
    public const TIPO_ENTRADA = 'ENTRADA';
    public const TIPO_MOVIMIENTO = 'MOVIMIENTO';
    public const TIPO_SALIDA = 'SALIDA';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['movimiento:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Objeto::class, inversedBy: 'movimientos')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Objeto $objeto = null;

    #[ORM\ManyToOne(targetEntity: Ubicacion::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['movimiento:read'])]
    private ?Ubicacion $ubicacionOrigen = null;

    #[ORM\ManyToOne(targetEntity: Ubicacion::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['movimiento:read'])]
    private ?Ubicacion $ubicacionDestino = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class, inversedBy: 'movimientos')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['movimiento:read'])]
    private ?Usuario $usuario = null;

    #[ORM\Column(length: 20)]
    #[Groups(['movimiento:read'])]
    private string $tipo = self::TIPO_ENTRADA;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['movimiento:read'])]
    private ?string $motivo = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['movimiento:read'])]
    private ?string $observaciones = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['movimiento:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
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

    public function getUbicacionOrigen(): ?Ubicacion
    {
        return $this->ubicacionOrigen;
    }

    public function setUbicacionOrigen(?Ubicacion $ubicacionOrigen): static
    {
        $this->ubicacionOrigen = $ubicacionOrigen;
        return $this;
    }

    public function getUbicacionDestino(): ?Ubicacion
    {
        return $this->ubicacionDestino;
    }

    public function setUbicacionDestino(?Ubicacion $ubicacionDestino): static
    {
        $this->ubicacionDestino = $ubicacionDestino;
        return $this;
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

    public function getTipo(): string
    {
        return $this->tipo;
    }

    public function setTipo(string $tipo): static
    {
        $this->tipo = $tipo;
        return $this;
    }

    public function getMotivo(): ?string
    {
        return $this->motivo;
    }

    public function setMotivo(?string $motivo): static
    {
        $this->motivo = $motivo;
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
}
