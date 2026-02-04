<?php

namespace App\Entity;

use App\Repository\CoincidenciaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: CoincidenciaRepository::class)]
#[ORM\Table(name: 'coincidencias')]
#[ORM\HasLifecycleCallbacks]
class Coincidencia
{
    public const ESTADO_PENDIENTE = 'PENDIENTE';
    public const ESTADO_CONFIRMADA = 'CONFIRMADA';
    public const ESTADO_DESCARTADA = 'DESCARTADA';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['coincidencia:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Objeto::class, inversedBy: 'coincidenciasComoEncontrado')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['coincidencia:read'])]
    private ?Objeto $objetoEncontrado = null;

    #[ORM\ManyToOne(targetEntity: Objeto::class, inversedBy: 'coincidenciasComoPerdido')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['coincidencia:read'])]
    private ?Objeto $objetoPerdido = null;

    #[ORM\Column(type: 'integer')]
    #[Groups(['coincidencia:read'])]
    private int $puntuacion = 0;

    #[ORM\Column(length: 20)]
    #[Groups(['coincidencia:read'])]
    private string $estado = self::ESTADO_PENDIENTE;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['coincidencia:read'])]
    private ?Usuario $validadoPor = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['coincidencia:read'])]
    private ?array $detallesCoincidencia = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['coincidencia:read'])]
    private ?string $notas = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['coincidencia:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $validadoAt = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getObjetoEncontrado(): ?Objeto
    {
        return $this->objetoEncontrado;
    }

    public function setObjetoEncontrado(?Objeto $objetoEncontrado): static
    {
        $this->objetoEncontrado = $objetoEncontrado;
        return $this;
    }

    public function getObjetoPerdido(): ?Objeto
    {
        return $this->objetoPerdido;
    }

    public function setObjetoPerdido(?Objeto $objetoPerdido): static
    {
        $this->objetoPerdido = $objetoPerdido;
        return $this;
    }

    public function getPuntuacion(): int
    {
        return $this->puntuacion;
    }

    public function setPuntuacion(int $puntuacion): static
    {
        $this->puntuacion = max(0, min(100, $puntuacion));
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

    public function getValidadoPor(): ?Usuario
    {
        return $this->validadoPor;
    }

    public function setValidadoPor(?Usuario $validadoPor): static
    {
        $this->validadoPor = $validadoPor;
        return $this;
    }

    public function getDetallesCoincidencia(): ?array
    {
        return $this->detallesCoincidencia;
    }

    public function setDetallesCoincidencia(?array $detallesCoincidencia): static
    {
        $this->detallesCoincidencia = $detallesCoincidencia;
        return $this;
    }

    public function getNotas(): ?string
    {
        return $this->notas;
    }

    public function setNotas(?string $notas): static
    {
        $this->notas = $notas;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getValidadoAt(): ?\DateTimeImmutable
    {
        return $this->validadoAt;
    }

    public function confirmar(Usuario $usuario): static
    {
        $this->estado = self::ESTADO_CONFIRMADA;
        $this->validadoPor = $usuario;
        $this->validadoAt = new \DateTimeImmutable();
        return $this;
    }

    public function descartar(Usuario $usuario, ?string $notas = null): static
    {
        $this->estado = self::ESTADO_DESCARTADA;
        $this->validadoPor = $usuario;
        $this->validadoAt = new \DateTimeImmutable();
        if ($notas) {
            $this->notas = $notas;
        }
        return $this;
    }

    public function isPendiente(): bool
    {
        return $this->estado === self::ESTADO_PENDIENTE;
    }

    public function isConfirmada(): bool
    {
        return $this->estado === self::ESTADO_CONFIRMADA;
    }

    public function isDescartada(): bool
    {
        return $this->estado === self::ESTADO_DESCARTADA;
    }

    public function isAltaProbabilidad(): bool
    {
        return $this->puntuacion >= 70;
    }

    public function isMediaProbabilidad(): bool
    {
        return $this->puntuacion >= 40 && $this->puntuacion < 70;
    }
}
