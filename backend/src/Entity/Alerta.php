<?php

namespace App\Entity;

use App\Repository\AlertaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: AlertaRepository::class)]
#[ORM\Table(name: 'alertas')]
#[ORM\HasLifecycleCallbacks]
class Alerta
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['alerta:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class, inversedBy: 'alertas')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Usuario $ciudadano = null;

    #[ORM\Column(type: Types::JSON)]
    #[Groups(['alerta:read', 'alerta:write'])]
    private array $criterios = [];

    #[ORM\Column(type: 'boolean')]
    #[Groups(['alerta:read', 'alerta:write'])]
    private bool $activa = true;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['alerta:read', 'alerta:write'])]
    private ?string $nombre = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['alerta:read'])]
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

    public function getCiudadano(): ?Usuario
    {
        return $this->ciudadano;
    }

    public function setCiudadano(?Usuario $ciudadano): static
    {
        $this->ciudadano = $ciudadano;
        return $this;
    }

    public function getCriterios(): array
    {
        return $this->criterios;
    }

    public function setCriterios(array $criterios): static
    {
        $this->criterios = $criterios;
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

    public function getNombre(): ?string
    {
        return $this->nombre;
    }

    public function setNombre(?string $nombre): static
    {
        $this->nombre = $nombre;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getCategoriaId(): ?int
    {
        return $this->criterios['categoria_id'] ?? null;
    }

    public function getColor(): ?string
    {
        return $this->criterios['color'] ?? null;
    }

    public function getZona(): ?array
    {
        return $this->criterios['zona'] ?? null;
    }

    public function getPalabrasClave(): ?array
    {
        return $this->criterios['palabras_clave'] ?? null;
    }
}
