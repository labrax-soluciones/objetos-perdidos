<?php

namespace App\Entity;

use App\Repository\SubastaRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: SubastaRepository::class)]
#[ORM\Table(name: 'subastas')]
class Subasta
{
    public const ESTADO_PROGRAMADA = 'PROGRAMADA';
    public const ESTADO_ACTIVA = 'ACTIVA';
    public const ESTADO_CERRADA = 'CERRADA';
    public const ESTADO_ADJUDICADA = 'ADJUDICADA';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['subasta:read', 'subasta:list'])]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: Lote::class, inversedBy: 'subasta')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['subasta:read'])]
    private ?Lote $lote = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['subasta:read', 'subasta:list', 'subasta:write'])]
    private ?string $precioSalida = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['subasta:read', 'subasta:list'])]
    private ?string $precioActual = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['subasta:read', 'subasta:list', 'subasta:write'])]
    private ?\DateTimeInterface $fechaInicio = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE)]
    #[Groups(['subasta:read', 'subasta:list', 'subasta:write'])]
    private ?\DateTimeInterface $fechaFin = null;

    #[ORM\Column(length: 20)]
    #[Groups(['subasta:read', 'subasta:list'])]
    private string $estado = self::ESTADO_PROGRAMADA;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['subasta:read'])]
    private ?Usuario $ganador = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['subasta:read', 'subasta:write'])]
    private ?string $incrementoMinimo = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['subasta:read', 'subasta:write'])]
    private ?string $descripcion = null;

    #[ORM\OneToMany(targetEntity: Puja::class, mappedBy: 'subasta', cascade: ['persist'])]
    #[ORM\OrderBy(['cantidad' => 'DESC'])]
    private Collection $pujas;

    public function __construct()
    {
        $this->pujas = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLote(): ?Lote
    {
        return $this->lote;
    }

    public function setLote(?Lote $lote): static
    {
        $this->lote = $lote;
        return $this;
    }

    public function getPrecioSalida(): ?string
    {
        return $this->precioSalida;
    }

    public function setPrecioSalida(string $precioSalida): static
    {
        $this->precioSalida = $precioSalida;
        return $this;
    }

    public function getPrecioActual(): ?string
    {
        return $this->precioActual;
    }

    public function setPrecioActual(?string $precioActual): static
    {
        $this->precioActual = $precioActual;
        return $this;
    }

    public function getFechaInicio(): ?\DateTimeInterface
    {
        return $this->fechaInicio;
    }

    public function setFechaInicio(\DateTimeInterface $fechaInicio): static
    {
        $this->fechaInicio = $fechaInicio;
        return $this;
    }

    public function getFechaFin(): ?\DateTimeInterface
    {
        return $this->fechaFin;
    }

    public function setFechaFin(\DateTimeInterface $fechaFin): static
    {
        $this->fechaFin = $fechaFin;
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

    public function getGanador(): ?Usuario
    {
        return $this->ganador;
    }

    public function setGanador(?Usuario $ganador): static
    {
        $this->ganador = $ganador;
        return $this;
    }

    public function getIncrementoMinimo(): ?string
    {
        return $this->incrementoMinimo;
    }

    public function setIncrementoMinimo(?string $incrementoMinimo): static
    {
        $this->incrementoMinimo = $incrementoMinimo;
        return $this;
    }

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(?string $descripcion): static
    {
        $this->descripcion = $descripcion;
        return $this;
    }

    /**
     * @return Collection<int, Puja>
     */
    public function getPujas(): Collection
    {
        return $this->pujas;
    }

    public function addPuja(Puja $puja): static
    {
        if (!$this->pujas->contains($puja)) {
            $this->pujas->add($puja);
            $puja->setSubasta($this);
        }
        return $this;
    }

    public function removePuja(Puja $puja): static
    {
        if ($this->pujas->removeElement($puja)) {
            if ($puja->getSubasta() === $this) {
                $puja->setSubasta(null);
            }
        }
        return $this;
    }

    public function getPujaGanadora(): ?Puja
    {
        return $this->pujas->first() ?: null;
    }

    public function isActiva(): bool
    {
        if ($this->estado !== self::ESTADO_ACTIVA) {
            return false;
        }

        $now = new \DateTime();
        return $now >= $this->fechaInicio && $now <= $this->fechaFin;
    }

    public function isProgramada(): bool
    {
        return $this->estado === self::ESTADO_PROGRAMADA;
    }

    public function isCerrada(): bool
    {
        return in_array($this->estado, [self::ESTADO_CERRADA, self::ESTADO_ADJUDICADA]);
    }

    public function getPrecioMinimoSiguientePuja(): string
    {
        $precioBase = $this->precioActual ?? $this->precioSalida;
        $incremento = $this->incrementoMinimo ?? '1.00';

        return bcadd($precioBase, $incremento, 2);
    }

    public function getNumeroParticipantes(): int
    {
        $participantes = [];
        foreach ($this->pujas as $puja) {
            $participantes[$puja->getUsuario()->getId()] = true;
        }
        return count($participantes);
    }
}
