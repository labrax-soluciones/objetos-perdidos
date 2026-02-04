<?php

namespace App\Entity;

use App\Repository\PujaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: PujaRepository::class)]
#[ORM\Table(name: 'pujas')]
#[ORM\Index(columns: ['subasta_id', 'cantidad'])]
#[ORM\HasLifecycleCallbacks]
class Puja
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['puja:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Subasta::class, inversedBy: 'pujas')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Subasta $subasta = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class, inversedBy: 'pujas')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['puja:read'])]
    private ?Usuario $usuario = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    #[Groups(['puja:read'])]
    private ?string $cantidad = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['puja:read'])]
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

    public function getSubasta(): ?Subasta
    {
        return $this->subasta;
    }

    public function setSubasta(?Subasta $subasta): static
    {
        $this->subasta = $subasta;
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

    public function getCantidad(): ?string
    {
        return $this->cantidad;
    }

    public function setCantidad(string $cantidad): static
    {
        $this->cantidad = $cantidad;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
