<?php

namespace App\Entity;

use App\Repository\CategoriaRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: CategoriaRepository::class)]
#[ORM\Table(name: 'categorias')]
class Categoria
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['categoria:read', 'objeto:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['categoria:read', 'categoria:write', 'objeto:read'])]
    private ?string $nombre = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['categoria:read', 'categoria:write'])]
    private ?string $icono = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Groups(['categoria:read', 'categoria:write'])]
    private ?string $descripcion = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'hijos')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['categoria:read'])]
    private ?self $padre = null;

    #[ORM\OneToMany(targetEntity: self::class, mappedBy: 'padre')]
    private Collection $hijos;

    #[ORM\Column(type: 'integer')]
    #[Groups(['categoria:read', 'categoria:write'])]
    private int $orden = 0;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['categoria:read', 'categoria:write'])]
    private bool $activa = true;

    #[ORM\OneToMany(targetEntity: Objeto::class, mappedBy: 'categoria')]
    private Collection $objetos;

    public function __construct()
    {
        $this->hijos = new ArrayCollection();
        $this->objetos = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getIcono(): ?string
    {
        return $this->icono;
    }

    public function setIcono(?string $icono): static
    {
        $this->icono = $icono;
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

    public function getOrden(): int
    {
        return $this->orden;
    }

    public function setOrden(int $orden): static
    {
        $this->orden = $orden;
        return $this;
    }

    public function isActiva(): bool
    {
        return $this->activa;
    }

    public function setActiva(bool $activa): static
    {
        $this->activa = $activa;
        return $this;
    }

    /**
     * @return Collection<int, Objeto>
     */
    public function getObjetos(): Collection
    {
        return $this->objetos;
    }

    public function getRutaCompleta(): string
    {
        $ruta = [$this->nombre];
        $padre = $this->padre;

        while ($padre !== null) {
            array_unshift($ruta, $padre->getNombre());
            $padre = $padre->getPadre();
        }

        return implode(' > ', $ruta);
    }
}
