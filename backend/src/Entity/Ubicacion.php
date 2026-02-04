<?php

namespace App\Entity;

use App\Repository\UbicacionRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UbicacionRepository::class)]
#[ORM\Table(name: 'ubicaciones')]
class Ubicacion
{
    public const TIPO_ESTANTERIA = 'ESTANTERIA';
    public const TIPO_BALDA = 'BALDA';
    public const TIPO_CASILLERO = 'CASILLERO';
    public const TIPO_CAJA = 'CAJA';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ubicacion:read', 'objeto:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Almacen::class, inversedBy: 'ubicaciones')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['ubicacion:read'])]
    private ?Almacen $almacen = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Groups(['ubicacion:read', 'ubicacion:write', 'objeto:read'])]
    private ?string $codigo = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: [
        self::TIPO_ESTANTERIA,
        self::TIPO_BALDA,
        self::TIPO_CASILLERO,
        self::TIPO_CAJA
    ])]
    #[Groups(['ubicacion:read', 'ubicacion:write'])]
    private string $tipo = self::TIPO_CASILLERO;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'hijos')]
    #[ORM\JoinColumn(nullable: true)]
    private ?self $padre = null;

    #[ORM\OneToMany(targetEntity: self::class, mappedBy: 'padre')]
    private Collection $hijos;

    #[ORM\Column(type: 'integer', nullable: true)]
    #[Groups(['ubicacion:read', 'ubicacion:write'])]
    private ?int $capacidad = null;

    #[ORM\Column(type: 'integer')]
    #[Groups(['ubicacion:read'])]
    private int $ocupacionActual = 0;

    public function __construct()
    {
        $this->hijos = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAlmacen(): ?Almacen
    {
        return $this->almacen;
    }

    public function setAlmacen(?Almacen $almacen): static
    {
        $this->almacen = $almacen;
        return $this;
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

    public function getTipo(): string
    {
        return $this->tipo;
    }

    public function setTipo(string $tipo): static
    {
        $this->tipo = $tipo;
        return $this;
    }

    public function getPadre(): ?self
    {
        return $this->padre;
    }

    public function setPadre(?self $padre): static
    {
        $this->padre = $padre;
        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getHijos(): Collection
    {
        return $this->hijos;
    }

    public function addHijo(self $hijo): static
    {
        if (!$this->hijos->contains($hijo)) {
            $this->hijos->add($hijo);
            $hijo->setPadre($this);
        }
        return $this;
    }

    public function removeHijo(self $hijo): static
    {
        if ($this->hijos->removeElement($hijo)) {
            if ($hijo->getPadre() === $this) {
                $hijo->setPadre(null);
            }
        }
        return $this;
    }

    public function getCapacidad(): ?int
    {
        return $this->capacidad;
    }

    public function setCapacidad(?int $capacidad): static
    {
        $this->capacidad = $capacidad;
        return $this;
    }

    public function getOcupacionActual(): int
    {
        return $this->ocupacionActual;
    }

    public function setOcupacionActual(int $ocupacionActual): static
    {
        $this->ocupacionActual = $ocupacionActual;
        return $this;
    }

    public function incrementarOcupacion(): static
    {
        $this->ocupacionActual++;
        return $this;
    }

    public function decrementarOcupacion(): static
    {
        if ($this->ocupacionActual > 0) {
            $this->ocupacionActual--;
        }
        return $this;
    }

    public function tieneEspacio(): bool
    {
        if ($this->capacidad === null) {
            return true;
        }
        return $this->ocupacionActual < $this->capacidad;
    }

    public function getCodigoCompleto(): string
    {
        $codigos = [$this->codigo];
        $padre = $this->padre;

        while ($padre !== null) {
            array_unshift($codigos, $padre->getCodigo());
            $padre = $padre->getPadre();
        }

        return implode('-', $codigos);
    }
}
