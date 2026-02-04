<?php

namespace App\Entity;

use App\Repository\LoteRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: LoteRepository::class)]
#[ORM\Table(name: 'lotes')]
#[ORM\HasLifecycleCallbacks]
class Lote
{
    public const TIPO_SUBASTA = 'SUBASTA';
    public const TIPO_DONACION = 'DONACION';
    public const TIPO_RECICLAJE = 'RECICLAJE';
    public const TIPO_DESTRUCCION = 'DESTRUCCION';

    public const ESTADO_PREPARACION = 'PREPARACION';
    public const ESTADO_PUBLICADO = 'PUBLICADO';
    public const ESTADO_EN_CURSO = 'EN_CURSO';
    public const ESTADO_CERRADO = 'CERRADO';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['lote:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 50, unique: true)]
    #[Groups(['lote:read'])]
    private ?string $codigo = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['lote:read', 'lote:write'])]
    private ?string $nombre = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: [
        self::TIPO_SUBASTA,
        self::TIPO_DONACION,
        self::TIPO_RECICLAJE,
        self::TIPO_DESTRUCCION
    ])]
    #[Groups(['lote:read', 'lote:write'])]
    private string $tipo = self::TIPO_SUBASTA;

    #[ORM\Column(length: 20)]
    #[Groups(['lote:read'])]
    private string $estado = self::ESTADO_PREPARACION;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['lote:read'])]
    private ?\DateTimeImmutable $fechaCreacion = null;

    #[ORM\Column(type: Types::DATETIME_MUTABLE, nullable: true)]
    #[Groups(['lote:read', 'lote:write'])]
    private ?\DateTimeInterface $fechaCierre = null;

    #[ORM\ManyToOne(targetEntity: Ayuntamiento::class, inversedBy: 'lotes')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['lote:read'])]
    private ?Ayuntamiento $ayuntamiento = null;

    #[ORM\OneToMany(targetEntity: Objeto::class, mappedBy: 'lote')]
    #[Groups(['lote:read'])]
    private Collection $objetos;

    #[ORM\OneToOne(targetEntity: Subasta::class, mappedBy: 'lote')]
    private ?Subasta $subasta = null;

    #[ORM\OneToMany(targetEntity: Acta::class, mappedBy: 'lote')]
    private Collection $actas;

    public function __construct()
    {
        $this->objetos = new ArrayCollection();
        $this->actas = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function setCreatedValues(): void
    {
        $this->fechaCreacion = new \DateTimeImmutable();
        if ($this->codigo === null) {
            $this->codigo = 'LOT-' . strtoupper(substr(Uuid::v4()->toBase58(), 0, 8));
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCodigo(): ?string
    {
        return $this->codigo;
    }

    public function setCodigo(string $codigo): static
    {
        $this->codigo = $codigo;
        return $this;
    }

    public function getNombre(): ?string
    {
        return $this->nombre;
    }

    public function setNombre(string $nombre): static
    {
        $this->nombre = $nombre;
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

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): static
    {
        $this->estado = $estado;
        return $this;
    }

    public function getFechaCreacion(): ?\DateTimeImmutable
    {
        return $this->fechaCreacion;
    }

    public function getFechaCierre(): ?\DateTimeInterface
    {
        return $this->fechaCierre;
    }

    public function setFechaCierre(?\DateTimeInterface $fechaCierre): static
    {
        $this->fechaCierre = $fechaCierre;
        return $this;
    }

    public function getAyuntamiento(): ?Ayuntamiento
    {
        return $this->ayuntamiento;
    }

    public function setAyuntamiento(?Ayuntamiento $ayuntamiento): static
    {
        $this->ayuntamiento = $ayuntamiento;
        return $this;
    }

    /**
     * @return Collection<int, Objeto>
     */
    public function getObjetos(): Collection
    {
        return $this->objetos;
    }

    public function addObjeto(Objeto $objeto): static
    {
        if (!$this->objetos->contains($objeto)) {
            $this->objetos->add($objeto);
            $objeto->setLote($this);
        }
        return $this;
    }

    public function removeObjeto(Objeto $objeto): static
    {
        if ($this->objetos->removeElement($objeto)) {
            if ($objeto->getLote() === $this) {
                $objeto->setLote(null);
            }
        }
        return $this;
    }

    public function getSubasta(): ?Subasta
    {
        return $this->subasta;
    }

    public function setSubasta(?Subasta $subasta): static
    {
        if ($subasta === null && $this->subasta !== null) {
            $this->subasta->setLote(null);
        }

        if ($subasta !== null && $subasta->getLote() !== $this) {
            $subasta->setLote($this);
        }

        $this->subasta = $subasta;
        return $this;
    }

    /**
     * @return Collection<int, Acta>
     */
    public function getActas(): Collection
    {
        return $this->actas;
    }

    public function getNumeroObjetos(): int
    {
        return $this->objetos->count();
    }
}
