<?php

namespace App\Entity;

use App\Repository\AlmacenRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AlmacenRepository::class)]
#[ORM\Table(name: 'almacenes')]
class Almacen
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['almacen:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['almacen:read', 'almacen:write'])]
    private ?string $nombre = null;

    #[ORM\Column(length: 500)]
    #[Groups(['almacen:read', 'almacen:write'])]
    private ?string $direccion = null;

    #[ORM\ManyToOne(targetEntity: Ayuntamiento::class, inversedBy: 'almacenes')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['almacen:read'])]
    private ?Ayuntamiento $ayuntamiento = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['almacen:read', 'almacen:write'])]
    private bool $activo = true;

    #[ORM\OneToMany(targetEntity: Ubicacion::class, mappedBy: 'almacen', cascade: ['persist', 'remove'])]
    private Collection $ubicaciones;

    public function __construct()
    {
        $this->ubicaciones = new ArrayCollection();
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

    public function getDireccion(): ?string
    {
        return $this->direccion;
    }

    public function setDireccion(string $direccion): static
    {
        $this->direccion = $direccion;
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

    public function isActivo(): bool
    {
        return $this->activo;
    }

    public function setActivo(bool $activo): static
    {
        $this->activo = $activo;
        return $this;
    }

    /**
     * @return Collection<int, Ubicacion>
     */
    public function getUbicaciones(): Collection
    {
        return $this->ubicaciones;
    }

    public function addUbicacion(Ubicacion $ubicacion): static
    {
        if (!$this->ubicaciones->contains($ubicacion)) {
            $this->ubicaciones->add($ubicacion);
            $ubicacion->setAlmacen($this);
        }
        return $this;
    }

    public function removeUbicacion(Ubicacion $ubicacion): static
    {
        if ($this->ubicaciones->removeElement($ubicacion)) {
            if ($ubicacion->getAlmacen() === $this) {
                $ubicacion->setAlmacen(null);
            }
        }
        return $this;
    }
}
