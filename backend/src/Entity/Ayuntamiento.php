<?php

namespace App\Entity;

use App\Repository\AyuntamientoRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: AyuntamientoRepository::class)]
#[ORM\Table(name: 'ayuntamientos')]
#[ORM\HasLifecycleCallbacks]
class Ayuntamiento
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['ayuntamiento:read', 'usuario:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['ayuntamiento:read', 'ayuntamiento:write', 'usuario:read'])]
    private ?string $nombre = null;

    #[ORM\Column(length: 20, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Regex(pattern: '/^[A-Z][0-9]{8}$/', message: 'CIF inválido')]
    #[Groups(['ayuntamiento:read', 'ayuntamiento:write'])]
    private ?string $cif = null;

    #[ORM\Column(length: 500)]
    #[Groups(['ayuntamiento:read', 'ayuntamiento:write'])]
    private ?string $direccion = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['ayuntamiento:read', 'ayuntamiento:write'])]
    private ?string $telefono = null;

    #[ORM\Column(length: 255)]
    #[Assert\Email]
    #[Groups(['ayuntamiento:read', 'ayuntamiento:write'])]
    private ?string $email = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['ayuntamiento:read', 'ayuntamiento:write'])]
    private ?array $configuracion = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['ayuntamiento:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['ayuntamiento:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToMany(targetEntity: Usuario::class, mappedBy: 'ayuntamiento')]
    private Collection $usuarios;

    #[ORM\OneToMany(targetEntity: Almacen::class, mappedBy: 'ayuntamiento')]
    private Collection $almacenes;

    #[ORM\OneToMany(targetEntity: Objeto::class, mappedBy: 'ayuntamiento')]
    private Collection $objetos;

    #[ORM\OneToMany(targetEntity: Lote::class, mappedBy: 'ayuntamiento')]
    private Collection $lotes;

    #[ORM\ManyToMany(targetEntity: EmpresaLogistica::class, mappedBy: 'ayuntamientos')]
    private Collection $empresasLogisticas;

    public function __construct()
    {
        $this->usuarios = new ArrayCollection();
        $this->almacenes = new ArrayCollection();
        $this->objetos = new ArrayCollection();
        $this->lotes = new ArrayCollection();
        $this->empresasLogisticas = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
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

    public function getCif(): ?string
    {
        return $this->cif;
    }

    public function setCif(string $cif): static
    {
        $this->cif = $cif;
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

    public function getTelefono(): ?string
    {
        return $this->telefono;
    }

    public function setTelefono(?string $telefono): static
    {
        $this->telefono = $telefono;
        return $this;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getConfiguracion(): ?array
    {
        return $this->configuracion;
    }

    public function setConfiguracion(?array $configuracion): static
    {
        $this->configuracion = $configuracion;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * @return Collection<int, Usuario>
     */
    public function getUsuarios(): Collection
    {
        return $this->usuarios;
    }

    public function addUsuario(Usuario $usuario): static
    {
        if (!$this->usuarios->contains($usuario)) {
            $this->usuarios->add($usuario);
            $usuario->setAyuntamiento($this);
        }
        return $this;
    }

    public function removeUsuario(Usuario $usuario): static
    {
        if ($this->usuarios->removeElement($usuario)) {
            if ($usuario->getAyuntamiento() === $this) {
                $usuario->setAyuntamiento(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, Almacen>
     */
    public function getAlmacenes(): Collection
    {
        return $this->almacenes;
    }

    /**
     * @return Collection<int, Objeto>
     */
    public function getObjetos(): Collection
    {
        return $this->objetos;
    }

    /**
     * @return Collection<int, Lote>
     */
    public function getLotes(): Collection
    {
        return $this->lotes;
    }

    /**
     * @return Collection<int, EmpresaLogistica>
     */
    public function getEmpresasLogisticas(): Collection
    {
        return $this->empresasLogisticas;
    }
}
