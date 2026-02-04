<?php

namespace App\Entity;

use App\Repository\PermisoRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: PermisoRepository::class)]
#[ORM\Table(name: 'permisos')]
class Permiso
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['permiso:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 100, unique: true)]
    #[Groups(['permiso:read'])]
    private ?string $codigo = null;

    #[ORM\Column(length: 255)]
    #[Groups(['permiso:read'])]
    private ?string $nombre = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Groups(['permiso:read'])]
    private ?string $descripcion = null;

    #[ORM\Column(length: 100)]
    #[Groups(['permiso:read'])]
    private ?string $modulo = null;

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

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(?string $descripcion): static
    {
        $this->descripcion = $descripcion;
        return $this;
    }

    public function getModulo(): ?string
    {
        return $this->modulo;
    }

    public function setModulo(string $modulo): static
    {
        $this->modulo = $modulo;
        return $this;
    }
}
